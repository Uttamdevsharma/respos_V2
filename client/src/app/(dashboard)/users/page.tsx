'use client';

import { useEffect, useState } from 'react';
import Topbar from '../../../components/layout/topbar';
import api from '../../../lib/api';
import { User, UserRole } from '../../../types';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  UserCheck,
  UserX,
  ToggleLeft,
  ToggleRight,
  Shield,
  RotateCw,
  ChefHat,
  Monitor,
  Receipt,
  UtensilsCrossed,
} from 'lucide-react';

const RESTAURANT_ROLES = [
  {
    role: 'BRANCH_MANAGER',
    label: 'Branch Manager',
    desc: 'Discounts, reports, branch operations, shift closures & staff management',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    role: 'admin',
    label: 'Store Admin',
    desc: 'Complete restaurant POS controls, menu configuration & settings',
    badge: 'bg-primary/10 text-primary-dark border-primary/20',
  },
  {
    role: 'cashier',
    label: 'Cashier',
    desc: 'Takeaway billing, split payments, cash drawer & settlement',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    role: 'kitchen',
    label: 'Kitchen Chef',
    desc: 'Kitchen Display System (KDS), bump bar, recipe preparation alerts',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    role: 'waiter',
    label: 'Waiter / Captain',
    desc: 'Table layout, handheld order taking & instant digital KOT push',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('waiter');
  const [phone, setPhone] = useState('');

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      toast.error('Failed to load user list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('waiter');
    setPhone('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setIsEditing(true);
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setPhone(user.phone || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Name and Email are required');
      return;
    }
    if (!isEditing && password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const payload: any = { name, email, role, phone };
      if (password) payload.password = password;

      if (isEditing && selectedUser) {
        const { data } = await api.put(`/users/${selectedUser._id}`, payload);
        if (data.success) {
          toast.success('Staff profile updated');
          fetchUsers();
          setIsModalOpen(false);
        }
      } else {
        const { data } = await api.post('/users', payload);
        if (data.success) {
          toast.success('Staff member onboarded successfully');
          fetchUsers();
          setIsModalOpen(false);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error saving user');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this staff account?')) return;
    try {
      const { data } = await api.delete(`/users/${userId}`);
      if (data.success) {
        toast.success('Staff account deleted');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to delete staff member');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const { data } = await api.patch(`/users/${user._id}/toggle`);
      if (data.success) {
        toast.success('Staff account status toggled');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to toggle status');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-background">
      <Topbar title="Staff & Roles Management" subtitle="Manage restaurant staff, shifts, and access levels" />

      <main className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Role Matrix Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {RESTAURANT_ROLES.map((r) => (
            <div
              key={r.role}
              className="bg-surface p-3.5 rounded-2xl border border-outline-variant/30 shadow-xs space-y-1"
            >
              <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded border ${r.badge}`}>
                {r.label}
              </span>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>

        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
          <div>
            <h3 className="text-base font-black text-on-surface">Restaurant Staff Directory</h3>
            <p className="text-xs text-on-surface-variant">Active personnel authorized to access POS terminals</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold transition-all press-effect shadow-md shadow-primary/20 cursor-pointer"
            >
              <Plus size={14} />
              Register New Staff
            </button>
            <button
              onClick={() => {
                setLoading(true);
                fetchUsers();
              }}
              className="p-2 bg-surface hover:bg-surface-container-high rounded-xl border border-outline-variant/30 transition-all press-effect cursor-pointer"
            >
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto scroll-hide">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-[10px] font-black uppercase tracking-wider border-b border-outline-variant/30">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Assigned Role</th>
                    <th className="px-6 py-4">Phone Number</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-xs font-medium">
                  {users.map((staff) => (
                    <tr key={staff._id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4 font-black text-on-surface">{staff.name}</td>
                      <td className="px-6 py-4 text-on-surface-variant">{staff.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase border ${
                            staff.role === 'BRANCH_MANAGER'
                              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                              : staff.role === 'admin'
                              ? 'border-primary/30 bg-primary/10 text-primary-dark'
                              : staff.role === 'kitchen'
                              ? 'border-rose-300 bg-rose-50 text-rose-700'
                              : staff.role === 'cashier'
                              ? 'border-amber-300 bg-amber-50 text-amber-700'
                              : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {staff.role === 'BRANCH_MANAGER' ? 'Branch Manager' : staff.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant font-mono">{staff.phone || '—'}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(staff)}
                          className="transition-all press-effect cursor-pointer"
                        >
                          {staff.isActive ? (
                            <ToggleRight className="text-tertiary w-8 h-8" />
                          ) : (
                            <ToggleLeft className="text-outline w-8 h-8 opacity-40" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(staff)}
                            className="p-1.5 hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-colors cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(staff._id)}
                            className="p-1.5 hover:bg-error-container/30 text-error rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ─── ADD / EDIT STAFF MODAL ─────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-outline-variant/30 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <div className="flex justify-between items-center mb-5">
              <h4 className="text-base font-black text-on-surface">
                {isEditing ? 'Edit Staff Credentials' : 'Register Restaurant Staff'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-surface-container-high rounded-lg text-on-surface-variant cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary"
                  required
                  disabled={isEditing}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Password {isEditing && '(Leave blank to keep unchanged)'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary font-mono"
                  required={!isEditing}
                  minLength={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Role & Permission *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary font-bold text-on-surface-variant cursor-pointer"
                  >
                    <option value="waiter">Waiter / Captain</option>
                    <option value="cashier">Cashier</option>
                    <option value="kitchen">Kitchen Chef</option>
                    <option value="BRANCH_MANAGER">Branch Manager</option>
                    <option value="admin">Store Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01711223344"
                    className="w-full px-3 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high text-xs font-bold rounded-xl transition-all press-effect cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-on-primary text-xs font-bold rounded-xl transition-all press-effect shadow-md shadow-primary/20 cursor-pointer"
                >
                  {isEditing ? 'Save Changes' : 'Register Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
