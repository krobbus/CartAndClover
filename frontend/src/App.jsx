import { Navigate, Route, Routes } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Register from './pages/Register';
import Marketplace from './pages/Marketplace';
import AddToCart from './pages/AddToCart';
import Users from './pages/Users';
import NotFound from './components/NotFound';

import Products from './pages/product/Products';
import ProductView from './pages/product/ProductView';
import ProductForm from './pages/product/ProductForm';

import Orders from './pages/order/Orders';
import OrderView from './pages/order/OrderView';
import OrderForm from './pages/order/OrderForm';

import './App.css';
import './styles/auth.css';
import './styles/marketplace.css';
import './styles/addToCart.css';
import './styles/users.css';

import './styles/components/loading.css';
import './styles/components/navigation.css';
import './styles/components/emptyState.css';
import './styles/components/errorNote.css';
import './styles/components/notFound.css';

import './styles/product/products.css';
import './styles/product/productView.css';
import './styles/product/productForm.css';

import './styles/order/orders.css';
import './styles/order/orderView.css';
import './styles/order/orderForm.css';

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<Navigation />}>
                <Route index element={<Navigate to="/marketplace" replace />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/products/:productId" element={<ProductView />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/new" element={<ProductForm />} />
                    <Route path="/products/edit/:productId" element={<ProductForm />} />

                    <Route path="/products/add-to-cart" element={<AddToCart />} />

                    <Route path="/products/orders" element={<Orders />} />
                    <Route path="/products/orders/:orderId" element={<OrderView />} />
                    <Route path="/products/orders/checkout" element={<OrderForm />} />
                    <Route path="/products/orders/edit/:orderId" element={<OrderForm />} />

                    <Route element={<ProtectedRoute allow={['admin']} />}>
                        <Route path="/users" element={<Users />} />
                    </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    )
}