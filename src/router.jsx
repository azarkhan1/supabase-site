import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { hasPermission } from './lib/permissions';

// Layout
import Layout from './components/Layout/Layout';

// Core Pages
import Wizard from './pages/Wizard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import TransactionDetail from './pages/TransactionDetail';
import Commitments from './pages/Commitments';
import Recurring from './pages/Recurring';
import Reminders from './pages/Reminders';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

// Workspace Pages
import CompanyProfile from './pages/Workspace/CompanyProfile';
import Treasury from './pages/Workspace/Treasury';
import Employees from './pages/Workspace/Employees';
import DailyExpenses from './pages/Workspace/DailyExpenses';

// Admin Pages
import UsersManagement from './pages/Admin/Users';
import RolesMatrix from './pages/Admin/Roles';
import PlansManagement from './pages/Admin/Plans';
import SystemLogs from './pages/Admin/Logs';

// Protected Route Wrapper
const ProtectedRoute = ({ children, requiredPermission = null }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1e40af]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Permission check if required
  if (requiredPermission && user) {
    if (!hasPermission(user, requiredPermission)) {
      return (
        <div className="p-8 text-center text-rose-600 font-black">
          شما مجوز دسترسی به این بخش را ندارید. لطفاً با مدیر سیستم تماس بگیرید.
        </div>
      );
    }
  }

  return <Layout>{children}</Layout>;
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/wizard" element={<Wizard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Main Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/accounts" element={
        <ProtectedRoute>
          <Accounts />
        </ProtectedRoute>
      } />
      <Route path="/transactions" element={
        <ProtectedRoute>
          <Transactions />
        </ProtectedRoute>
      } />
      <Route path="/transactions/:id" element={
        <ProtectedRoute>
          <TransactionDetail />
        </ProtectedRoute>
      } />
      <Route path="/commitments" element={
        <ProtectedRoute>
          <Commitments />
        </ProtectedRoute>
      } />
      <Route path="/recurring" element={
        <ProtectedRoute>
          <Recurring />
        </ProtectedRoute>
      } />
      <Route path="/reminders" element={
        <ProtectedRoute>
          <Reminders />
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />

      {/* Protected Workspace Routes */}
      <Route path="/workspace/company" element={
        <ProtectedRoute>
          <CompanyProfile />
        </ProtectedRoute>
      } />
      <Route path="/workspace/treasury" element={
        <ProtectedRoute>
          <Treasury />
        </ProtectedRoute>
      } />
      <Route path="/workspace/employees" element={
        <ProtectedRoute>
          <Employees />
        </ProtectedRoute>
      } />
      <Route path="/workspace/daily-expenses" element={
        <ProtectedRoute>
          <DailyExpenses />
        </ProtectedRoute>
      } />

      {/* Protected Admin Routes */}
      <Route path="/admin/users" element={
        <ProtectedRoute>
          <UsersManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/roles" element={
        <ProtectedRoute>
          <RolesMatrix />
        </ProtectedRoute>
      } />
      <Route path="/admin/plans" element={
        <ProtectedRoute>
          <PlansManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/logs" element={
        <ProtectedRoute>
          <SystemLogs />
        </ProtectedRoute>
      } />

      {/* Fallback to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
