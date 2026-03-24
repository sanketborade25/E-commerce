import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../api/client";

export default function ProfessionalBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = localStorage.getItem("professional_authed") === "true";
    if (!auth) {
      navigate("/professional/login");
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getProfessionalBookings();
        setBookings(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  return (
    <div>
      <Navbar />
      <div className="professional-dashboard">
        <h2>Professional Bookings</h2>
        {loading && <p>Loading bookings...</p>}
        {!loading && bookings.length === 0 && <p>No bookings found.</p>}
        <ul className="partner-bookings">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <div>{booking.bookingReference}</div>
              <div>{booking.status}</div>
              <div>{new Date(booking.scheduledAt || "").toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
