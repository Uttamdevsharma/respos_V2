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
  RotateCw
} from 'lucide-react';

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
      toast.error('Name and Email are required parameters');
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
          toast.success('User profile updated');
          fetchUsers();
          setIsModalOpen(false);
        }
      } else {
        const { data } = await api.post('/users', payload);
        if (data.success) {
          toast.success('User created successfully');
          fetchUsers();
          setIsModalOpen(false);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error saving user');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user account?')) return;
    try {
      const { data } = await api.delete(`/users/${userId}`);
      if (data.success) {
        toast.success('User deleted');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const { data } = await api.patch(`/users/${user._id}/toggle`);
      if (data.success) {
        toast.success(`User account status updated`);
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to toggle status');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-background">
      <Topbar title="Staff Settings" subtitle="Administer employee roles & access policies" />

      <main className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
          <h3 className="text-base font-black text-on-surface">Restaurant Staff Directory</h3>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold transition-all press-effect shadow-md shadow-primary/20"
            >
              <Plus size={14} />
              Register Staff
            </button>
            <button
              onClick={() => { setLoading(true); fetchUsers(); }}
              className="p-2 bg-surface hover:bg-surface-container-high rounded-xl border border-outline-variant/30 transition-all press-effect"
            >
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="bg-surface rounded-2xl border border-outline-variant/50 shadow-sm overflow-hidden">
            <div className="overflow-x-auto scroll-hide">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-[10px] font-black uppercase tracking-wider border-b border-outline-variant/30">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4 text-center">Active Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-xs font-medium">
                  {users.map((staff) => (
                    <tr key={staff._id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4 font-black text-on-surface">{staff.name}</td>
                      <td className="px-6 py-4 text-on-surface-variant">{staff.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${staff.role === 'admin'
                            ? 'border-primary bg-primary/5 text-primary-dark'
                            : staff.role === 'kitchen'
                              ? 'border-secondary bg-secondary/5 text-secondary'
                              : staff.role === 'cashier'
                                ? 'border-tertiary bg-tertiary/5 text-tertiary'
                                : 'border-outline bg-surface-container text-on-surface-variant'
                          }`}>
                          {staff.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">{staff.phone || 'N/A'}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(staff)}
                          className="transition-all press-effect"
                        >
                          {staff.isActive ? (
                            <ToggleRight className="text-tertiary w-8 h-8" />
                          ) : (
                            <ToggleLeft className="text-on-surface-variant/40 w-8 h-8" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-1.5 mt-1.5">
                        <button
                          onClick={() => handleOpenEdit(staff)}
                          className="p-2 bg-surface-container text-on-surface-variant hover:text-primary rounded-lg transition-all press-effect"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(staff._id)}
                          className="p-2 bg-surface-container text-on-surface-variant hover:text-error rounded-lg transition-all press-effect"
                          disabled={staff.email === 'admin@gastroflow.com'}
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Staff Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-outline-variant/30 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-primary-dark">
                {isEditing ? 'Modify Employee Profile' : 'Register New Employee'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Email Address</label>
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
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary"
                  required={!isEditing}
                  minLength={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Role Permission</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary font-bold text-on-surface-variant"
                  >
                    <option value="waiter">Waiter</option>
                    <option value="cashier">Cashier</option>
                    <option value="kitchen">Kitchen Staff</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high text-xs font-bold rounded-xl transition-all press-effect"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-on-primary text-xs font-bold rounded-xl transition-all press-effect shadow-md shadow-primary/20"
                >
                  Save employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
