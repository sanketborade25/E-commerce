import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import AdminLayout from "../components/admin/AdminLayout";
import { notifyAdminDataChanged } from "./admin/adminUtils";
import "../styles/pages/admin.css";

const ACTIVE_BOOKING_STATUSES = ["PENDING", "ASSIGNED", "ACCEPTED", "ON_THE_WAY", "STARTED"];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    categories: 0,
    subcategories: 0,
    services: 0,
    serviceOptions: 0,
    cities: 0,
    users: 0,
    professionals: 0,
    bookings: 0,
    activeBookings: 0
  });
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    const bookingCountRequests = ACTIVE_BOOKING_STATUSES.map((status) =>
      api.getAdminBookings({ status, page: 1, pageSize: 1 })
    );

    const [
      citiesRes,
      categoriesRes,
      optionsRes,
      servicesRes,
      subCatsRes,
      usersRes,
      professionalsRes,
      bookingsRes,
      ...activeBookingRes
    ] =
      await Promise.allSettled([
        api.getCities({ includeInactive: true }),
        api.getCategories(),
        api.getServiceOptions(),
        api.getAdminServices(),
        api.getSubCategories(),
        api.getUsers(),
        api.getProfessionals(),
        api.getAdminBookings({ page: 1, pageSize: 1 }),
        ...bookingCountRequests
      ]);

    const activeBookings = activeBookingRes.reduce((total, result) => {
      if (result.status !== "fulfilled") return total;
      return total + Number(result.value?.total || 0);
    }, 0);

    setStats({
      categories:
        categoriesRes.status === "fulfilled"
          ? (categoriesRes.value || []).filter((c) => c.parentCategoryId == null).length
          : 0,
      subcategories: subCatsRes.status === "fulfilled" ? (subCatsRes.value || []).length : 0,
      services: servicesRes.status === "fulfilled" ? (servicesRes.value || []).length : 0,
      serviceOptions: optionsRes.status === "fulfilled" ? (optionsRes.value || []).length : 0,
      cities: citiesRes.status === "fulfilled" ? (citiesRes.value || []).length : 0,
      users: usersRes.status === "fulfilled" ? (usersRes.value || []).length : 0,
      professionals:
        professionalsRes.status === "fulfilled" ? (professionalsRes.value || []).length : 0,
      bookings: bookingsRes.status === "fulfilled" ? Number(bookingsRes.value?.total || 0) : 0,
      activeBookings
    });
    setLoading(false);
  };

  useEffect(() => {
    loadAll();

    const onChange = () => loadAll();
    window.addEventListener("admin-data-changed", onChange);
    return () => window.removeEventListener("admin-data-changed", onChange);
  }, []);

  const configurationCards = useMemo(
    () => [
      { label: "Categories", value: stats.categories, to: "/admin/categories" },
      { label: "Subcategories", value: stats.subcategories, to: "/admin/subcategories" },
      { label: "Services", value: stats.services, to: "/admin/services" },
      { label: "Service Options", value: stats.serviceOptions, to: "/admin/service-options" },
      { label: "Cities", value: stats.cities, to: "/admin/cities" }
    ],
    [stats]
  );

  const businessCards = useMemo(
    () => [
      { label: "Total Users", value: stats.users, to: "/admin/users" },
      { label: "Total Professionals", value: stats.professionals, to: "/admin/professionals" },
      { label: "Total Bookings", value: stats.bookings, to: "/admin/bookings" },
      { label: "Active Bookings", value: stats.activeBookings, to: "/admin/bookings" }
    ],
    [stats]
  );

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Overview of configuration modules and live business activity across the system."
      actions={
        <button className="admin-btn admin-btn-ghost" onClick={() => notifyAdminDataChanged()}>
          Refresh
        </button>
      }
    >
      <div className="admin-card">
        <h3>Configuration</h3>
        <p className="admin-muted">Core catalog and location setup for the admin console.</p>
        {loading ? (
          <p className="admin-muted">Loading dashboard metrics...</p>
        ) : (
          <div className="admin-summary-grid">
            {configurationCards.map((item) => (
              <Link to={item.to} key={item.label} className="admin-summary-card admin-summary-link">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="admin-card">
        <h3>Business Metrics</h3>
        <p className="admin-muted">Live activity and account totals for overall system visibility.</p>
        {loading ? (
          <p className="admin-muted">Loading dashboard metrics...</p>
        ) : (
          <div className="admin-summary-grid">
            {businessCards.map((item) => (
              <Link to={item.to} key={item.label} className="admin-summary-card admin-summary-link">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
