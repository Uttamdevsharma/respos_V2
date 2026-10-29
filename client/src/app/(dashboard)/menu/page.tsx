'use client';

import { useEffect, useState } from 'react';
import Topbar from '../../../components/layout/topbar';
import api, { BASE_URL, getImageUrl } from '../../../lib/api';
import { Category, MenuItem } from '../../../types';
import { formatCurrency } from '../../../lib/constants';
import toast from 'react-hot-toast';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RotateCw,
  FolderOpen
} from 'lucide-react';

import { useAuthStore } from '../../../store/auth.store';

interface SizeOption {
  name: string;
  price: number;
}

export default function MenuPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Category Modal Form state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isCatEditing, setIsCatEditing] = useState(false);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catSortOrder, setCatSortOrder] = useState<number>(0);

  // Menu Item Modal Form state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isItemEditing, setIsItemEditing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState<number>(0);
  const [itemCategory, setItemCategory] = useState('');
  const [itemAvailable, setItemAvailable] = useState(true);
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  // Multiple Sizes / Options state
  const [optionGroupTitle, setOptionGroupTitle] = useState<string>('Size');
  const [itemSizes, setItemSizes] = useState<SizeOption[]>([]);

  const fetchData = async () => {
    try {
      const [catRes, menuRes] = await Promise.all([
        api.get('/categories'),
        api.get('/menu')
      ]);

      if (catRes.data.success) setCategories(catRes.data.data);
      if (menuRes.data.success) setMenuItems(menuRes.data.data);
    } catch (error) {
      toast.error('Failed to sync menu lookup lists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Category CRUD
  const handleOpenCatAdd = () => {
    setIsCatEditing(false);
    setSelectedCat(null);
    setCatName('');
    setCatDescription('');
    setCatSortOrder(categories.length);
    setIsCatModalOpen(true);
  };

  const handleOpenCatEdit = (cat: Category) => {
    setIsCatEditing(true);
    setSelectedCat(cat);
    setCatName(cat.name);
    setCatDescription(cat.description || '');
    setCatSortOrder(cat.sortOrder);
    setIsCatModalOpen(true);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (isCatEditing && selectedCat) {
        const { data } = await api.put(`/categories/${selectedCat._id}`, {
          name: catName,
          description: catDescription,
          sortOrder: catSortOrder
        });
        if (data.success) {
          toast.success('Category updated');
          fetchData();
          setIsCatModalOpen(false);
        }
      } else {
        const { data } = await api.post('/categories', {
          name: catName,
          description: catDescription,
          sortOrder: catSortOrder
        });
        if (data.success) {
          toast.success('Category created');
          fetchData();
          setIsCatModalOpen(false);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error saving category');
    }
  };

  const handleCatDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? All items inside will lose their category.')) return;
    try {
      const { data } = await api.delete(`/categories/${id}`);
      if (data.success) {
        toast.success('Category removed');
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove category');
    }
  };

  // Menu Item CRUD
  const handleOpenItemAdd = () => {
    setIsItemEditing(false);
    setSelectedItem(null);
    setItemName('');
    setItemDescription('');
    setItemPrice(0);
    setItemCategory(categories[0]?._id || '');
    setItemAvailable(true);
    setItemImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    setOptionGroupTitle('Size');
    setItemSizes([]);
    setIsItemModalOpen(true);
  };

  const handleOpenItemEdit = (item: MenuItem) => {
    setIsItemEditing(true);
    setSelectedItem(item);
    setItemName(item.name);
    setItemDescription(item.description || '');
    setItemPrice(item.price);
    setItemCategory(typeof item.category === 'string' ? item.category : item.category._id);
    setItemAvailable(item.isAvailable);
    setItemImageFile(null);
    setImagePreview(item.image ? getImageUrl(item.image) : null);
    setRemoveImage(false);

    if (item.optionGroups && item.optionGroups.length > 0) {
      setOptionGroupTitle(item.optionGroups[0].title || 'Size');
      setItemSizes(item.optionGroups[0].options || []);
    } else {
      setOptionGroupTitle('Size');
      setItemSizes([]);
    }

    setIsItemModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setItemImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveImage(false);
    }
  };

  const handleClearImage = () => {
    setItemImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
  };

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || itemPrice < 0 || !itemCategory) {
      toast.error('Please input all required parameters');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', itemName);
      formData.append('description', itemDescription);
      formData.append('price', itemPrice.toString());
      formData.append('category', itemCategory);
      formData.append('isAvailable', itemAvailable.toString());

      if (itemImageFile) {
        formData.append('image', itemImageFile);
      } else if (removeImage) {
        formData.append('removeImage', 'true');
      }

      // Append optionGroups if configured
      const validSizes = itemSizes.filter(s => s.name.trim() !== '');
      if (validSizes.length > 0) {
        const optionGroups = [{
          title: optionGroupTitle.trim() || 'Size',
          required: true,
          options: validSizes.map(s => ({ name: s.name.trim(), price: Number(s.price) || 0 }))
        }];
        formData.append('optionGroups', JSON.stringify(optionGroups));
      } else {
        formData.append('optionGroups', JSON.stringify([]));
      }

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };

      if (isItemEditing && selectedItem) {
        const { data } = await api.put(`/menu/${selectedItem._id}`, formData, config);
        if (data.success) {
          toast.success('Menu item modified');
          fetchData();
          setIsItemModalOpen(false);
        }
      } else {
        const { data } = await api.post('/menu', formData, config);
        if (data.success) {
          toast.success('Menu item added');
          fetchData();
          setIsItemModalOpen(false);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error saving menu item');
    }
  };

  const handleItemDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const { data } = await api.delete(`/menu/${id}`);
      if (data.success) {
        toast.success('Menu item deleted');
        fetchData();
      }
    } catch (error: any) {
      toast.error('Failed to delete menu item');
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      const { data } = await api.patch(`/menu/${item._id}/toggle`);
      if (data.success) {
        toast.success(`Availability toggled for ${item.name}`);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to toggle availability');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-background">
      <Topbar title="Menu Catalog" subtitle="Manage dished catalog & categories" />

      <main className="p-3 sm:p-6 max-w-7xl space-y-4 sm:space-y-6">

        {/* ── Category Management Strip ── */}
        <section className="bg-surface rounded-2xl border border-outline-variant/30 p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="text-primary w-5 h-5" />
              <h3 className="text-sm font-black text-on-surface">Categories Overview</h3>
            </div>
            {isAdmin && (
              <button
                onClick={handleOpenCatAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-container text-primary-dark rounded-xl text-xs font-bold hover:bg-primary-container/80 transition-all press-effect"
              >
                <Plus size={14} />
                Add Category
              </button>
            )}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {categories.map((cat) => (
              <div
                key={cat._id}
                className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs font-semibold shrink-0 group"
              >
                <span>{cat.name}</span>
                {isAdmin && (
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenCatEdit(cat)} className="hover:text-primary p-0.5">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleCatDelete(cat._id)} className="hover:text-error p-0.5">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Menu Items Table ── */}
        <section className="bg-surface rounded-2xl border border-outline-variant/30 shadow-sm p-4 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-black text-on-surface">Catalog Items</h3>
              <p className="text-xs text-on-surface-variant">Dishes available for waiter POS entry</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setLoading(true); fetchData(); }}
                className="p-2 bg-surface hover:bg-surface-container-high rounded-xl border border-outline-variant/30 transition-all press-effect"
              >
                <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
              {isAdmin && (
                <button
                  onClick={handleOpenItemAdd}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:brightness-110 transition-all press-effect shadow-md shadow-primary/20"
                >
                  <Plus size={16} />
                  New Catalog Item
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-full inline-block align-middle">
                <table className="min-w-full divide-y divide-outline-variant/20">
                  <thead>
                    <tr className="text-left text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      <th className="py-3 px-4">Item details</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Base Price</th>
                      <th className="py-3 px-4">Sizes &amp; Options</th>
                      <th className="py-3 px-4">Status</th>
                      {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10 text-xs">
                    {menuItems.map((item) => (
                      <tr key={item._id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <img
                                src={getImageUrl(item.image)}
                                alt={item.name}
                                className="w-10 h-10 rounded-xl object-cover border border-outline-variant/20"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-center text-on-surface-variant/40">
                                <Sparkles size={16} />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-on-surface">{item.name}</p>
                              {item.description && (
                                <p className="text-[10px] text-on-surface-variant line-clamp-1">{item.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-on-surface-variant">
                          {typeof item.category === 'object' && item.category !== null ? item.category.name : 'Uncategorized'}
                        </td>
                        <td className="py-3 px-4 font-black text-primary">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="py-3 px-4">
                          {item.optionGroups && item.optionGroups.length > 0 && item.optionGroups[0].options?.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {item.optionGroups[0].options.map((opt, i) => (
                                <span key={i} className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded-md font-bold text-on-surface-variant">
                                  {opt.name} {opt.price > 0 ? `(+${opt.price})` : ''}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-on-surface-variant/40 italic">Single Size</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            disabled={!isAdmin}
                            onClick={() => handleToggleAvailability(item)}
                            className="flex items-center gap-1.5 font-bold"
                          >
                            {item.isAvailable ? (
                              <>
                                <ToggleRight className="text-tertiary w-5 h-5" />
                                <span className="text-tertiary text-[10px] uppercase tracking-wider">Active</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="text-on-surface-variant/40 w-5 h-5" />
                                <span className="text-on-surface-variant/50 text-[10px] uppercase tracking-wider">Unavailable</span>
                              </>
                            )}
                          </button>
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenItemEdit(item)}
                                className="p-1.5 bg-surface hover:bg-surface-container-high rounded-lg text-on-surface-variant transition-all border border-outline-variant/30"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleItemDelete(item._id)}
                                className="p-1.5 bg-error-container/50 hover:bg-error-container text-error rounded-lg transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {menuItems.length === 0 && (
                      <tr>
                        <td colSpan={isAdmin ? 6 : 5} className="text-center py-10 text-on-surface-variant font-medium">No menu items configured.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Category CRUD Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-outline-variant/30 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-primary-dark">
                {isCatEditing ? 'Edit Category Details' : 'Create New Category'}
              </h3>
              <button onClick={() => setIsCatModalOpen(false)} className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCatSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Name</label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-4.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  className="w-full px-4.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary h-20"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Sorting Priority</label>
                <input
                  type="number"
                  value={catSortOrder}
                  onChange={(e) => setCatSortOrder(parseInt(e.target.value) || 0)}
                  className="w-full px-4.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high text-xs font-bold rounded-xl transition-all press-effect"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-on-primary text-xs font-bold rounded-xl transition-all press-effect shadow-md shadow-primary/20"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Item CRUD Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-outline-variant/30 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-black text-primary-dark">
                {isItemEditing ? 'Edit Menu Dish Parameters' : 'Create New Menu Catalog Item'}
              </h3>
              <button onClick={() => setIsItemModalOpen(false)} className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleItemSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Item Title</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-4.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Description / Ingredients</label>
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full px-4.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary h-16 font-medium resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Dish Image (Optional)</label>
                <div className="flex items-center gap-3">
                  {imagePreview ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-surface-container border border-outline-variant/30 flex-shrink-0">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-black/60 hover:bg-black/85 text-white rounded-full transition-all"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-dashed border-outline-variant/60 bg-surface-container-low flex items-center justify-center text-on-surface-variant/40 flex-shrink-0">
                      <Sparkles size={16} />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="text-[10px] text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer flex-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Base Price (BDT)</label>
                  <input
                    type="number"
                    value={itemPrice || ''}
                    onChange={(e) => setItemPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-4.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Category</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full px-4.5 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary font-semibold"
                  >
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── Item Sizes / Multiple Options ── */}
              <div className="space-y-3 pt-3 border-t border-outline-variant/30">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={12} className="text-primary" />
                    Sizes &amp; Variants (Optional)
                  </label>
                  {itemSizes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setItemSizes([])}
                      className="text-[10px] text-error hover:underline font-bold"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {itemSizes.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase">Option Title:</span>
                      <input
                        type="text"
                        value={optionGroupTitle}
                        onChange={(e) => setOptionGroupTitle(e.target.value)}
                        placeholder="e.g. Size, Naan, Portion"
                        className="px-3 py-1 bg-surface-container-low border border-outline-variant rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-primary flex-1"
                      />
                    </div>

                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {itemSizes.map((sz, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-surface-container-low p-2 rounded-xl border border-outline-variant/30">
                          <input
                            type="text"
                            placeholder="Size (e.g. Small, Medium, Garlic Naan)"
                            value={sz.name}
                            onChange={(e) => {
                              const updated = [...itemSizes];
                              updated[idx].name = e.target.value;
                              setItemSizes(updated);
                            }}
                            className="flex-1 px-3 py-1.5 bg-surface border border-outline-variant/40 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-primary"
                          />
                          <div className="flex items-center gap-1 w-28">
                            <span className="text-[10px] font-bold text-on-surface-variant">+TK</span>
                            <input
                              type="number"
                              min={0}
                              placeholder="0"
                              value={sz.price}
                              onChange={(e) => {
                                const updated = [...itemSizes];
                                updated[idx].price = Math.max(0, parseFloat(e.target.value) || 0);
                                setItemSizes(updated);
                              }}
                              className="w-full px-2 py-1.5 bg-surface border border-outline-variant/40 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setItemSizes(itemSizes.filter((_, i) => i !== idx))}
                            className="p-1.5 text-error hover:bg-error-container/40 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setItemSizes([...itemSizes, { name: '', price: 0 }])}
                  className="w-full py-2.5 bg-primary/10 text-primary border border-primary/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-primary/20 transition-all press-effect"
                >
                  <Plus size={14} />
                  {itemSizes.length === 0 ? 'Add Sizes / Multiple Options' : 'Add Another Size'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-on-surface">Available for Ordering</h4>
                  <p className="text-[9px] text-on-surface-variant/80">Toggle to temporarily take offline from waiters</p>
                </div>
                <button
                  type="button"
                  onClick={() => setItemAvailable(!itemAvailable)}
                  className="transition-all press-effect"
                >
                  {itemAvailable ? (
                    <ToggleRight className="text-tertiary w-8 h-8" />
                  ) : (
                    <ToggleLeft className="text-on-surface-variant/40 w-8 h-8" />
                  )}
                </button>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="flex-1 py-3 bg-surface-container hover:bg-surface-container-high text-xs font-bold rounded-xl transition-all press-effect"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-on-primary text-xs font-bold rounded-xl transition-all press-effect shadow-md shadow-primary/20"
                >
                  {isItemEditing ? 'Save Changes' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
