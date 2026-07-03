import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Product } from '../types';
import {
  fetchAdminProducts, createProduct, updateProduct, deleteProduct, fetchAdminCategories,
} from '../api/admin';
import { formatPrice, getDiscountPercent, calcSalePrice } from '../utils/formatPrice';
import Loader from '../components/Loader';
import ImageUrlField from '../components/ImageUrlField';
import AdminImageThumb from '../components/AdminImageThumb';

const emptyProduct = (): Partial<Product> => ({
  name: '', description: '', price: 0, originalPrice: undefined, category: '', brand: '',
  rating: 4, reviewCount: 0, image: '', stockQuantity: 0, inStock: false, features: [],
});

export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const stockFilter = (searchParams.get('stock') as 'in' | 'out' | 'low' | null) ?? 'all';
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState<Partial<Product>>(emptyProduct());
  const [mrp, setMrp] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        fetchAdminProducts({ q: search || undefined }),
        fetchAdminCategories(),
      ]);
      setProducts(prods);
      setCategories(cats.map((c) => c.name));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm(emptyProduct());
    setMrp(0);
    setDiscountPercent(0);
    setEditingId(null);
    setModal('create');
  };

  const openEdit = (p: Product) => {
    setForm({ ...p });
    setMrp(p.originalPrice ?? p.price);
    setDiscountPercent(getDiscountPercent(p.price, p.originalPrice) ?? 0);
    setEditingId(p.id);
    setModal('edit');
  };

  const handleSave = async () => {
    if (mrp <= 0) {
      alert('Please enter a valid price');
      return;
    }

    const salePrice = calcSalePrice(mrp, discountPercent);
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: salePrice,
        originalPrice: discountPercent > 0 && mrp > salePrice ? mrp : null,
      };
      if (modal === 'create') {
        await createProduct(payload);
      } else if (editingId) {
        await updateProduct(editingId, payload);
      }
      setModal(null);
      await load();
    } catch {
      alert('Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await deleteProduct(id);
    await load();
  };

  const filtered = products.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search);
    const matchesStock =
      stockFilter === 'all'
        ? true
        : stockFilter === 'in'
          ? p.stockQuantity > 0
          : stockFilter === 'out'
            ? p.stockQuantity <= 0
            : p.stockQuantity > 0 && p.stockQuantity <= 10;
    return matchesSearch && matchesStock;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (stockFilter === 'in' || stockFilter === 'low') {
      return a.stockQuantity - b.stockQuantity || a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name);
  });

  const inStockCount = products.filter((p) => p.stockQuantity > 0).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity <= 0).length;
  const lowStockCount = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 10).length;
  const salePrice = calcSalePrice(mrp, discountPercent);

  const setStockFilter = (value: 'all' | 'in' | 'out' | 'low') => {
    if (value === 'all') {
      searchParams.delete('stock');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ stock: value });
    }
  };

  const stockTabs = [
    { id: 'all' as const, label: 'All products', count: products.length },
    { id: 'in' as const, label: 'In stock', count: inStockCount },
    { id: 'out' as const, label: 'Out of stock', count: outOfStockCount },
    { id: 'low' as const, label: 'Low stock (≤10)', count: lowStockCount },
  ];

  const stats = [
    { label: 'Showing', value: filtered.length, icon: Package, color: 'text-blue-600 bg-blue-50', filter: 'all' as const },
    { label: 'In stock', value: inStockCount, icon: CheckCircle, color: 'text-teal-600 bg-teal-50', filter: 'in' as const },
    { label: 'Out of stock', value: outOfStockCount, icon: AlertTriangle, color: 'text-red-600 bg-red-50', filter: 'out' as const },
    { label: 'Low stock', value: lowStockCount, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50', filter: 'low' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''} in this view
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
          <Plus className="h-4 w-4" /> Add product
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, filter }) => (
          <button
            key={label}
            type="button"
            onClick={() => setStockFilter(filter)}
            className={`card p-4 text-left transition hover:shadow-md ${
              stockFilter === filter ? 'ring-2 ring-lavender-400' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{value.toLocaleString('en-IN')}</p>
              </div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {stockTabs.map(({ id, label, count }) => (
          <button
            key={id}
            type="button"
            onClick={() => setStockFilter(id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              stockFilter === id
                ? 'bg-lavender-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      <div className="card flex items-center gap-2 p-3">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none"
        />
        <button type="button" onClick={load} className="text-sm font-medium text-lavender-700">Search</button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Loader fullPage label="Loading products..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Image</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Stock left</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">
                      No products match this filter
                    </td>
                  </tr>
                )}
                {sorted.map((p) => {
                  const discount = getDiscountPercent(p.price, p.originalPrice);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {p.image ? (
                          <AdminImageThumb src={p.image} alt={p.name} />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                            —
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.id}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.category}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{formatPrice(p.price)}</p>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <p className="text-xs text-gray-400 line-through">{formatPrice(p.originalPrice)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {discount ? (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                            {discount}% off
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.stockQuantity > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                        }`}>
                          {p.stockQuantity > 0 ? `${p.stockQuantity} left` : 'Out of stock'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => openEdit(p)} className="text-gray-500 hover:text-lavender-700">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => handleDelete(p.id)} className="text-gray-500 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} aria-label="Close" />
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-4 shadow-elevated sm:p-6">
            <h2 className="text-lg font-bold">{modal === 'create' ? 'Add product' : 'Edit product'}</h2>
            <div className="mt-4 space-y-3">
              {[
                { key: 'name', label: 'Name', type: 'text' },
                { key: 'brand', label: 'Brand', type: 'text' },
                { key: 'description', label: 'Description', type: 'textarea' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-gray-600">{label}</label>
                  {type === 'textarea' ? (
                    <textarea
                      value={(form as Record<string, string>)[key] ?? ''}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-lavender-400"
                    />
                  ) : (
                    <input
                      type={type}
                      value={(form as Record<string, string>)[key] ?? ''}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-lavender-400"
                    />
                  )}
                </div>
              ))}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-gray-600">Price / MRP (₹)</label>
                  <input
                    type="number"
                    min={1}
                    value={mrp || ''}
                    onChange={(e) => setMrp(Number(e.target.value))}
                    placeholder="e.g. 1999"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-lavender-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Discount (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={discountPercent || ''}
                    onChange={(e) => setDiscountPercent(Math.min(99, Math.max(0, Number(e.target.value))))}
                    placeholder="0"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-lavender-400"
                  />
                </div>
              </div>

              {mrp > 0 && (
                <div className="rounded-lg border border-lavender-100 bg-lavender-50 px-4 py-3">
                  <p className="text-xs font-medium text-gray-600">Calculated sale price</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{formatPrice(salePrice)}</p>
                  {discountPercent > 0 ? (
                    <div className="mt-2 space-y-1 text-xs text-gray-600">
                      <p>M.R.P.: <span className="line-through">{formatPrice(mrp)}</span></p>
                      <p className="font-semibold text-red-600">
                        {discountPercent}% off · Customer saves {formatPrice(mrp - salePrice)}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">No discount applied</p>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-600">Stock quantity</label>
                <input
                  type="number"
                  min={0}
                  value={form.stockQuantity ?? 0}
                  onChange={(e) => setForm({
                    ...form,
                    stockQuantity: Number(e.target.value),
                    inStock: Number(e.target.value) > 0,
                  })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-lavender-400"
                />
                <p className="mt-1 text-xs text-gray-400">
                  {(form.stockQuantity ?? 0) > 0
                    ? `${form.stockQuantity} units available for sale`
                    : 'Product will be marked out of stock'}
                </p>
              </div>

              <ImageUrlField
                value={form.image ?? ''}
                onChange={(image) => setForm({ ...form, image })}
              />
              <div>
                <label className="text-xs font-medium text-gray-600">Category</label>
                <select
                  value={form.category ?? ''}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-sm">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
