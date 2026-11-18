import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';
import type { Product } from '../types';
import { createProduct, fetchAdminCategories, fetchProductDetail, updateProduct } from '../api/admin';
import { calcSalePrice, formatPrice, getDiscountPercent } from '../utils/formatPrice';
import Loader from '../components/Loader';
import ImageUrlField from '../components/ImageUrlField';
import GalleryImagesField from '../components/GalleryImagesField';

const emptyProduct = (): Partial<Product> => ({
  name: '', description: '', price: 0, originalPrice: undefined, category: '', brand: '',
  rating: 4, reviewCount: 0, image: '', images: [], stockQuantity: 0, inStock: false, features: [], dealOfDay: false, isActive: true,
});

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-lavender-400 focus:ring-2 focus:ring-lavender-100';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4 p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

/** Full-page add/edit form for a product (replaces the old popup). */
export default function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<Partial<Product>>(emptyProduct());
  const [mrp, setMrp] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Key features edited as plain text, one bullet point per line.
  const [featuresText, setFeaturesText] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cats, product] = await Promise.all([
          fetchAdminCategories(),
          id ? fetchProductDetail(id) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setCategories(cats.map((c) => c.name));
        if (product) {
          setForm({ ...product, images: product.images ?? [] });
          setFeaturesText((product.features ?? []).join('\n'));
          setMrp(product.originalPrice ?? product.price);
          setDiscountPercent(getDiscountPercent(product.price, product.originalPrice) ?? 0);
        }
      } catch {
        if (!cancelled) setError(id ? 'Could not load this product.' : 'Could not load categories.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const salePrice = calcSalePrice(mrp, discountPercent);

  const makeGalleryImageMain = (index: number) => {
    setForm((prev) => {
      const gallery = [...(prev.images ?? [])];
      const chosen = gallery[index];
      if (!chosen) return prev;
      if (prev.image) gallery[index] = prev.image;
      else gallery.splice(index, 1);
      return { ...prev, image: chosen, images: gallery };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name?.trim()) return setError('Enter a product name.');
    if (!form.brand?.trim()) return setError('Enter a brand.');
    if (!form.description?.trim()) return setError('Enter a description.');
    if (mrp <= 0) return setError('Enter a valid price.');
    if (!form.category) return setError('Choose a category.');
    if (!form.image) return setError('Add a main image.');

    setSaving(true);
    try {
      const payload = {
        ...form,
        features: featuresText
          .split('\n')
          .map((line) => line.replace(/^\s*[-•*]\s*/, '').trim())
          .filter(Boolean),
        price: salePrice,
        originalPrice: discountPercent > 0 && mrp > salePrice ? mrp : null,
      };
      if (isEdit && id) await updateProduct(id, payload);
      else await createProduct(payload);
      navigate('/products');
    } catch {
      setError('Could not save the product. Check the details and try again.');
      setSaving(false);
    }
  };

  if (loading) return <Loader fullPage label="Loading product..." />;

  return (
    <form onSubmit={handleSave} className="pb-24">
      <Link to="/products" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-lavender-700">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">{isEdit ? 'Edit product' : 'Add product'}</h1>
      {isEdit && <p className="text-sm text-gray-400">{id}</p>}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <Section title="Details">
            <div>
              <label className="text-xs font-medium text-gray-600">Name</label>
              <input
                type="text"
                value={form.name ?? ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-gray-600">Brand</label>
                <input
                  type="text"
                  value={form.brand ?? ''}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Category</label>
                <select
                  value={form.category ?? ''}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Description</label>
              <textarea
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Key features (one per line)</label>
              <textarea
                value={featuresText}
                onChange={(e) => setFeaturesText(e.target.value)}
                rows={5}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-400">Each line shows as a bullet point under &quot;About this item&quot;.</p>
            </div>
          </Section>

          <Section title="Price">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-gray-600">Price / MRP (₹)</label>
                <input
                  type="number"
                  min={1}
                  value={mrp || ''}
                  onChange={(e) => setMrp(Number(e.target.value))}
                  placeholder="e.g. 1999"
                  className={inputClass}
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
                  className={inputClass}
                />
              </div>
            </div>
            {mrp > 0 && (
              <div className="rounded-lg border border-lavender-100 bg-lavender-50 px-4 py-3">
                <p className="text-xs font-medium text-gray-600">Sale price</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{formatPrice(salePrice)}</p>
                {discountPercent > 0 ? (
                  <p className="mt-1 text-xs text-gray-600">
                    M.R.P. <span className="line-through">{formatPrice(mrp)}</span> ·{' '}
                    <span className="font-semibold text-red-600">
                      {discountPercent}% off · customer saves {formatPrice(mrp - salePrice)}
                    </span>
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">No discount applied</p>
                )}
              </div>
            )}
          </Section>

          <Section title="Visibility">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3">
              <input
                type="checkbox"
                checked={form.isActive !== false}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-emerald-600"
              />
              <span>
                <span className="block text-sm font-medium text-gray-800">Show on storefront</span>
                <span className="block text-xs text-gray-500">
                  Untick to disable this product. Customers won&apos;t see it, search for it, or be able to buy it. You can
                  turn it back on anytime.
                </span>
              </span>
            </label>
          </Section>

          <Section title="Stock & promotion">
            <div>
              <label className="text-xs font-medium text-gray-600">Stock quantity</label>
              <input
                type="number"
                min={0}
                value={form.stockQuantity ?? 0}
                onChange={(e) =>
                  setForm({ ...form, stockQuantity: Number(e.target.value), inStock: Number(e.target.value) > 0 })
                }
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-400">
                {(form.stockQuantity ?? 0) > 0
                  ? `${form.stockQuantity} units available for sale`
                  : 'Product will be marked out of stock'}
              </p>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
              <input
                type="checkbox"
                checked={Boolean(form.dealOfDay)}
                onChange={(e) => setForm({ ...form, dealOfDay: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-amber-500"
              />
              <span>
                <span className="flex items-center gap-1 text-sm font-medium text-gray-800">
                  <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-500" /> Show in Deal of the day
                </span>
                <span className="block text-xs text-gray-500">
                  Appears in the home page Deal of the day carousel while it&apos;s in stock. Set a discount so shoppers
                  see the savings.
                </span>
              </span>
            </label>
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="Images">
            <ImageUrlField label="Main image" value={form.image ?? ''} onChange={(image) => setForm({ ...form, image })} />
            <GalleryImagesField
              images={form.images ?? []}
              onChange={(images) => setForm((prev) => ({ ...prev, images }))}
              onMakeMain={makeGalleryImageMain}
            />
          </Section>
        </div>
      </div>

      {/* Save bar pinned to the bottom of the screen */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur">
        <div className="page-container flex flex-wrap items-center justify-end gap-3 py-3">
          {error && <p className="mr-auto text-sm font-medium text-red-600">{error}</p>}
          <Link to="/products" className="btn-secondary px-5 py-2.5 text-sm">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-60">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add product'}
          </button>
        </div>
      </div>
    </form>
  );
}
