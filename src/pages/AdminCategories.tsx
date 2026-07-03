import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  fetchAdminCategories, createCategory, updateCategory, deleteCategory, type AdminCategory,
} from '../api/admin';
import { ApiError } from '../api/client';
import Loader from '../components/Loader';
import ImageUrlField from '../components/ImageUrlField';
import AdminImageThumb from '../components/AdminImageThumb';

export default function AdminCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setCategories(await fetchAdminCategories());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createCategory({
      name: name.trim(),
      image: image.trim() || null,
    });
    setName('');
    setImage('');
    await load();
  };

  const handleUpdate = async () => {
    if (!editing || !editName.trim()) return;
    await updateCategory(editing.id, {
      name: editName.trim(),
      image: editImage.trim() || null,
    });
    setEditing(null);
    await load();
  };

  const handleDelete = async (cat: AdminCategory) => {
    if (!confirm(`Delete "${cat.name}"?`)) return;
    try {
      await deleteCategory(cat.id);
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Cannot delete category with products');
    }
  };

  const openEdit = (cat: AdminCategory) => {
    setEditing(cat);
    setEditName(cat.name);
    setEditImage(cat.image ?? '');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-sm text-gray-500">{categories.length} categories</p>
      </div>

      <form onSubmit={handleCreate} className="card space-y-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-600">New category name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Smart Home"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-lavender-400"
            />
          </div>
          <ImageUrlField
            label="Category logo"
            value={image}
            onChange={setImage}
            placeholder="Paste logo URL or upload PNG/JPG"
          />
          <p className="text-xs text-gray-400">
            Upload your own logo (e.g. a gummy bear image for Gummies). Shown on the storefront instead of the default icon.
          </p>
        </div>
        <button type="submit" className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
          <Plus className="h-4 w-4" /> Add category
        </button>
      </form>

      <div className="card overflow-hidden">
        {loading ? (
          <Loader fullPage label="Loading categories..." />
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Logo</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {cat.image ? (
                      <AdminImageThumb src={cat.image} alt={cat.name} />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                        —
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-500">{cat.slug}</td>
                  <td className="px-4 py-3 text-gray-600">{cat.productCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="text-gray-500 hover:text-lavender-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        disabled={cat.productCount > 0}
                        className="text-gray-500 hover:text-red-600 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} aria-label="Close" />
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-4 shadow-elevated sm:p-6">
            <h2 className="text-lg font-bold">Edit category</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none"
                />
              </div>
              <ImageUrlField
                label="Category logo"
                value={editImage}
                onChange={setEditImage}
                placeholder="Paste logo URL or upload PNG/JPG"
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">Renaming updates all products in this category.</p>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={handleUpdate} className="btn-primary flex-1 py-2 text-sm">Save</button>
              <button type="button" onClick={() => setEditing(null)} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
