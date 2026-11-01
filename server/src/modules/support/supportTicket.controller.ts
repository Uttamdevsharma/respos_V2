import { Response, NextFunction } from 'express';
import SupportTicket, {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../../models/SupportTicket.js';
import TicketReply from '../../models/TicketReply.js';
import Restaurant from '../../models/Restaurant.js';
import { AuthRequest } from '../../middleware/auth.js';
import { ApiError } from '../../utils/ApiError.js';
import { emitTicketEvent } from '../../config/socket.js';
import { uploadFileSafe } from '../../utils/fileUpload.js';

// Helper to generate next Ticket No: TKT-2026-0001
const generateTicketNumber = async (): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `TKT-${currentYear}-`;

  const lastTicket = (await SupportTicket.findOne({
    ticket_no: { $regex: `^${yearPrefix}` },
  })
    .sort({ created_at: -1, _id: -1 })
    .select('ticket_no')
    .lean()) as { ticket_no?: string } | null;

  let nextSequence = 1;
  if (lastTicket && lastTicket.ticket_no) {
    const parts = lastTicket.ticket_no.split('-');
    if (parts.length >= 3) {
      const seq = parseInt(parts[2], 10);
      if (!isNaN(seq)) {
        nextSequence = seq + 1;
      }
    }
  }

  const paddedSeq = nextSequence.toString().padStart(4, '0');
  return `${yearPrefix}${paddedSeq}`;
};

// ==========================================
// TENANT CONTROLLERS
// ==========================================

export const createTenantTicket = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { subject, message, category, priority, attachments } = req.body;

    if (!subject || !message) {
      throw ApiError.badRequest('Subject and detailed message are required');
    }

    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId && req.user?.role !== 'SUPER_ADMIN') {
      throw ApiError.badRequest('User must be associated with a restaurant/business');
    }

    const ticket_no = await generateTicketNumber();

    const validCategory: TicketCategory = ['BUG', 'FEATURE', 'QUERY'].includes(category)
      ? category
      : 'QUERY';
    const validPriority: TicketPriority = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)
      ? priority
      : 'MEDIUM';

    const ticket = await SupportTicket.create({
      ticket_no,
      restaurant_id: restaurantId || null,
      user_id: req.user?._id,
      subject: subject.trim(),
      message: message.trim(),
      category: validCategory,
      priority: validPriority,
      status: 'PENDING',
      attachments: Array.isArray(attachments) ? attachments : [],
      is_admin_read: false,
    });

    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate('restaurant_id', 'name contact_number email')
      .populate('user_id', 'name email');

    emitTicketEvent(ticket._id.toString(), 'supportTicket:created', {
      ticket: populatedTicket,
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: populatedTicket,
    });
  } catch (error) {
    next(error);
  }
};

export const getTenantTickets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurantId = req.user?.restaurant_id;
    if (!restaurantId && req.user?.role !== 'SUPER_ADMIN') {
      throw ApiError.badRequest('Restaurant not found for user');
    }

    const { status, category, priority, search } = req.query;

    const query: Record<string, any> = { restaurant_id: restaurantId };

    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (category && category !== 'ALL') {
      query.category = category;
    }
    if (priority && priority !== 'ALL') {
      query.priority = priority;
    }
    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ ticket_no: regex }, { subject: regex }, { message: regex }];
    }

    const tickets = await SupportTicket.find(query)
      .populate('user_id', 'name email')
      .sort({ updated_at: -1, created_at: -1 });

    res.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

