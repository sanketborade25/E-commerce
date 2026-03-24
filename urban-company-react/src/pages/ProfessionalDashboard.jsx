import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../api/client";

export default function ProfessionalDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [statusLoading, setStatusLoading] = useState(false);

  const loadData = async () => {
    try {
      const [p, b] = await Promise.all([
        api.getMyProfessionalProfile(),
        api.getProfessionalBookings()
      ]);
      setProfile(p);
      setBookings(b || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const isAuthed = localStorage.getItem("professional_authed") === "true";
    if (!isAuthed) {
      navigate("/professional/login");
      return;
    }
    loadData();
  }, []);

  const logout = () => {
    localStorage.removeItem("professional_authed");
    localStorage.removeItem("auth_token");
    navigate("/");
  };

  const setOnline = async (isOnline) => {
    if (!profile) return;
    setStatusLoading(true);
    try {
      await api.updateMyProfessionalStatus(isOnline);
      setProfile((prev) => (prev ? { ...prev, isOnline } : prev));
    } catch (err) {
      console.error(err);
    } finally {
      setStatusLoading(false);
    }
  };

  const bookingAction = async (id, action) => {
    try {
      if (action === "accept") await api.acceptBooking(id);
      if (action === "reject") await api.rejectBooking(id);
      if (action === "done") await api.updateBookingStatus(id, { status: "COMPLETED" });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="professional-dashboard">
        <h2>Professional Dashboard</h2>
        {profile ? (
          <>
            <div className="control-row">
              <p>Name: {profile.displayName || profile.fullName || "-"}</p>
              <p>Rating: {profile.rating}</p>
              <p>Status: {profile.isOnline ? "Online" : "Offline"}</p>
            </div>
            <div className="control-row">
              <button
                className={profile.isOnline ? "online" : "offline"}
                disabled={statusLoading}
                onClick={() => setOnline(!profile.isOnline)}
              >
                {profile.isOnline ? "Go Offline" : "Go Online"}
              </button>
              <button className="outline" onClick={logout}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <p>Loading profile...</p>
        )}

        <h3>Bookings</h3>
        {bookings.length > 0 ? (
          <ul className="partner-bookings">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <div>{booking.bookingReference}</div>
                <div>{booking.status}</div>
                <div>{new Date(booking.scheduledAt || "").toLocaleString()}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No bookings found.</p>
        )}
      </div>
    </div>
  );
}
