import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfessionalBookingBoard from "../components/ProfessionalBookingBoard";
import ProfessionalShell, { MiniIcon } from "../components/ProfessionalShell";
import { api } from "../api/client";
import {
  clearPartnerSession,
  formatCurrency,
  formatStatus,
  isAuthError
} from "../utils/professional";

function DashboardCard({ icon, eyebrow, title, children, accent }) {
  return (
    <article className={`pro-card ${accent ? `accent-${accent}` : ""}`}>
      <div className="pro-card-head">
        <span className="pro-card-icon">
          <MiniIcon name={icon} />
        </span>
        <div>
          <p className="pro-section-kicker">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </article>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <section className="pro-section">
      <div className="pro-error-banner">
        <div>
          <strong>We couldn't load your professional dashboard.</strong>
          <p>{message}</p>
        </div>
        <button type="button" className="pro-action primary" onClick={onRetry}>
          Retry
        </button>
      </div>
    </section>
  );
}

export default function ProfessionalDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [busyActionKey, setBusyActionKey] = useState("");

  const handleAuthFailure = () => {
    clearPartnerSession();
    navigate("/professional/login");
  };

  const loadDashboard = async (selectedTab = activeTab) => {
    const isAuthed = localStorage.getItem("professional_authed") === "true";
    if (!isAuthed) {
      navigate("/professional/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [profileData, dashboardData, bookingData] = await Promise.all([
        api.getProfessionalProfileSummary(),
        api.getProfessionalDashboard(),
        api.getProfessionalBookingsByStatus(selectedTab)
      ]);

      setProfile(profileData);
      setDashboard(dashboardData);
      setBookings(bookingData || []);
    } catch (loadError) {
      console.error(loadError);
      if (isAuthError(loadError)) {
        handleAuthFailure();
        return;
      }
      setError(loadError?.message || "Unable to load professional dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(activeTab);
  }, [activeTab]);

  const quickStats = useMemo(
    () => [
      { label: "Total bookings", value: dashboard?.totalBookings ?? 0 },
      { label: "Ongoing", value: dashboard?.ongoingBookings ?? 0 },
      { label: "Earnings", value: dashboard?.earnings ?? 0, currency: true }
    ],
    [dashboard]
  );

  const setOnline = async (isOnline) => {
    if (!profile) return;

    setStatusLoading(true);
    setActionError("");
    try {
      const updatedProfile = await api.updateProfessionalStatusSummary(isOnline);
      setProfile(updatedProfile);
      const dashboardData = await api.getProfessionalDashboard();
      setDashboard(dashboardData);
    } catch (updateError) {
      console.error(updateError);
      if (isAuthError(updateError)) {
        handleAuthFailure();
        return;
      }
      setActionError(updateError?.message || "Unable to update professional status.");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleBookingAction = async (booking, action) => {
    const actionKey = `${booking.id}:${action}`;
    setBusyActionKey(actionKey);
    setActionError("");

    try {
      if (action === "accept") {
        await api.acceptBooking(booking.id);
      }
      if (action === "reject") {
        await api.rejectBooking(booking.id);
      }
      if (action === "onTheWay") {
        await api.updateBookingStatus(booking.id, { status: "ON_THE_WAY" });
      }
      if (action === "start") {
        await api.updateBookingStatus(booking.id, { status: "STARTED" });
      }
      if (action === "complete") {
        await api.updateBookingStatus(booking.id, { status: "COMPLETED" });
      }

      await loadDashboard(activeTab);
    } catch (updateError) {
      console.error(updateError);
      if (isAuthError(updateError)) {
        handleAuthFailure();
        return;
      }
      setActionError(updateError?.message || "Unable to update booking.");
    } finally {
      setBusyActionKey("");
    }
  };

  return (
    <ProfessionalShell
      profile={profile}
      bookings={bookings}
      title="Professional dashboard"
      subtitle="Track service requests, manage your live availability, and keep your workday moving from one structured workspace."
      quickStats={quickStats}
      notificationCount={dashboard?.notificationCount ?? 0}
    >
      {error ? (
        <ErrorState message={error} onRetry={() => loadDashboard(activeTab)} />
      ) : (
        <>
          {actionError && (
            <section className="pro-section">
              <div className="pro-inline-error">
                <strong>Action failed.</strong>
                <span>{actionError}</span>
              </div>
            </section>
          )}

          <section className="pro-dashboard-grid">
            <DashboardCard icon="profile" eyebrow="Profile card" title="Identity overview" accent="warm">
              {profile ? (
                <div className="pro-profile-panel">
                  <div>
                    <span className="pro-meta-label">Name</span>
                    <strong>{profile.displayName || profile.fullName || "Professional"}</strong>
                  </div>
                  <div>
                    <span className="pro-meta-label">Rating</span>
                    <strong className="pro-rating-inline">
                      <MiniIcon name="rating" />
                      {Number(profile.rating || 0).toFixed(1)}
                    </strong>
                  </div>
                  <div>
                    <span className="pro-meta-label">Current focus</span>
                    <strong>
                      {loading
                        ? "Loading your workload..."
                        : (dashboard?.ongoingBookings || 0) > 0
                          ? `${dashboard?.ongoingBookings} active job(s)`
                          : "Ready for new work"}
                    </strong>
                  </div>
                </div>
              ) : (
                <p className="pro-loading-copy">Loading profile...</p>
              )}
            </DashboardCard>

            <DashboardCard icon="status" eyebrow="Status card" title="Availability" accent="success">
              {profile ? (
                <div className="pro-status-panel">
                  <div className="pro-status-copy">
                    <span className={`pro-live-indicator ${profile.isOnline ? "online" : "offline"}`} />
                    <div>
                      <strong>{profile.isOnline ? "You are online" : "You are offline"}</strong>
                      <p>{profile.isOnline ? "Customers can be assigned to you." : "Switch online when you are ready to take jobs."}</p>
                    </div>
                  </div>

                  <label className="pro-toggle" aria-label="Toggle online status">
                    <input
                      type="checkbox"
                      checked={Boolean(profile.isOnline)}
                      onChange={(event) => setOnline(event.target.checked)}
                      disabled={statusLoading}
                    />
                    <span className="pro-toggle-track">
                      <span className="pro-toggle-thumb" />
                    </span>
                    <span className={`pro-toggle-label ${profile.isOnline ? "online" : "offline"}`}>
                      {statusLoading ? "Saving..." : profile.isOnline ? "Online" : "Offline"}
                    </span>
                  </label>
                </div>
              ) : (
                <p className="pro-loading-copy">Syncing your status...</p>
              )}
            </DashboardCard>

            <DashboardCard icon="money" eyebrow="Stats card" title="Performance snapshot" accent="cool">
              <div className="pro-stats-panel">
                <div className="pro-stat-tile">
                  <span className="pro-meta-label">Total bookings</span>
                  <strong>{dashboard?.totalBookings ?? 0}</strong>
                </div>
                <div className="pro-stat-tile">
                  <span className="pro-meta-label">Completed</span>
                  <strong>{dashboard?.completedBookings ?? 0}</strong>
                </div>
                <div className="pro-stat-tile">
                  <span className="pro-meta-label">Earnings</span>
                  <strong>{formatCurrency(dashboard?.earnings ?? 0)}</strong>
                </div>
              </div>
            </DashboardCard>
          </section>

          {loading ? (
            <section className="pro-section">
              <div className="pro-loading-panel">
                <span className="pro-spinner" />
                <p className="pro-loading-copy">Loading professional bookings...</p>
              </div>
            </section>
          ) : (
            <ProfessionalBookingBoard
              bookings={bookings}
              servicesById={{}}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              busyActionKey={busyActionKey}
              onAction={handleBookingAction}
            />
          )}

          <section className="pro-section">
            <div className="pro-section-header">
              <div>
                <p className="pro-section-kicker">Today at a glance</p>
                <h2>Operational summary</h2>
              </div>
            </div>

            <div className="pro-summary-strip">
              <div className="pro-summary-item">
                <span className="pro-meta-label">Primary status</span>
                <strong>{profile ? formatStatus(profile.isOnline ? "ONLINE" : "OFFLINE") : "Loading"}</strong>
              </div>
              <div className="pro-summary-item">
                <span className="pro-meta-label">Upcoming work</span>
                <strong>{dashboard?.upcomingBookings ?? 0} jobs</strong>
              </div>
              <div className="pro-summary-item">
                <span className="pro-meta-label">Completed revenue</span>
                <strong>{formatCurrency(dashboard?.earnings ?? 0)}</strong>
              </div>
            </div>
          </section>
        </>
      )}
    </ProfessionalShell>
  );
}
