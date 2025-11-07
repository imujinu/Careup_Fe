import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import ProductsListPage from '../pages/ProductsListPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import SearchPage from '../pages/SearchPage';
import CartPageWrapper from '../pages/CartPageWrapper';
import OrderPageWrapper from '../pages/OrderPageWrapper';
import PaymentPageWrapper from '../pages/PaymentPageWrapper';
import OrderCompletePageWrapper from '../pages/OrderCompletePageWrapper';
import PaymentSuccessPage from '../pages/PaymentSuccessPage';
import PaymentFailPage from '../pages/PaymentFailPage';
import CustomerLogin from '../../pages/auth/CustomerLogin';
import MyPage from '../components/MyPage';
import ShopLayout from '../layout/ShopLayout';

function ShopRoutes() {
  return (
    <ShopLayout>
      <Routes>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsListPage />} />
        <Route path="products/:productId" element={<ProductDetailPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="login" element={<CustomerLogin />} />
        <Route path="mypage" element={<MyPage onBack={() => window.history.back()} />} />
        <Route path="cart" element={<CartPageWrapper />} />
        <Route path="order" element={<OrderPageWrapper />} />
        <Route path="payment" element={<PaymentPageWrapper />} />
        <Route path="payment-success" element={<PaymentSuccessPage />} />
        <Route path="payment-fail" element={<PaymentFailPage />} />
        <Route path="order-complete" element={<OrderCompletePageWrapper />} />
        <Route path="*" element={<Navigate to="/shop" replace />} />
      </Routes>
    </ShopLayout>
  );
}

export default ShopRoutes;