export const getTicketDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const ticket = await SupportTicket.findById(id)
      .populate('restaurant_id', 'name contact_number email')
      .populate('user_id', 'name email');

    if (!ticket) {
      throw ApiError.notFound('Ticket not found');
    }

    // Authorization check: tenant users can only access their restaurant's tickets
    if (
      req.user?.role !== 'SUPER_ADMIN' &&
      ticket.restaurant_id?._id.toString() !== req.user?.restaurant_id
    ) {
      throw ApiError.forbidden('Access denied to this ticket');
    }

    // Mark admin read if super admin opens it
    if (req.user?.role === 'SUPER_ADMIN' && !ticket.is_admin_read) {
      ticket.is_admin_read = true;
      await ticket.save();
    }

    const replies = await TicketReply.find({ ticket_id: ticket._id })
      .populate('sender_id', 'name email role')
      .sort({ created_at: 1 });

    res.json({
      success: true,
      data: {
        ticket,
        replies,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const postTicketReply = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { message, attachments } = req.body;

    if (!message && (!attachments || attachments.length === 0)) {
      throw ApiError.badRequest('Reply message is required');
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      throw ApiError.notFound('Ticket not found');
    }

    // Security check
    if (
      req.user?.role !== 'SUPER_ADMIN' &&
      ticket.restaurant_id.toString() !== req.user?.restaurant_id
    ) {
      throw ApiError.forbidden('Access denied to this ticket');
    }

    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const sender_type = isSuperAdmin ? 'SUPER_ADMIN' : 'TENANT_USER';

    const reply = await TicketReply.create({
      ticket_id: ticket._id,
      sender_id: req.user?._id,
      sender_type,
      message: message || '',
      attachments: Array.isArray(attachments) ? attachments : [],
      is_read: false,
    });

    const populatedReply = await TicketReply.findById(reply._id).populate(
      'sender_id',
      'name email role'
    );

    // Update ticket metadata
    ticket.updated_at = new Date();
    if (!isSuperAdmin) {
      ticket.is_admin_read = false; // Notify admin
    } else {
      ticket.is_admin_read = true;
    }
    await ticket.save();

    emitTicketEvent(ticket._id.toString(), 'supportTicket:reply', {
      reply: populatedReply,
      ticket,
    });

    res.status(201).json({
      success: true,
      data: populatedReply,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadTicketAttachment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw ApiError.badRequest('No file uploaded');
    }

    const fileUrl = await uploadFileSafe(req.file, 'support-attachments');

    res.json({
      success: true,
      data: {
        url: fileUrl,
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// SUPER ADMIN CONTROLLERS
// ==========================================

export const getAdminTicketStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const totalTickets = await SupportTicket.countDocuments();
    const pending = await SupportTicket.countDocuments({ status: 'PENDING' });
    const inProgress = await SupportTicket.countDocuments({
      status: { $in: ['CHECKING', 'WORKING', 'TESTING'] },
    });
    const solved = await SupportTicket.countDocuments({
      status: { $in: ['SOLVED', 'CLOSED'] },
    });

    res.json({
      success: true,
      data: {
        totalTickets,
        pending,
        inProgress,
        solved,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminTickets = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { restaurant_id, status, category, priority, search } = req.query;

    const query: Record<string, any> = {};

    if (restaurant_id && restaurant_id !== 'ALL') {
      query.restaurant_id = restaurant_id;
    }
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (category && category !== 'ALL') {
      query.category = category;
    }
    if (priority && priority !== 'ALL') {
      query.priority = priority;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ ticket_no: regex }, { subject: regex }, { message: regex }];
    }

    const tickets = await SupportTicket.find(query)
      .populate('restaurant_id', 'name contact_number email')
      .populate('user_id', 'name email')
      .sort({ updated_at: -1, created_at: -1 });

    res.json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminTicketStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    const ticket = await SupportTicket.findById(id)
      .populate('restaurant_id', 'name contact_number email')
      .populate('user_id', 'name email');

    if (!ticket) {
      throw ApiError.notFound('Ticket not found');
    }

    if (status && ['PENDING', 'CHECKING', 'WORKING', 'TESTING', 'SOLVED', 'CLOSED'].includes(status)) {
      ticket.status = status as TicketStatus;
    }

    if (priority && ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
      ticket.priority = priority as TicketPriority;
    }

    ticket.updated_at = new Date();
    await ticket.save();

    emitTicketEvent(ticket._id.toString(), 'supportTicket:statusChanged', {
      ticket,
    });

    res.json({
      success: true,
      message: 'Ticket updated successfully',
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const getRestaurantsList = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const restaurants = await Restaurant.find().select('name contact_number email status').sort({ name: 1 });
    res.json({
      success: true,
      data: restaurants,
    });
  } catch (error) {
    next(error);
  }
};
