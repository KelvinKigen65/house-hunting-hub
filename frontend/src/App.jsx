import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Layout
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

// Pages
import HomePage from "./pages/HomePage";
import ListingsPage from "./pages/ListingsPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TenantDashboard from "./pages/tenant/TenantDashboard";
import SavedPropertiesPage from "./pages/tenant/SavedPropertiesPage";
import MyBookingsPage from "./pages/tenant/MyBookingsPage";
import LandlordDashboard from "./pages/landlord/LandlordDashboard";
import AddPropertyPage from "./pages/landlord/AddPropertyPage";
import EditPropertyPage from "./pages/landlord/EditPropertyPage";
import LandlordInquiriesPage from "./pages/landlord/LandlordInquiriesPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminListingsPage from "./pages/admin/AdminListingsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";

function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(profile?.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/listings" element={<ListingsPage />} />
          <Route path="/listings/:id" element={<PropertyDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Tenant */}
          <Route path="/tenant" element={<ProtectedRoute allowedRoles={["tenant"]}><TenantDashboard /></ProtectedRoute>} />
          <Route path="/tenant/saved" element={<ProtectedRoute allowedRoles={["tenant"]}><SavedPropertiesPage /></ProtectedRoute>} />
          <Route path="/tenant/bookings" element={<ProtectedRoute allowedRoles={["tenant"]}><MyBookingsPage /></ProtectedRoute>} />

          {/* Landlord */}
          <Route path="/landlord" element={<ProtectedRoute allowedRoles={["landlord", "admin"]}><LandlordDashboard /></ProtectedRoute>} />
          <Route path="/landlord/add" element={<ProtectedRoute allowedRoles={["landlord", "admin"]}><AddPropertyPage /></ProtectedRoute>} />
          <Route path="/landlord/edit/:id" element={<ProtectedRoute allowedRoles={["landlord", "admin"]}><EditPropertyPage /></ProtectedRoute>} />
          <Route path="/landlord/inquiries" element={<ProtectedRoute allowedRoles={["landlord", "admin"]}><LandlordInquiriesPage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/listings" element={<ProtectedRoute allowedRoles={["admin"]}><AdminListingsPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUsersPage /></ProtectedRoute>} />

          {/* Shared */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}