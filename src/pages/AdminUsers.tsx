import { useEffect, useState } from 'react';
import { Search, Shield } from 'lucide-react';
import { fetchAdminUsers, updateUserRole, type AdminUser } from '../api/admin';

import Loader from '../components/Loader';

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setUsers(await fetchAdminUsers(search || undefined));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleRole = async (user: AdminUser) => {
    const newRole = user.role === 'admin' ? 'customer' : 'admin';
    if (!confirm(`Change ${user.name} to ${newRole}?`)) return;
    await updateUserRole(user.id, newRole);
    await load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500">{users.length} registered users</p>
      </div>

      <div className="card flex items-center gap-2 p-3">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          type="search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-sm outline-none"
        />
        <button type="button" onClick={load} className="text-sm font-medium text-lavender-700">Search</button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Loader fullPage label="Loading users..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={u.picture} alt="" className="h-8 w-8 rounded-full bg-gray-100" />
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === 'admin' ? 'bg-lavender-100 text-lavender-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.orderCount}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleRole(u)}
                        className="flex items-center gap-1 text-xs font-medium text-lavender-700 hover:underline"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        {u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
