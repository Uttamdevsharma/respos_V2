import { Request, Response } from 'express';
import User, { IUser, PlatformRole } from '../../models/User.js';
import PlatformRoleModel, { IPlatformRole } from '../../models/PlatformRole.js';
import { ApiError } from '../../utils/ApiError.js';

const DEFAULT_PLATFORM_ROLES = [
  {
    name: 'SUPER_ADMIN',
    description: 'Full root access to all platform settings, financial gateways, billing, and staff governance.',
    permissions: [
      'restaurants.view', 'restaurants.approve', 'restaurants.reject', 'restaurants.suspend',
      'billing.view', 'billing.plans', 'billing.ledger',
      'sms.send_sms', 'sms.gateway_settings', 'sms.logs',
      'notices.create', 'notices.edit', 'notices.delete',
      'quotations.create', 'quotations.print', 'quotations.email',
      'staff.create', 'staff.edit', 'staff.delete',
    ],
    is_system: true,
  },
  {
    name: 'CTO',
    description: 'Access to SMS gateways, payment APIs, database logs, and technical platform infrastructure.',
    permissions: [
      'restaurants.view',
      'sms.send_sms', 'sms.gateway_settings', 'sms.logs',
      'notices.create', 'notices.edit', 'notices.delete',
      'staff.create', 'staff.edit',
    ],
    is_system: true,
  },
  {
    name: 'PROJECT_MANAGER',
    description: 'Manages restaurant tenant onboarding, KYC verifications, quotations, notices and billing plans.',
    permissions: [
      'restaurants.view', 'restaurants.approve', 'restaurants.reject',
      'billing.view', 'billing.plans',
      'sms.send_sms', 'sms.logs',
      'notices.create', 'notices.edit',
      'quotations.create', 'quotations.print', 'quotations.email',
    ],
    is_system: true,
  },
  {
    name: 'SUPPORT_LEAD',
    description: 'Handles real-time customer live chat support, tenant ticket escalations, and audit viewing.',
    permissions: [
      'restaurants.view',
      'sms.logs',
      'notices.create',
      'quotations.print',
    ],
    is_system: true,
  },
];

export class PlatformStaffController {
  // ─── Staff Member Endpoints ──────────────────────────────────────────

  // 1. Get all SaaS platform staff members
  static async getAll(_req: Request, res: Response): Promise<void> {
    const rolesList = await PlatformRoleModel.find().select('name');
    const roleNames = [
      'SUPER_ADMIN',
      'CTO',
      'PROJECT_MANAGER',
      'SUPPORT_LEAD',
      ...rolesList.map((r) => r.name),
    ];

    const staff = await User.find({
      role: { $in: roleNames },
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: staff,
    });
  }

