import { api } from './client';
import type { Product } from '../types';

export interface DashboardData {
  stats: {
    products: number;
    orders: number;
    users: number;
    categories: number;
    revenue: number;
    totalUnits: number;
    inStockProducts: number;
    outOfStockProducts: number;
  };
  ordersByStatus: { status: string; count: number }[];
  recentOrders: {
    id: string;
    date: string;
    total: number;
    status: string;
    customer: string;
    email: string;
    itemCount: number;
  }[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  picture: string;
  role: string;
  location: string;
  createdAt: string;
  orderCount: number;
  wishlistCount: number;
}

export interface AdminOrder {
  id: string;
  date: string;
  status: string;
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  customer: { name: string; email: string };
  address: { line: string; city: string; zip: string };
  items: { name: string; quantity: number; price: number }[];
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  productCount: number;
  createdAt: string;
}

export function fetchDashboard() {
  return api<DashboardData>('/admin/dashboard');
}

export function fetchAdminProducts(params?: { q?: string; category?: string }) {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.category) search.set('category', params.category);
  const qs = search.toString();
  return api<Product[]>(`/admin/products${qs ? `?${qs}` : ''}`);
}

export function createProduct(data: Partial<Product>) {
  return api<Product>('/admin/products', { method: 'POST', body: JSON.stringify(data) });
}

export function updateProduct(id: string, data: Partial<Product>) {
  return api<Product>(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteProduct(id: string) {
  return api<{ deleted: boolean }>(`/admin/products/${id}`, { method: 'DELETE' });
}

export function fetchAdminOrders(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return api<AdminOrder[]>(`/admin/orders${qs}`);
}

export function updateOrderStatus(id: string, status: string) {
  return api(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export function fetchAdminUsers(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  return api<AdminUser[]>(`/admin/users${qs}`);
}

export function updateUserRole(id: string, role: 'customer' | 'admin') {
  return api(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) });
}

export function fetchAdminCategories() {
  return api<AdminCategory[]>('/admin/categories');
}

export function createCategory(data: { name: string; image?: string | null }) {
  return api('/admin/categories', { method: 'POST', body: JSON.stringify(data) });
}

export function updateCategory(id: string, data: { name?: string; image?: string | null }) {
  return api(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteCategory(id: string) {
  return api<{ deleted: boolean }>(`/admin/categories/${id}`, { method: 'DELETE' });
}
