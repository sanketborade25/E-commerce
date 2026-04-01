import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import ServicePage from "./pages/ServicePage"; 
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Checkout from "./pages/Checkout";
import Bookings from "./pages/Bookings";
import ProfessionalLogin from "./pages/ProfessionalLogin";
import ProfessionalDashboard from "./pages/ProfessionalDashboard";
import ProfessionalBookings from "./pages/ProfessionalBookings";
import ProfessionalAvailability from "./pages/ProfessionalAvailability";
import ProfessionalEarnings from "./pages/ProfessionalEarnings";

function getRoleFromToken() {
  const token = localStorage.getItem("auth_token");
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    const role =
      payload?.role ||
      payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    if (Array.isArray(role)) return role[0];
    return role || null;
  } catch {
    return null;
  }
}

function getStoredUserRole() {
  try {
    const raw = localStorage.getItem("auth_user");
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.role) return user.role;
    }
  } catch {}
  return getRoleFromToken();
}

function AdminRoute({ children }) {
  const token = localStorage.getItem("auth_token");
  const role = String(getStoredUserRole() || "").toLowerCase();
  const authed = Boolean(token) && role === "admin";
  return authed ? children : <Navigate to="/admin" replace />;
}

function ProfessionalRoute({ children }) {
  const authed = localStorage.getItem("professional_authed") === "true";
  return authed ? children : <Navigate to="/professional/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
       <Route path="/home" element={<Home />} />
       <Route path="/services/:serviceKey" element={<ServicePage />} />
       <Route path="/checkout" element={<Checkout />} />
       <Route path="/bookings" element={<Bookings />} />
       <Route path="/admin" element={<AdminLogin />} />
       <Route
         path="/admin/dashboard"
         element={
           <AdminRoute>
             <AdminDashboard />
           </AdminRoute>
         }
       />
       <Route path="/professional/login" element={<ProfessionalLogin />} />
       <Route
         path="/professional/dashboard"
         element={
           <ProfessionalRoute>
             <ProfessionalDashboard />
           </ProfessionalRoute>
         }
       />
       <Route
         path="/professional/bookings"
         element={
           <ProfessionalRoute>
             <ProfessionalBookings />
           </ProfessionalRoute>
         }
       />
       <Route
         path="/professional/availability"
         element={
           <ProfessionalRoute>
             <ProfessionalAvailability />
           </ProfessionalRoute>
         }
       />
       <Route
         path="/professional/earnings"
         element={
           <ProfessionalRoute>
             <ProfessionalEarnings />
           </ProfessionalRoute>
         }
       />
      </Routes>
    </BrowserRouter>
  );
}



