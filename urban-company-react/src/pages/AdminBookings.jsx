import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import AdminLayout from "../components/admin/AdminLayout";

const STATUS_LABELS = ["PENDING", "ASSIGNED", "ACCEPTED", "COMPLETED", "CANCELLED"];
const STATUS_TRANSITIONS = {
  PENDING: ["ACCEPTED", "CANCELLED"],
  ASSIGNED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: []
};

const statusBadgeClass = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "completed") return "is-success";
  if (value === "accepted") return "is-info";
  if (value === "cancelled" || value === "rejected") return "is-danger";
  if (value === "assigned") return "is-warn";
  return "is-muted";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString();
};

const getBookingItems = (booking) =>
  Array.isArray(booking?.items) ? booking.items.filter(Boolean) : [];

const getBookingServiceLabels = (booking) => {
  const items = getBookingItems(booking);
  const names = items
    .map((item) => item?.serviceName || (item?.serviceId ? `Service ${item.serviceId}` : null))
    .filter(Boolean);

  return names.length > 0 ? names : ["No service details"];
};

export default function AdminBookings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [cities, setCities] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [assignments, setAssignments] = useState({});
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [assigningBookingId, setAssigningBookingId] = useState(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const loadLookups = async () => {
    try {
      const [citiesRes, prosRes] = await Promise.allSettled([
        api.getCities({ includeInactive: true }),
        api.getProfessionals()
      ]);
      if (citiesRes.status === "fulfilled") setCities(citiesRes.value || []);
      if (prosRes.status === "fulfilled") setProfessionals(prosRes.value || []);
    } catch {
      // ignore lookup failures
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getAdminBookings({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        cityId: cityFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        pageSize
      });
      setBookings(res?.items || []);
      setTotal(res?.total || 0);
    } catch (e) {
      setError(e?.message || "Failed to load bookings.");
      setBookings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [page, pageSize, statusFilter, cityFilter, dateFrom, dateTo]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      loadBookings();
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const handleStatusUpdate = async (booking, nextStatus) => {
    if (!booking?.id || !nextStatus) return;
    const ok = window.confirm(
      `Update booking ${booking.bookingReference || booking.id} to ${nextStatus}?`
    );
    if (!ok) return;
    try {
      setUpdatingBookingId(booking.id);
      await api.updateAdminBookingStatus(booking.id, { status: nextStatus });
      await loadBookings();
    } catch (e) {
      alert(e?.message || "Unable to update status.");
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const handleAssign = async (booking) => {
    const nextProId = assignments[booking.id];
    if (!nextProId) {
      alert("Select a professional to assign.");
      return;
    }
    const ok = window.confirm(
      `Assign professional to booking ${booking.bookingReference || booking.id}?`
    );
    if (!ok) return;
    try {
      setAssigningBookingId(booking.id);
      await api.assignAdminBookingProfessional(booking.id, {
        professionalId: nextProId
      });
      await loadBookings();
      setAssignments((prev) => ({
        ...prev,
        [booking.id]: ""
      }));
    } catch (e) {
      alert(e?.message || "Unable to assign professional.");
    } finally {
      setAssigningBookingId(null);
    }
  };

  const availableStatusOptions = (current) => {
    const normalized = String(current || "PENDING").toUpperCase();
    return STATUS_TRANSITIONS[normalized] || [];
  };

  const filteredProfessionals = useMemo(
    () => (booking) => {
      const targetCityId = booking?.cityId || cityFilter;
      if (!targetCityId) return professionals;
      return professionals.filter(
        (p) => String(p?.cityId || "") === String(targetCityId)
      );
    },
    [professionals, cityFilter]
  );

  return (
    <AdminLayout
      title="Bookings"
      subtitle="Monitor, filter, and update bookings with proper audit control."
    >
      <div className="admin-card">
        <div className="admin-row-filters">
          <input
            type="text"
            placeholder="Search by user, service, or reference"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {(STATUS_LABELS || []).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={cityFilter}
            onChange={(e) => {
              setCityFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All cities</option>
            {cities.map((city) => (
              <option key={city.id} value={String(city.id)}>
                {city.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <select
            value={String(pageSize)}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={String(size)}>
                {size} / page
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="admin-muted">Loading bookings...</p>
        ) : error ? (
          <p className="admin-error">{error}</p>
        ) : bookings.length === 0 ? (
          <p className="admin-muted">No bookings found.</p>
        ) : (
          <div className="admin-table">
            <div className="admin-table-row admin-table-head">
              <span>Booking</span>
              <span>User</span>
              <span>Service</span>
              <span>City</span>
              <span>Date &amp; Time</span>
              <span>Status</span>
              <span>Professional</span>
              <span>Actions</span>
            </div>
            {bookings.map((booking) => (
              <div key={booking.id} className="admin-table-row">
                <span>
                  <strong>{booking.bookingReference || "Booking"}</strong>
                  <span className="admin-muted">{booking.id}</span>
                </span>
                <span>
                  <strong>{booking.userName || "Unknown user"}</strong>
                  <span className="admin-muted">{booking.userPhone || "-"}</span>
                </span>
                <span>
                  {getBookingServiceLabels(booking).map((serviceName, idx) => (
                    <div key={`${booking.id}-service-${idx}`}>{serviceName}</div>
                  ))}
                </span>
                <span>{booking.cityName || "-"}</span>
                <span>{formatDateTime(booking.scheduledAt)}</span>
                <span className={`admin-status-badge ${statusBadgeClass(booking.status)}`}>
                  {booking.status || "PENDING"}
                </span>
                <span>{booking.professionalName || "-"}</span>
                <span className="admin-actions">
                  <button
                    className="admin-btn admin-btn-ghost"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    View
                  </button>
                  <select
                    value=""
                    disabled={
                      updatingBookingId === booking.id ||
                      availableStatusOptions(booking.status).length === 0
                    }
                    onChange={(e) => {
                      const next = e.target.value;
                      if (next) handleStatusUpdate(booking, next);
                    }}
                  >
                    <option value="">Update status</option>
                    {availableStatusOptions(booking.status).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <select
                    value={assignments[booking.id] || ""}
                    disabled={assigningBookingId === booking.id}
                    onChange={(e) =>
                      setAssignments((prev) => ({
                        ...prev,
                        [booking.id]: e.target.value
                      }))
                    }
                  >
                    <option value="">Assign professional</option>
                    {filteredProfessionals(booking).map((pro) => (
                      <option key={pro.id} value={pro.id}>
                        {pro.displayName || pro.fullName || "Professional"}
                      </option>
                    ))}
                  </select>
                  <button
                    className="admin-btn admin-btn-primary"
                    disabled={
                      assigningBookingId === booking.id || !assignments[booking.id]
                    }
                    onClick={() => handleAssign(booking)}
                  >
                    {assigningBookingId === booking.id ? "Assigning..." : "Assign"}
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="admin-pagination">
          <button
            className="admin-btn admin-btn-ghost"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          <div className="admin-page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`admin-page-btn ${page === p ? "active" : ""}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <span className="admin-muted">
            Page {page} of {totalPages}
          </span>
          <button
            className="admin-btn admin-btn-ghost"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {selectedBooking && (
        <div className="admin-modal" onClick={() => setSelectedBooking(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Booking details</h3>
                <p className="admin-muted">
                  {selectedBooking.bookingReference || selectedBooking.id}
                </p>
              </div>
              <button className="admin-btn admin-btn-ghost" onClick={() => setSelectedBooking(null)}>
                Close
              </button>
            </div>
            <div className="admin-modal-body">
              <div>
                <strong>User</strong>
                <p>{selectedBooking.userName || "Unknown user"}</p>
                <p className="admin-muted">{selectedBooking.userPhone || "-"}</p>
              </div>
              <div>
                <strong>Professional</strong>
                <p>{selectedBooking.professionalName || "-"}</p>
              </div>
              <div>
                <strong>Address</strong>
                <p>
                  {[selectedBooking.addressLine1, selectedBooking.addressLine2]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </p>
                <p className="admin-muted">
                  {selectedBooking.cityName || "-"} {selectedBooking.pincode || ""}
                </p>
              </div>
              <div>
                <strong>Schedule</strong>
                <p>{formatDateTime(selectedBooking.scheduledAt)}</p>
                <p className="admin-muted">Status: {selectedBooking.status}</p>
              </div>
              <div className="admin-modal-items">
                <strong>Items</strong>
                {getBookingItems(selectedBooking).length === 0 ? (
                  <p className="admin-muted">No service items available.</p>
                ) : (
                  getBookingItems(selectedBooking).map((item, idx) => (
                    <div key={`${selectedBooking.id}-item-${idx}`} className="admin-modal-item">
                      <span>{item.serviceName || `Service ${item.serviceId}`}</span>
                      <span>Rs {item.price || 0}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
