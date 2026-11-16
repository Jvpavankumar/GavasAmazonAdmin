import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AdminLayout from './pages/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminProductForm from './pages/AdminProductForm';
import AdminOrderBill from './pages/AdminOrderBill';
import AdminOrders from './pages/AdminOrders';
import AdminUsers from './pages/AdminUsers';
import AdminCategories from './pages/AdminCategories';
import GlobalLoader from './components/GlobalLoader';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <GlobalLoader />
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<AdminProductForm />} />
            <Route path="products/:id/edit" element={<AdminProductForm />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="orders/:id/bill" element={<AdminOrderBill />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="categories" element={<AdminCategories />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
