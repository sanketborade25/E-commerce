import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../api/client";

export default function Bookings() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      let list = [];

      try {
        const authUserRaw = localStorage.getItem("auth_user");
        const authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
        const remote = await api.getBookings();
        list = authUser?.id
          ? (remote || []).filter((b) => String(b.userId) === String(authUser.id))
          : [];
      } catch {
        list = [];
      }

      if (list.length === 0) {
        try {
          list = JSON.parse(localStorage.getItem("guest_bookings") || "[]");
        } catch {
          list = [];
        }
      }

      if (!mounted) return;
      setBookings(list);
      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) => {
      const ref = String(b.bookingReference || "").toLowerCase();
      const status = String(b.status || "").toLowerCase();
      return ref.includes(q) || status.includes(q);
    });
  }, [bookings, search]);

  return (
    <div className="bookings-page">
      <h2>My Bookings</h2>
      {location.state?.bookingReference && (
        <p className="booking-meta">
          Payment successful. Booking reference:{" "}
          <strong>{location.state.bookingReference}</strong>
        </p>
      )}

      <div className="bookings-search">
        <input
          type="text"
          placeholder="Search by booking reference"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Link className="bookings-search-btn" to="/">
          Back to Home
        </Link>
      </div>

      {loading ? (
        <p>Loading bookings...</p>
      ) : filtered.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <div className="bookings-cards">
          {filtered.map((b) => (
            <div key={b.id || b.bookingReference} className="booking-card">
              <div className="booking-card-left">
                <div className="booking-item-thumb">UC</div>
                <div>
                  <h4>{b.bookingReference || "Booking"}</h4>
                  <div className="booking-meta">
                    {b.scheduledAt
                      ? new Date(b.scheduledAt).toLocaleString()
                      : "Scheduled time pending"}
                  </div>
                  <div className="booking-items-list">
                    {(b.items || []).slice(0, 3).map((item, idx) => (
                      <div key={idx} className="booking-item-row">
                        <span>Service {item.serviceId || idx + 1}</span>
                        <span>Rs {item.price || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="booking-card-right">
                <div className="booking-price">Rs {b.totalAmount || 0}</div>
                <div className="booking-status-line">
                  <span className="booking-status-dot" />
                  {b.status || "Confirmed"}
                </div>
                <span className="booking-action">{b.paymentStatus || "Paid"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
