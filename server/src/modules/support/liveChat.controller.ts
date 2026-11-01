import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import LiveChatSession, { LiveChatDepartment, LiveChatStatus } from '../../models/LiveChatSession.js';
import LiveChatMessage from '../../models/LiveChatMessage.js';
import { AuthRequest } from '../../middleware/auth.js';
import { ApiError } from '../../utils/ApiError.js';
import { emitChatEvent } from '../../config/socket.js';

// ==========================================
// PUBLIC VISITOR CONTROLLERS
// ==========================================

export const createVisitorSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { visitor_name, visitor_email, visitor_phone, department, current_url, user_agent } = req.body;

    if (!visitor_name || !visitor_email) {
      throw ApiError.badRequest('Name and Email are required to start chat');
    }

    const session_token = `lcs_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const validDepartment: LiveChatDepartment = ['SALES', 'TECH_SUPPORT', 'BILLING', 'GENERAL'].includes(department)
      ? department
      : 'GENERAL';

    const session = await LiveChatSession.create({
      session_token,
      visitor_name: visitor_name.trim(),
      visitor_email: visitor_email.trim().toLowerCase(),
      visitor_phone: visitor_phone ? visitor_phone.trim() : '',
      department: validDepartment,
      status: 'WAITING',
      current_url: current_url || '/',
      user_agent: user_agent || req.headers['user-agent'] || '',
      last_message_at: new Date(),
    });

    // Create initial automated system welcome greeting
    const welcomeMsg = await LiveChatMessage.create({
      session_id: session._id,
      sender_type: 'SYSTEM',
      sender_name: 'Support System',
      message: `Hello ${visitor_name.trim()}! Welcome to Restobiz Support. A customer specialist will be with you shortly. How can we help you today?`,
      attachments: [],
      is_read: true,
    });

    emitChatEvent(session_token, 'liveChat:newSession', { session });

    res.status(201).json({
      success: true,
      message: 'Chat session started successfully',
      data: {
        session,
        token: session_token,
        initialMessage: welcomeMsg,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getVisitorSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;

    const session = await LiveChatSession.findOne({ session_token: token });
    if (!session) {
      throw ApiError.notFound('Live chat session not found or expired');
    }

    const messages = await LiveChatMessage.find({ session_id: session._id }).sort({ created_at: 1 });

    res.json({
      success: true,
      data: {
        session,
        messages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const postVisitorMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;
    const { message, attachments } = req.body;

    if (!message && (!attachments || attachments.length === 0)) {
      throw ApiError.badRequest('Message content is required');
    }

    const session = await LiveChatSession.findOne({ session_token: token });
    if (!session) {
      throw ApiError.notFound('Live chat session not found');
    }

    if (session.status === 'CLOSED') {
      // Reopen session if closed
      session.status = 'WAITING';
    }

    const newMessage = await LiveChatMessage.create({
      session_id: session._id,
      sender_type: 'VISITOR',
      sender_name: session.visitor_name,
      message: message || '',
      attachments: Array.isArray(attachments) ? attachments : [],
      is_read: false,
    });

    session.last_message_at = new Date();
    await session.save();

    emitChatEvent(session.session_token, 'liveChat:message', {
      message: newMessage,
      session,
    });

    res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    next(error);
  }
};

export const endVisitorSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.params;

    const session = await LiveChatSession.findOne({ session_token: token });
    if (!session) {
      throw ApiError.notFound('Live chat session not found');
    }

    session.status = 'CLOSED';
    await session.save();

    const endMsg = await LiveChatMessage.create({
      session_id: session._id,
      sender_type: 'SYSTEM',
      sender_name: 'Support System',
      message: 'Chat session was ended by the visitor.',
      attachments: [],
      is_read: true,
    });

    emitChatEvent(session.session_token, 'liveChat:statusChanged', {
      session,
      message: endMsg,
    });

    res.json({
      success: true,
      message: 'Chat session ended',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// SUPER ADMIN CONTROLLERS
// ==========================================

export const getLiveChatStats = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const totalChats = await LiveChatSession.countDocuments();
    const waitingResponse = await LiveChatSession.countDocuments({ status: 'WAITING' });
    const activeChats = await LiveChatSession.countDocuments({ status: 'ACTIVE' });
    const resolvedChats = await LiveChatSession.countDocuments({ status: { $in: ['RESOLVED', 'CLOSED'] } });

    res.json({
      success: true,
      data: {
        allChats: totalChats,
        waitingResponse,
        activeChats,
        resolvedChats,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminSessions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { department, status, search } = req.query;

    const query: Record<string, any> = {};

    if (department && department !== 'ALL') {
      query.department = department;
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { visitor_name: regex },
        { visitor_email: regex },
        { visitor_phone: regex },
      ];
    }

    const sessions = await LiveChatSession.find(query)
      .populate('assigned_user_id', 'name email role')
      .sort({ last_message_at: -1, created_at: -1 })
      .lean();

    // Fetch last message for each session
    const sessionIds = sessions.map((s: any) => s._id);
    const lastMessages = await LiveChatMessage.aggregate([
      { $match: { session_id: { $in: sessionIds } } },
      { $sort: { created_at: -1 } },
      {
        $group: {
          _id: '$session_id',
          lastMessage: { $first: '$message' },
          sender_type: { $first: '$sender_type' },
          created_at: { $first: '$created_at' },
        },
      },
    ]);

    const lastMsgMap = new Map<string, any>();
    lastMessages.forEach((m: any) => {
      lastMsgMap.set(m._id.toString(), m);
    });

    const sessionsWithLastMsg = sessions.map((s: any) => ({
      ...s,
      lastMessagePreview: lastMsgMap.get(s._id.toString())?.lastMessage || '',
      lastMessageSender: lastMsgMap.get(s._id.toString())?.sender_type || '',
    }));

    res.json({
      success: true,
      data: sessionsWithLastMsg,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminSessionDetails = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const session = await LiveChatSession.findById(id).populate('assigned_user_id', 'name email role');
    if (!session) {
      throw ApiError.notFound('Session not found');
    }

    const messages = await LiveChatMessage.find({ session_id: session._id }).sort({ created_at: 1 });

    // Mark visitor messages as read
    await LiveChatMessage.updateMany(
      { session_id: session._id, sender_type: 'VISITOR', is_read: false },
      { is_read: true }
    );

    res.json({
      success: true,
      data: {
        session,
        messages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const postAdminMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { message, attachments } = req.body;

    if (!message && (!attachments || attachments.length === 0)) {
      throw ApiError.badRequest('Message content is required');
    }

    const session = await LiveChatSession.findById(id);
    if (!session) {
      throw ApiError.notFound('Session not found');
    }

    // Auto mark as ACTIVE if it was WAITING
    if (session.status === 'WAITING') {
      session.status = 'ACTIVE';
    }
    if (!session.assigned_user_id && req.user?._id) {
      session.assigned_user_id = req.user._id as any;
    }
    session.last_message_at = new Date();
    await session.save();

    const newMessage = await LiveChatMessage.create({
      session_id: session._id,
      sender_type: 'AGENT',
      sender_name: req.user?.name || 'Support Agent',
      message: message || '',
      attachments: Array.isArray(attachments) ? attachments : [],
      is_read: true,
    });

    emitChatEvent(session.session_token, 'liveChat:message', {
      message: newMessage,
      session,
    });

    res.status(201).json({
      success: true,
      data: newMessage,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminSessionStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, assigned_user_id } = req.body;

    const session = await LiveChatSession.findById(id);
    if (!session) {
      throw ApiError.notFound('Session not found');
    }

    if (status && ['WAITING', 'ACTIVE', 'RESOLVED', 'CLOSED'].includes(status)) {
      session.status = status as LiveChatStatus;
    }

    if (assigned_user_id !== undefined) {
      session.assigned_user_id = assigned_user_id || null;
    }

    await session.save();

    emitChatEvent(session.session_token, 'liveChat:statusChanged', {
      session,
    });

    res.json({
      success: true,
      message: 'Session updated successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};
