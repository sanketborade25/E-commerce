import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import ServicePage from "./pages/ServicePage"; 
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

function AdminRoute({ children }) {
  const authed = localStorage.getItem("admin_authed") === "true";
  return authed ? children : <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
       <Route path="/" element={<Home />} />
       <Route path="/services/:serviceKey" element={<ServicePage />} />
       <Route path="/admin" element={<AdminLogin />} />
       <Route
         path="/admin/dashboard"
         element={
           <AdminRoute>
             <AdminDashboard />
           </AdminRoute>
         }
       />
      </Routes>
    </BrowserRouter>
  );
}



