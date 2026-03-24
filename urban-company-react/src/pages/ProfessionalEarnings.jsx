import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../api/client";

export default function ProfessionalEarnings() {
  const [earnings, setEarnings] = useState([]);
  const [total, setTotal] = useState(0);
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
        const bookings = await api.getProfessionalBookings();
        const completed = (bookings || []).filter(
          (item) => String(item.status || "").toUpperCase() === "COMPLETED"
        );
        setEarnings(completed);
        setTotal(
          completed.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0)
        );
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
        <h2>Professional Earnings</h2>
        {!loading && <p>Total Earned: Rs {total}</p>}
        {loading && <p>Loading earnings...</p>}
        {!loading && earnings.length === 0 && <p>No earnings available yet.</p>}
        <ul>
          {earnings.map((item, idx) => (
            <li key={idx}>
              {item.bookingReference || "Booking"} - Rs {item.totalAmount}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
