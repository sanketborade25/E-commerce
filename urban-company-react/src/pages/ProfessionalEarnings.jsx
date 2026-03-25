import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfessionalShell, { MiniIcon } from "../components/ProfessionalShell";
import { api } from "../api/client";
import { formatCurrency, formatDateTime, normalizeStatus } from "../utils/professional";

export default function ProfessionalEarnings() {
  const [profile, setProfile] = useState(null);
  const [earnings, setEarnings] = useState([]);
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
        const [profileData, bookings] = await Promise.all([
          api.getMyProfessionalProfile(),
          api.getProfessionalBookings()
        ]);
        setProfile(profileData);
        setEarnings(
          (bookings || []).filter(
            (item) => normalizeStatus(item.status) === "COMPLETED"
          )
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const total = useMemo(
    () => earnings.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0),
    [earnings]
  );

  return (
    <ProfessionalShell
      profile={profile}
      bookings={earnings}
      title="Earnings"
      subtitle="Monitor completed jobs and the revenue generated from your delivered bookings."
      quickStats={[
        { label: "Completed jobs", value: earnings.length },
        { label: "Total earned", value: total, currency: true }
      ]}
    >
      <section className="pro-section">
        <div className="pro-section-header">
          <div>
            <p className="pro-section-kicker">Revenue</p>
            <h2>Payout summary</h2>
          </div>
        </div>

        {loading ? (
          <p className="pro-loading-copy">Loading earnings...</p>
        ) : earnings.length === 0 ? (
          <div className="pro-empty-state">
            <div className="pro-empty-icon">
              <MiniIcon name="earnings" />
            </div>
            <h3>No earnings available yet</h3>
            <p>Completed bookings will be reflected here once jobs are finished.</p>
          </div>
        ) : (
          <>
            <div className="pro-earnings-banner">
              <span className="pro-meta-label">Total earned</span>
              <strong>{formatCurrency(total)}</strong>
            </div>

            <div className="pro-list-grid">
              {earnings.map((item) => (
                <article key={item.id} className="pro-list-card">
                  <span className="pro-meta-label">{item.bookingReference || "Booking"}</span>
                  <strong>{formatCurrency(item.totalAmount)}</strong>
                  <p>{formatDateTime(item.scheduledAt)}</p>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </ProfessionalShell>
  );
}
