import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfessionalShell, { MiniIcon } from "../components/ProfessionalShell";
import { api } from "../api/client";
import { formatDateTime } from "../utils/professional";

export default function ProfessionalAvailability() {
  const [profile, setProfile] = useState(null);
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
        const profileData = await api.getMyProfessionalProfile();
        setProfile(profileData);
        const data = await api.getProfessionalAvailability(profileData.id);
        setAvailability(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const upcomingSlots = useMemo(
    () =>
      availability.filter((item) => {
        if (!item.startAt) return false;
        return new Date(item.startAt).getTime() >= Date.now();
      }),
    [availability]
  );

  return (
    <ProfessionalShell
      profile={profile}
      title="Availability"
      subtitle="Review the time windows where you can receive assignments and keep your schedule easy to scan."
      quickStats={[
        { label: "Total slots", value: availability.length },
        { label: "Upcoming", value: upcomingSlots.length }
      ]}
    >
      <section className="pro-section">
        <div className="pro-section-header">
          <div>
            <p className="pro-section-kicker">Schedule</p>
            <h2>Availability timeline</h2>
          </div>
        </div>

        {loading ? (
          <p className="pro-loading-copy">Loading availability...</p>
        ) : availability.length === 0 ? (
          <div className="pro-empty-state">
            <div className="pro-empty-icon">
              <MiniIcon name="availability" />
            </div>
            <h3>No availability slots yet</h3>
            <p>Your schedule will appear here once slots are configured.</p>
          </div>
        ) : (
          <div className="pro-list-grid">
            {availability.map((item, index) => (
              <article key={`${item.startAt || "slot"}-${index}`} className="pro-list-card">
                <span className="pro-meta-label">Slot {index + 1}</span>
                <strong>{formatDateTime(item.startAt)}</strong>
                <p>Ends: {formatDateTime(item.endAt)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </ProfessionalShell>
  );
}
