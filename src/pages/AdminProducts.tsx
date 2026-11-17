import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, Package, AlertTriangle, CheckCircle, Zap, Eye, EyeOff } from 'lucide-react';
import type { Product } from '../types';
import { fetchAdminProducts, updateProduct, deleteProduct } from '../api/admin';
import { formatPrice, getDiscountPercent } from '../utils/formatPrice';
import Loader from '../components/Loader';
import AdminImageThumb from '../components/AdminImageThumb';

export default function AdminProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const stockFilter = (searchParams.get('stock') as 'in' | 'out' | 'low' | 'deal' | 'hidden' | null) ?? 'all';
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [togglingDeal, setTogglingDeal] = useState<string | null>(null);
  const [togglingActive, setTogglingActive] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setProducts(await fetchAdminProducts({ q: search || undefined }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

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
            : stockFilter === 'deal'
              ? Boolean(p.dealOfDay)
              : stockFilter === 'hidden'
                ? p.isActive === false
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

  const dealCount = products.filter((p) => p.dealOfDay).length;
  const hiddenCount = products.filter((p) => p.isActive === false).length;

  // Show/hide a product on the storefront without deleting it.
  const toggleActive = async (p: Product) => {
    const next = p.isActive === false;
    setTogglingActive(p.id);
    try {
      const updated = await updateProduct(p.id, { isActive: next });
      setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, isActive: updated.isActive } : x)));
    } catch {
      alert('Could not update product visibility');
    } finally {
      setTogglingActive(null);
    }
  };

  // One-click on/off for the storefront's "Deal of the day" carousel.
  const toggleDeal = async (p: Product) => {
    setTogglingDeal(p.id);
    try {
      const updated = await updateProduct(p.id, { dealOfDay: !p.dealOfDay });
      setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, dealOfDay: updated.dealOfDay } : x)));
    } catch {
      alert('Could not update Deal of the day');
    } finally {
      setTogglingDeal(null);
    }
  };

  const setStockFilter = (value: 'all' | 'in' | 'out' | 'low' | 'deal' | 'hidden') => {
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
    { id: 'deal' as const, label: '⚡ Deal of the day', count: dealCount },
    { id: 'hidden' as const, label: 'Hidden', count: hiddenCount },
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
        <Link to="/products/new" className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
          <Plus className="h-4 w-4" /> Add product
        </Link>
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
                  <th className="px-4 py-3" title="Show in the storefront's Deal of the day carousel">Deal of day</th>
                  <th className="px-4 py-3" title="Disable to hide this product from the storefront">Visible</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">
                      No products match this filter
                    </td>
                  </tr>
                )}
                {sorted.map((p) => {
                  const discount = getDiscountPercent(p.price, p.originalPrice);
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50 ${p.isActive === false ? 'opacity-60' : ''}`}>
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
                        <p className="font-medium text-gray-900">
                          {p.name}
                          {p.isActive === false && (
                            <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-600">Hidden</span>
                          )}
                        </p>
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
                        <button
                          type="button"
                          onClick={() => toggleDeal(p)}
                          disabled={togglingDeal === p.id}
                          aria-pressed={Boolean(p.dealOfDay)}
                          title={p.dealOfDay ? 'Remove from Deal of the day' : 'Add to Deal of the day'}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                            p.dealOfDay
                              ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300 hover:bg-amber-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          <Zap className={`h-3.5 w-3.5 ${p.dealOfDay ? 'fill-amber-400 text-amber-500' : ''}`} />
                          {p.dealOfDay ? 'On' : 'Off'}
                        </button>
                        {p.dealOfDay && p.stockQuantity <= 0 && (
                          <p className="mt-1 text-[11px] text-red-500">Hidden: out of stock</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleActive(p)}
                          disabled={togglingActive === p.id}
                          aria-pressed={p.isActive !== false}
                          title={p.isActive === false ? 'Show on storefront' : 'Hide from storefront'}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                            p.isActive === false
                              ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {p.isActive === false ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {p.isActive === false ? 'Disabled' : 'Enabled'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => navigate(`/products/${p.id}/edit`)} className="text-gray-500 hover:text-lavender-700" aria-label={`Edit ${p.name}`}>
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

    </div>
  );
}
