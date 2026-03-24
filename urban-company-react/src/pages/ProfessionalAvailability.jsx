import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../api/client";

export default function ProfessionalAvailability() {
  const [availability, setAvailability] = useState([]);
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
        const profile = await api.getMyProfessionalProfile();
        const data = await api.getProfessionalAvailability(profile.id);
        setAvailability(data || []);
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
        <h2>Professional Availability</h2>
        {loading && <p>Loading availability...
        </p>}
        {!loading && availability.length === 0 && <p>Your availability schedule will appear here.</p>}
        <ul>
          {availability.map((item, idx) => (
            <li key={idx}>
              {item.startAt && item.endAt
                ? `${new Date(item.startAt).toLocaleString()} - ${new Date(item.endAt).toLocaleString()}`
                : "Timeslot"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
