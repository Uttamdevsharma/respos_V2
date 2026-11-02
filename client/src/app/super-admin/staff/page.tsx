'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { User, PlatformRoleItem } from '../../../types';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  Users,
  UserPlus,
  ShieldPlus,
  CheckSquare,
  KeyRound,
  Shield,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building,
  Edit2,
  Trash2,
  Key,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  Search,
  RefreshCw,
  X,
  Check,
  UserCheck,
  UserX,
} from 'lucide-react';

const PERMISSION_MODULES = [
  {
    module: 'Restaurants & Outlets',
    key: 'restaurants',
    permissions: [
      { id: 'restaurants.view', label: 'View Restaurant Directory & KYC', desc: 'Read-only access to restaurant accounts and onboarding documents' },
      { id: 'restaurants.approve', label: 'Approve KYC Verification', desc: 'Authorize newly registered restaurant applications' },
      { id: 'restaurants.reject', label: 'Reject Restaurant KYC', desc: 'Decline applications with remarks' },
      { id: 'restaurants.suspend', label: 'Suspend / Resume Access', desc: 'Lock or unlock restaurant tenant accounts' },
    ],
  },
  {
    module: 'Subscriptions & Payments',
    key: 'billing',
    permissions: [
      { id: 'billing.view', label: 'View Subscriptions & Billing', desc: 'View restaurant subscription statuses and payment history' },
      { id: 'billing.plans', label: 'Manage Subscription Plans', desc: 'Create, modify, and delete pricing tier packages' },
      { id: 'billing.ledger', label: 'Manage Offline Payment Ledger', desc: 'Approve manual bank transfers and mobile payments' },
    ],
  },
  {
    module: 'SMS Management Suite',
    key: 'sms',
    permissions: [
      { id: 'sms.send_sms', label: 'Send SMS & Multi-channel Campaigns', desc: 'Dispatch bulk reminders, offers, and custom SMS' },
      { id: 'sms.gateway_settings', label: 'Configure Telecom Gateways', desc: 'Manage Greenweb, MIM SMS, SSL Wireless credentials' },
      { id: 'sms.logs', label: 'Inspect Delivery Logs & Payloads', desc: 'Audit telecom gateway raw responses and statuses' },
    ],
  },
  {
    module: 'System Notices & Announcements',
    key: 'notices',
    permissions: [
      { id: 'notices.create', label: 'Broadcast Notices & Top Banners', desc: 'Publish announcements and urgent alert ribbons' },
      { id: 'notices.edit', label: 'Edit Active Notices', desc: 'Update content, targeting, and durations' },
      { id: 'notices.delete', label: 'Delete Notices', desc: 'Remove notices and purge read history' },
    ],
  },
  {
    module: 'Quotations System',
    key: 'quotations',
    permissions: [
      { id: 'quotations.create', label: 'Draft Quotations & Proposals', desc: 'Create software and hardware cost estimates' },
      { id: 'quotations.print', label: 'Generate Okobiz Print Sheets', desc: 'Preview and print A4 corporate proposals' },
      { id: 'quotations.email', label: 'Send Quotations via Email', desc: 'Dispatch PDF estimates directly to clients' },
    ],
  },
  {
    module: 'Platform Staff & Governance',
    key: 'staff',
    permissions: [
      { id: 'staff.create', label: 'Onboard Platform Staff', desc: 'Create administrative and support staff accounts' },
      { id: 'staff.edit', label: 'Modify Staff & Permissions', desc: 'Update roles, department assignments, and profile info' },
      { id: 'staff.delete', label: 'Revoke Accounts & Delete Staff', desc: 'Permanently remove staff access to Super Admin' },
    ],
  },
];

function PlatformStaffContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<
    'create-role' | 'permission-assignment' | 'staff-create' | 'staff-list'
  >(
    tabParam === 'create-role'
      ? 'create-role'
      : tabParam === 'permission-assignment'
      ? 'permission-assignment'
      : tabParam === 'staff-create'
      ? 'staff-create'
      : 'staff-list'
  );

  useEffect(() => {
    if (tabParam === 'create-role') {
      setActiveTab('create-role');
    } else if (tabParam === 'permission-assignment') {
      setActiveTab('permission-assignment');
    } else if (tabParam === 'staff-create') {
      setActiveTab('staff-create');
    } else {
      setActiveTab('staff-list');
    }
  }, [tabParam]);

  const handleTabChange = (
    tab: 'create-role' | 'permission-assignment' | 'staff-create' | 'staff-list'
  ) => {
    setActiveTab(tab);
    router.push(`/super-admin/staff?tab=${tab}`);
  };

  // Staff and Role Data
  const [staffList, setStaffList] = useState<User[]>([]);
  const [rolesList, setRolesList] = useState<PlatformRoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffSearch, setStaffSearch] = useState('');

  // ── Tab 1: Create Role Form States ──
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [creatingRole, setCreatingRole] = useState(false);

  // ── Tab 2: Permission Assignment States ──
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<string>('');
  const [currentPermissions, setCurrentPermissions] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // ── Tab 3: Create Staff Form States ──
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createPhone, setCreatePhone] = useState('');
  const [createRole, setCreateRole] = useState('');
  const [createDepartment, setCreateDepartment] = useState('Operations');
  const [submittingStaff, setSubmittingStaff] = useState(false);

  // ── Modals for Staff List ──
  const [editStaffModalOpen, setEditStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [updatingStaff, setUpdatingStaff] = useState(false);

  const [resetPassModalOpen, setResetPassModalOpen] = useState(false);
  const [resetTargetStaff, setResetTargetStaff] = useState<User | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Load Data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, rolesRes] = await Promise.all([
        api.get('/super-admin/staff'),
        api.get('/super-admin/roles'),
      ]);

      if (staffRes.data.success) {
        setStaffList(staffRes.data.data || []);
      }
      if (rolesRes.data.success) {
        const roles = rolesRes.data.data || [];
        setRolesList(roles);
        if (roles.length > 0 && !selectedRoleForPerms) {
          setSelectedRoleForPerms(roles[0].name);
          setCurrentPermissions(roles[0].permissions || []);
          setCreateRole(roles[0].name);
        }
      }
    } catch (e) {
      toast.error('Failed to load platform staff & roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const roleObj = rolesList.find((r) => r.name === selectedRoleForPerms);
    if (roleObj) {
      setCurrentPermissions(roleObj.permissions || []);
    }
  }, [selectedRoleForPerms, rolesList]);

  // ── Create Role Handler ──
  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      toast.error('Please enter a role name');
      return;
    }
    setCreatingRole(true);
    try {
      const res = await api.post('/super-admin/roles', {
        name: newRoleName,
        description: newRoleDesc,
        permissions: [],
      });
      if (res.data.success) {
        toast.success(`Role "${newRoleName}" created successfully!`);
        setNewRoleName('');
        setNewRoleDesc('');
        fetchData();
        setSelectedRoleForPerms(res.data.data.name);
        handleTabChange('permission-assignment');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create role');
    } finally {
      setCreatingRole(false);
    }
  };

  // ── Delete Role Handler ──
  const handleDeleteRole = async (role: PlatformRoleItem) => {
    if (role.is_system) {
      toast.error('Built-in system roles cannot be deleted');
      return;
    }

    const result = await Swal.fire({
      title: `Delete Role "${role.name}"?`,
      text: 'Staff members assigned to this role will lose their mapped permissions.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete role',
    });

    if (result.isConfirmed) {
      try {
        const res = await api.delete(`/super-admin/roles/${role._id}`);
        if (res.data.success) {
          toast.success('Role removed');
          fetchData();
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to delete role');
      }
    }
  };

  // ── Permissions Matrix Toggle Handlers ──
  const handleTogglePermission = (permId: string) => {
    setCurrentPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleToggleModulePermissions = (modulePermIds: string[]) => {
    const allSelected = modulePermIds.every((id) => currentPermissions.includes(id));
    if (allSelected) {
      setCurrentPermissions((prev) => prev.filter((p) => !modulePermIds.includes(p)));
    } else {
      setCurrentPermissions((prev) => Array.from(new Set([...prev, ...modulePermIds])));
    }
  };

  const handleSavePermissions = async () => {
    const roleObj = rolesList.find((r) => r.name === selectedRoleForPerms);
    if (!roleObj) return;

    setSavingPermissions(true);
    try {
      const res = await api.put(`/super-admin/roles/${roleObj._id}`, {
        permissions: currentPermissions,
      });
      if (res.data.success) {
        toast.success(`Permissions updated for role ${roleObj.name}`);
        setRolesList((prev) =>
          prev.map((r) => (r._id === roleObj._id ? { ...r, permissions: currentPermissions } : r))
        );
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  // ── Create Staff Handler ──
  const handleCreateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim() || !createEmail.trim() || !createPassword.trim()) {
      toast.error('Name, email, and password are required');
      return;
    }
    if (createPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSubmittingStaff(true);
    try {
      const res = await api.post('/super-admin/staff', {
        name: createName,
        email: createEmail,
        password: createPassword,
        role: createRole || 'PROJECT_MANAGER',
        phone: createPhone,
        department: createDepartment,
      });
      if (res.data.success) {
        toast.success('Staff member created successfully!');
        setCreateName('');
        setCreateEmail('');
        setCreatePassword('');
        setCreatePhone('');
        fetchData();
        handleTabChange('staff-list');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create staff member');
    } finally {
      setSubmittingStaff(false);
    }
  };

  // ── Toggle Staff Active / Suspended ──
  const handleToggleStaffStatus = async (user: User) => {
    try {
      const res = await api.patch(`/super-admin/staff/${user._id}/toggle`);
      if (res.data.success) {
        toast.success(res.data.message);
        setStaffList((prev) =>
          prev.map((s) => (s._id === user._id ? { ...s, isActive: !s.isActive } : s))
        );
      }
    } catch (e) {
      toast.error('Failed to change account status');
    }
  };

  // ── Open Edit Staff Modal ──
  const handleOpenEditStaff = (user: User) => {
    setEditingStaff(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone || '');
    setEditRole(user.role);
    setEditDepartment(user.department || 'Operations');
    setEditStaffModalOpen(true);
  };

  const handleUpdateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    setUpdatingStaff(true);
    try {
      const res = await api.put(`/super-admin/staff/${editingStaff._id}`, {
        name: editName,
        email: editEmail,
        phone: editPhone,
        role: editRole,
        department: editDepartment,
      });
      if (res.data.success) {
        toast.success('Staff member profile updated');
        setEditStaffModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update staff member');
    } finally {
      setUpdatingStaff(false);
    }
  };

  // ── Reset Password Handlers ──
  const handleOpenResetPass = (user: User) => {
    setResetTargetStaff(user);
    setResetNewPassword('');
    setResetPassModalOpen(true);
  };

  const handleResetPassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetStaff) return;
    if (resetNewPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setResettingPassword(true);
    try {
      const res = await api.post(`/super-admin/staff/${resetTargetStaff._id}/reset-password`, {
        password: resetNewPassword,
      });
      if (res.data.success) {
        toast.success(`Password reset successfully for ${resetTargetStaff.name}`);
        setResetPassModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  // ── Delete Staff Handler ──
  const handleDeleteStaff = async (user: User) => {
    const result = await Swal.fire({
      title: `Remove ${user.name}?`,
      text: 'This user will permanently lose access to the Super Admin platform.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete staff',
    });

    if (result.isConfirmed) {
      try {
        const res = await api.delete(`/super-admin/staff/${user._id}`);
        if (res.data.success) {
          toast.success('Staff member removed');
          setStaffList((prev) => prev.filter((s) => s._id !== user._id));
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to remove staff');
      }
    }
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    if (!staffSearch.trim()) return staffList;
    const q = staffSearch.toLowerCase();
    return staffList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.department && s.department.toLowerCase().includes(q)) ||
        s.role.toLowerCase().includes(q)
    );
  }, [staffList, staffSearch]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="w-7 h-7 sm:w-8 sm:h-8 text-teal-600 shrink-0" />
            Platform Staff &amp; Role Governance
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
            Configure platform staff accounts, assign granular role permissions across modules, and manage access security.
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 sm:gap-8 text-sm sm:text-base font-bold overflow-x-auto">
        {[
          { id: 'staff-list', label: '1. Staff List & Directory', icon: Users },
          { id: 'staff-create', label: '2. Create Staff Account', icon: UserPlus },
          { id: 'create-role', label: '3. Create Role', icon: ShieldPlus },
          { id: 'permission-assignment', label: '4. Permission Assignment Matrix', icon: CheckSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`py-3.5 sm:py-4 border-b-2 flex items-center gap-2.5 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: STAFF LIST */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'staff-list' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                placeholder="Search staff by name, email, department..."
                className="w-full pl-10 pr-3 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleTabChange('staff-create')}
                className="px-4 py-2 sm:py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <UserPlus className="w-4 h-4" />
                Add New Staff
              </button>

              <button
                onClick={fetchData}
                className="px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-xs">
                <tr>
                  <th className="p-3.5 pl-4">Staff Member</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5">Joined Date</th>
                  <th className="p-3.5 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      Loading staff directory...
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No staff members found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((member) => (
                    <tr key={member._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3.5 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-sm shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                              {member.name}
                            </div>
                            <div className="text-xs sm:text-sm text-slate-500 flex items-center gap-2">
                              <span>{member.email}</span>
                              {member.phone && <span>&bull; {member.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          {member.role}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-slate-400" />
                          <span>{member.department || 'Operations'}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStaffStatus(member)}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${
                            member.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              member.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {member.isActive ? 'Active' : 'Suspended'}
                        </button>
                      </td>
                      <td className="p-3.5 text-slate-500 text-xs sm:text-sm">
                        {new Date(member.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="p-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditStaff(member)}
                            title="Edit Staff Info"
                            className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenResetPass(member)}
                            title="Reset Password"
                            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(member)}
                            title="Delete Staff"
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: CREATE STAFF */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'staff-create' && (
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <UserPlus className="w-6 h-6 text-teal-600" />
              Onboard New Platform Staff Member
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Add operational staff with dedicated platform permissions and secured password hashing.
            </p>
          </div>

          <form onSubmit={handleCreateStaffSubmit} className="space-y-4 sm:space-y-5 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs sm:text-sm">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Asif Mahmud"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs sm:text-sm">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="asif@okobiz.com"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs sm:text-sm">
                  Password (Min 6 Characters) *
                </label>
                <div className="relative">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Enter secure password"
                    className="w-full p-3 pr-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm sm:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCreatePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs sm:text-sm">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={createPhone}
                  onChange={(e) => setCreatePhone(e.target.value)}
                  placeholder="01973590937"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs sm:text-sm">
                  Platform Role *
                </label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold cursor-pointer text-sm sm:text-base"
                >
                  {rolesList.map((r) => (
                    <option key={r._id} value={r.name}>
                      {r.name} {r.is_system ? '(System)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs sm:text-sm">
                  Department
                </label>
                <input
                  type="text"
                  value={createDepartment}
                  onChange={(e) => setCreateDepartment(e.target.value)}
                  placeholder="e.g. Operations, IT, Customer Success"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => handleTabChange('staff-list')}
                className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl font-bold cursor-pointer hover:bg-slate-100 text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingStaff}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs text-sm sm:text-base"
              >
                <UserPlus className="w-4.5 h-4.5" />
                {submittingStaff ? 'Creating Staff Member...' : 'Create Staff Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: CREATE ROLE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'create-role' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldPlus className="w-5 h-5 text-teal-600" />
                Create Platform Role
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Define a new role designation to group module permissions.
              </p>
            </div>

            <form onSubmit={handleCreateRoleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs sm:text-sm">
                  Role Name (e.g. REGIONAL_MANAGER) *
                </label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="REGIONAL_MANAGER"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold uppercase text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs sm:text-sm">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Oversees regional branch onboarding and KYC audit..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={creatingRole}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs text-sm sm:text-base"
              >
                <ShieldPlus className="w-4.5 h-4.5" />
                {creatingRole ? 'Creating Role...' : 'Save & Assign Permissions'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              Existing Platform Roles ({rolesList.length})
            </h2>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              {rolesList.map((r) => (
                <div key={r._id} className="py-4 flex items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">{r.name}</span>
                      {r.is_system && (
                        <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          System Default
                        </span>
                      )}
                      <span className="text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 rounded-md">
                        {r.permissions?.length || 0} Permissions
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs sm:text-sm max-w-lg leading-relaxed">{r.description || 'No description provided.'}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRoleForPerms(r.name);
                        handleTabChange('permission-assignment');
                      }}
                      className="px-3.5 py-1.5 text-xs sm:text-sm font-bold text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-xl cursor-pointer"
                    >
                      Assign Matrix
                    </button>
                    {!r.is_system && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(r)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: PERMISSION ASSIGNMENT MATRIX */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'permission-assignment' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          {/* Top Selector & Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-3.5 flex-wrap">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Configuring Role:
              </label>
              <select
                value={selectedRoleForPerms}
                onChange={(e) => setSelectedRoleForPerms(e.target.value)}
                className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm sm:text-base font-black cursor-pointer text-teal-700 dark:text-teal-300"
              >
                {rolesList.map((r) => (
                  <option key={r._id} value={r.name}>
                    {r.name} {r.is_system ? '(System)' : ''}
                  </option>
                ))}
              </select>

              <span className="text-xs sm:text-sm text-slate-400 font-semibold">
                ({currentPermissions.length} Active Permissions)
              </span>
            </div>

            <button
              type="button"
              disabled={savingPermissions}
              onClick={handleSavePermissions}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm sm:text-base font-bold transition-colors cursor-pointer flex items-center gap-2 shadow-xs ml-auto"
            >
              <Check className="w-4.5 h-4.5" />
              {savingPermissions ? 'Saving...' : 'Save Permissions Matrix'}
            </button>
          </div>

          {/* Granular Module Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {PERMISSION_MODULES.map((mod) => {
              const modulePermIds = mod.permissions.map((p) => p.id);
              const allSelected = modulePermIds.every((id) => currentPermissions.includes(id));

              return (
                <div
                  key={mod.key}
                  className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-800/20"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
                        {mod.module}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {mod.permissions.filter((p) => currentPermissions.includes(p.id)).length} of {mod.permissions.length} enabled
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleModulePermissions(modulePermIds)}
                      className="text-xs sm:text-sm font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {mod.permissions.map((perm) => {
                      const isChecked = currentPermissions.includes(perm.id);
                      return (
                        <label
                          key={perm.id}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-teal-50/60 border-teal-500/40 dark:bg-teal-950/30'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(perm.id)}
                            className="w-4.5 h-4.5 text-teal-600 rounded mt-0.5 cursor-pointer"
                          />
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              {perm.label}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-0.5">
                              {perm.desc}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Edit Staff Modal ── */}
      {editStaffModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4.5 h-4.5 text-teal-600" />
                Edit Staff Member
              </h3>
              <button
                onClick={() => setEditStaffModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaffSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Official Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    {rolesList.map((r) => (
                      <option key={r._id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditStaffModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold cursor-pointer text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStaff}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold cursor-pointer text-xs sm:text-sm"
                >
                  {updatingStaff ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ── */}
      {resetPassModalOpen && resetTargetStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                Reset Password
              </h3>
              <button
                onClick={() => setResetPassModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Set a new secure password for <strong className="text-slate-900 dark:text-white">{resetTargetStaff.name}</strong> ({resetTargetStaff.email}).
            </p>

            <form onSubmit={handleResetPassSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  New Password (Min 6 chars) *
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full p-2.5 sm:p-3 pr-11 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showResetPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResetPassModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold cursor-pointer text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer text-xs sm:text-sm"
                >
                  {resettingPassword ? 'Updating...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlatformStaffPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-500">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider">Loading Staff Governance Suite...</p>
        </div>
      }
    >
      <PlatformStaffContent />
    </Suspense>
  );
}