  // 2. Create a new platform staff member
  static async create(req: Request, res: Response): Promise<void> {
    const { name, email, password, role, phone, department, permissions } = req.body;

    if (!name || !email || !password || !role) {
      throw ApiError.badRequest('Name, email, password, and role are required');
    }

    if (password.length < 6) {
      throw ApiError.badRequest('Password must be at least 6 characters');
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      throw ApiError.conflict('An account with this email address already exists');
    }

    // Inherit permissions from role if not explicitly provided
    let assignedPermissions = Array.isArray(permissions) ? permissions : [];
    if (assignedPermissions.length === 0) {
      const roleDoc = await PlatformRoleModel.findOne({ name: role });
      if (roleDoc) {
        assignedPermissions = roleDoc.permissions || [];
      }
    }

    const staffMember = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      phone: phone?.trim(),
      department: department?.trim() || 'Operations',
      permissions: assignedPermissions,
      restaurant_id: null,
      isActive: true,
    });

    const staffObj = staffMember.toObject();
    delete (staffObj as any).password;

    res.status(201).json({
      success: true,
      message: 'Platform staff member created successfully',
      data: staffObj,
    });
  }

  // 3. Update platform staff member
  static async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { name, email, password, role, phone, department, permissions, isActive } = req.body;

    const staff = await User.findById(id);
    if (!staff) {
      throw ApiError.notFound('Platform staff member not found');
    }

    if (email && email.toLowerCase().trim() !== staff.email) {
      const emailExists = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: id },
      });
      if (emailExists) {
        throw ApiError.conflict('Email is already in use by another user');
      }
      staff.email = email.toLowerCase().trim();
    }

    if (name) staff.name = name.trim();
    if (phone !== undefined) staff.phone = phone.trim();
    if (department !== undefined) staff.department = department.trim();
    if (role) staff.role = role;
    if (permissions !== undefined) staff.permissions = permissions;
    if (isActive !== undefined) staff.isActive = Boolean(isActive);

    if (password && password.trim().length >= 6) {
      staff.password = password;
    }

    await staff.save();

    const staffObj = staff.toObject();
    delete (staffObj as any).password;

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: staffObj,
    });
  }

  // 4. Toggle active status
  static async toggleActive(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const staff = await User.findById(id);
    if (!staff) {
      throw ApiError.notFound('Platform staff member not found');
    }

    staff.isActive = !staff.isActive;
    await staff.save();

    res.json({
      success: true,
      message: `Account has been ${staff.isActive ? 'activated' : 'suspended'}`,
      data: {
        _id: staff._id,
        name: staff.name,
        isActive: staff.isActive,
      },
    });
  }

  // 5. Reset staff password
  static async resetPassword(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.trim().length < 6) {
      throw ApiError.badRequest('New password must be at least 6 characters');
    }

    const staff = await User.findById(id);
    if (!staff) {
      throw ApiError.notFound('Platform staff member not found');
    }

    staff.password = password.trim();
    await staff.save();

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  }

  // 6. Delete staff member
  static async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const staff = await User.findById(id);
    if (!staff) {
      throw ApiError.notFound('Platform staff member not found');
    }

    await staff.deleteOne();

    res.json({
      success: true,
      message: 'Platform staff member removed successfully',
    });
  }

  // ─── Role Governance Endpoints ───────────────────────────────────────

  // 7. Get all Platform Roles (Seeds defaults if empty)
  static async getRoles(_req: Request, res: Response): Promise<void> {
    let roles = await PlatformRoleModel.find().sort({ is_system: -1, createdAt: 1 });

    if (roles.length === 0) {
      // Seed default roles
      await PlatformRoleModel.insertMany(DEFAULT_PLATFORM_ROLES);
      roles = await PlatformRoleModel.find().sort({ is_system: -1, createdAt: 1 });
    }

    res.json({
      success: true,
      data: roles,
    });
  }

  // 8. Create a new Platform Role
  static async createRole(req: Request, res: Response): Promise<void> {
    const { name, description, permissions } = req.body;

    if (!name || !name.trim()) {
      throw ApiError.badRequest('Role name is required');
    }

    const roleName = name.trim().toUpperCase().replace(/\s+/g, '_');
    const existing = await PlatformRoleModel.findOne({ name: roleName });
    if (existing) {
      throw ApiError.conflict('A role with this name already exists');
    }

    const newRole = await PlatformRoleModel.create({
      name: roleName,
      description: description?.trim() || '',
      permissions: Array.isArray(permissions) ? permissions : [],
      is_system: false,
    });

    res.status(201).json({
      success: true,
      message: 'Platform role created successfully',
      data: newRole,
    });
  }

  // 9. Update Role Permissions & Info
  static async updateRole(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { description, permissions } = req.body;

    const role = await PlatformRoleModel.findById(id);
    if (!role) {
      throw ApiError.notFound('Role not found');
    }

    if (description !== undefined) role.description = description.trim();
    if (Array.isArray(permissions)) role.permissions = permissions;

    await role.save();

    res.json({
      success: true,
      message: 'Role permissions updated successfully',
      data: role,
    });
  }

  // 10. Delete Platform Role (Cannot delete system roles)
  static async deleteRole(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const role = await PlatformRoleModel.findById(id);
    if (!role) {
      throw ApiError.notFound('Role not found');
    }

    if (role.is_system) {
      throw ApiError.badRequest('Built-in system roles cannot be deleted');
    }

    await role.deleteOne();

    res.json({
      success: true,
      message: 'Platform role removed successfully',
    });
  }
}
