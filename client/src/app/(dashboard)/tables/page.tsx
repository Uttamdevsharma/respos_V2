'use client';

import { useEffect, useState } from 'react';
import Topbar from '../../../components/layout/topbar';
import api from '../../../lib/api';
import { Table, TableStatus } from '../../../types';
import toast from 'react-hot-toast';
import {
  Users,
  MapPin,
  Clock,
  Check,
  X,
  AlertTriangle,
  RotateCw,
  Plus,
  Trash2,
  Edit2
} from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const { user } = useAuthStore();

  // Dialog states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Form states
  const [number, setNumber] = useState<number>(0);
  const [capacity, setCapacity] = useState<number>(4);
  const [location, setLocation] = useState<string>('');
  const [status, setStatus] = useState<TableStatus>('available');

  const fetchTables = async () => {
    try {
      const { data } = await api.get('/tables');
      if (data.success) {
        setTables(data.data);
      }
    } catch (error: any) {
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setSelectedTable(null);
    setNumber(tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1);
    setCapacity(4);
    setLocation('');
    setStatus('available');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (table: Table) => {
    setIsEditing(true);
    setSelectedTable(table);
    setNumber(table.number);
    setCapacity(table.capacity);
    setLocation(table.location);
    setStatus(table.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalLocation = location.trim();
    if (number <= 0 || capacity <= 0 || !finalLocation) {
      toast.error('Please enter valid table parameters including zone location');
      return;
    }

    try {
      if (isEditing && selectedTable) {
        const { data } = await api.put(`/tables/${selectedTable._id}`, {
          number,
          capacity,
          location: finalLocation,
          status
        });
        if (data.success) {
          toast.success('Table updated successfully');
          fetchTables();
          setIsModalOpen(false);
        }
      } else {
        const { data } = await api.post('/tables', {
          number,
          capacity,
          location: finalLocation,
          status
        });
        if (data.success) {
          toast.success('Table created successfully');
          fetchTables();
          setIsModalOpen(false);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error saving table');
    }
  };

  const handleDelete = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    try {
      const { data } = await api.delete(`/tables/${tableId}`);
      if (data.success) {
        toast.success('Table deleted successfully');
        fetchTables();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete table');
    }
  };

  const handleResetTable = async (table: Table) => {
    try {
      const { data } = await api.patch(`/tables/${table._id}/status`, { status: 'available' });
      if (data.success) {
        toast.success(`Table ${table.number} has been reset to Available`);
        fetchTables();
      }
    } catch (error: any) {
      toast.error('Failed to reset table');
    }
  };

  // Get distinct locations from actual existing tables
  const locations = Array.from(new Set(tables.map(t => t.location).filter(Boolean)));

  // Filter tables
  const filteredTables = tables.filter(t => {
    const statusMatch = filter === 'all' || t.status === filter;
    const locationMatch = locationFilter === 'all' || t.location === locationFilter;
    return statusMatch && locationMatch;
  });

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <Topbar title="Table Selection" subtitle="Manage layout & occupancy" />

      <main className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Filters and CRUD Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-2xl border border-outline-variant/30 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all press-effect ${filter === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              All Statuses
            </button>
            <button
              onClick={() => setFilter('available')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all press-effect ${filter === 'available' ? 'bg-tertiary text-on-tertiary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              Available
            </button>
            <button
              onClick={() => setFilter('occupied')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all press-effect ${filter === 'occupied' ? 'bg-primary-dark text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              Occupied
            </button>
            <button
              onClick={() => setFilter('reserved')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all press-effect ${filter === 'reserved' ? 'bg-secondary text-on-secondary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'}`}
            >
              Reserved
            </button>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-4 py-2 bg-surface border border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant outline-none focus:ring-1 focus:ring-primary w-full sm:w-auto"
            >
              <option value="all">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            {user?.role === 'admin' && (
              <button
                onClick={handleOpenAddModal}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold transition-all press-effect shadow-md shadow-primary/20 shrink-0"
              >
                <Plus size={16} />
                Add Table
              </button>
            )}
          </div>
        </div>

        {/* Tables Grid */}
        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-on-surface-variant text-sm font-medium">Loading floor layout...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTables.map((table) => {
              // Color coding logic
              let stripColor = 'bg-tertiary';
              let statusLabel = 'Available';
              let badgeColor = 'bg-tertiary-container text-tertiary';

              if (table.status === 'occupied') {
                stripColor = 'bg-primary-dark';
                statusLabel = 'Occupied';
                badgeColor = 'bg-primary-container text-primary-dark';
              } else if (table.status === 'reserved') {
                stripColor = 'bg-secondary';
                statusLabel = 'Reserved';
                badgeColor = 'bg-secondary-light text-secondary';
              }

              // Check if order associated with table is ready (pulse badge status)
              const orderStatus = (table.currentOrder as any)?.status;
              const isOrderReady = orderStatus === 'ready';

              if (isOrderReady) {
                stripColor = 'bg-purple-600';
                statusLabel = 'Ready to Serve';
                badgeColor = 'bg-purple-100 text-purple-600 animate-pulse';
              }

              return (
                <div
                  key={table._id}
                  className={`relative bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-5 card-hover group overflow-hidden transition-all ${isOrderReady ? 'border-purple-500 shadow-purple-100' : ''
                    }`}
                >
                  {/* Status Strip */}
                  <div className={`status-strip ${stripColor}`}></div>

                  <div className="pl-3 flex flex-col h-full justify-between gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-black text-on-surface">T-{table.number.toString().padStart(2, '0')}</h3>
                        <p className="text-xs text-on-surface-variant font-medium flex items-center gap-1 mt-1">
                          <Users size={12} />
                          {table.capacity} Seats • {table.location}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${badgeColor}`}>
                        {statusLabel}
                      </span>
                    </div>

                    {/* Metadata body */}
                    <div className="pt-2 border-t border-outline-variant/20 flex-1 min-h-[50px]">
                      {table.status === 'occupied' && table.currentOrder ? (
                        <div className="text-xs space-y-1.5 text-on-surface-variant font-medium">
                          <p className="flex items-center gap-2">
                            <Clock size={12} className="text-primary" />
                            <span>Active Order: <span className="font-bold text-primary">{(table.currentOrder as any).token}</span></span>
                          </p>
                          <p className="flex items-center gap-2">
                            <MapPin size={12} />
                            <span>Waiter: {((table.currentOrder as any).waiter as any)?.name || 'Alex'}</span>
                          </p>
                        </div>
                      ) : table.status === 'reserved' ? (
                        <div className="text-xs text-on-surface-variant italic">
                          Table is reserved for upcoming guests.
                        </div>
                      ) : (
                        <div className="text-xs text-on-surface-variant/60 flex items-center justify-center py-2 border-2 border-dashed border-outline-variant/30 rounded-xl">
                          Ready for guests
                        </div>
                      )}
                    </div>

                    {/* Control Actions */}
                    <div className="flex gap-2 pt-2 border-t border-outline-variant/20">
                      {table.status === 'occupied' && (
                        <button
                          onClick={() => handleResetTable(table)}
                          className="flex-1 py-2 bg-surface-container text-on-surface-variant hover:bg-surface-container-high text-xs font-bold rounded-xl transition-all press-effect"
                        >
                          Free Table
                        </button>
                      )}

                      {user?.role === 'admin' && (
                        <>
                          <button
                            onClick={() => handleOpenEditModal(table)}
                            className="p-2 bg-surface-container-low text-on-surface-variant hover:text-primary rounded-xl transition-all press-effect"
                            title="Edit Table"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(table._id)}
                            className="p-2 bg-surface-container-low text-on-surface-variant hover:text-error rounded-xl transition-all press-effect"
                            title="Delete Table"
                            disabled={table.status === 'occupied'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Dash placeholder to add table */}
            {user?.role === 'admin' && (
              <button
                onClick={handleOpenAddModal}
                className="flex flex-col items-center justify-center p-8 bg-surface-container-lowest border-2 border-dashed border-outline-variant hover:border-primary hover:bg-primary/5 rounded-2xl min-h-[180px] transition-all press-effect group"
              >
                <Plus size={24} className="text-outline group-hover:text-primary transition-all mb-2" />
                <span className="text-xs font-black text-outline group-hover:text-primary transition-all uppercase tracking-wider">
                  New Table
                </span>
              </button>
            )}
          </div>
        )}

        {/* Add/Edit Table Modal Dialog */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/30 animate-scale-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-primary-dark">
                  {isEditing ? 'Modify Table Parameters' : 'Add New Dining Table'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Table Number
                  </label>
                  <input
                    type="number"
                    value={number || ''}
                    onChange={(e) => setNumber(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    value={capacity || ''}
                    onChange={(e) => setCapacity(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary outline-none"
                    required
                    min={1}
                    max={20}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Zone / Location
                  </label>
                  <input
                    type="text"
                    list="zone-suggestions"
                    placeholder="Enter zone name (e.g. Ground Floor, VIP Lounge)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary outline-none font-semibold"
                    required
                  />
                  {locations.length > 0 && (
                    <datalist id="zone-suggestions">
                      {locations.map((loc) => (
                        <option key={loc} value={loc} />
                      ))}
                    </datalist>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TableStatus)}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-sm focus:ring-1 focus:ring-primary outline-none"
                    disabled={isEditing && selectedTable?.status === 'occupied'}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                  </select>
                  {isEditing && selectedTable?.status === 'occupied' && (
                    <p className="text-[10px] text-error mt-1 flex items-center gap-1">
                      <AlertTriangle size={10} /> Occupied tables cannot change status here.
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-outline-variant/30">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high text-sm font-bold rounded-xl transition-all press-effect"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-on-primary text-sm font-bold rounded-xl transition-all press-effect shadow-md shadow-primary/20"
                  >
                    {isEditing ? 'Save Changes' : 'Create Table'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
