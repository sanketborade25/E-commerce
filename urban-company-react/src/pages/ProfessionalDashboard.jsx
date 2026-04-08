import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
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

const MOCK_DASHBOARD = {
  totalBookings: 12,
  upcomingBookings: 4,
  ongoingBookings: 2,
  completedBookings: 8,
  earnings: 12400,
  notificationCount: 2
};

const MOCK_RECENT_ACTIVITY = [
  { title: "Deep cleaning request assigned", detail: "Koramangala, 30 minutes ago" },
  { title: "Customer marked a booking complete", detail: "HSR Layout, 2 hours ago" },
  { title: "Availability synced successfully", detail: "Today, 9:10 AM" }
];

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

function RatingDisplay({ rating }) {
  const numericRating = Number(rating || 0);
  const hasRating = numericRating > 0;
  const roundedStars = hasRating ? Math.round(numericRating) : 0;

  return (
    <div className="pro-rating-block">
      <div
        className="pro-rating-stars"
        aria-label={hasRating ? `Rating ${numericRating.toFixed(1)} out of 5` : "No rating yet"}
      >
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={`rating-star-${index}`}
            className={`pro-rating-star${index < roundedStars ? " filled" : ""}`}
          >
            ★
          </span>
        ))}
      </div>
      <strong className="pro-rating-value">
        {hasRating ? numericRating.toFixed(1) : "No ratings yet"}
      </strong>
    </div>
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
  const [actionSuccess, setActionSuccess] = useState("");
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

  const hasLiveDashboardData = useMemo(() => {
    if (!dashboard) return false;
    return [
      dashboard.totalBookings,
      dashboard.upcomingBookings,
      dashboard.ongoingBookings,
      dashboard.completedBookings,
      dashboard.earnings,
      dashboard.notificationCount
    ].some((value) => Number(value || 0) > 0);
  }, [dashboard]);

  const dashboardView = hasLiveDashboardData ? dashboard || MOCK_DASHBOARD : MOCK_DASHBOARD;

  const quickStats = useMemo(
    () => [
      { label: "Total bookings", value: dashboardView.totalBookings },
      { label: "Ongoing", value: dashboardView.ongoingBookings },
      { label: "Earnings", value: dashboardView.earnings, currency: true }
    ],
    [dashboardView]
  );

  const tabCounts = useMemo(
    () => ({
      upcoming: dashboardView.upcomingBookings ?? 0,
      ongoing: dashboardView.ongoingBookings ?? 0,
      completed: dashboardView.completedBookings ?? 0
    }),
    [dashboardView]
  );

  const recentActivity = useMemo(() => {
    if (bookings.length > 0) {
      return bookings.slice(0, 3).map((booking) => ({
        title: `${formatStatus(booking.status)}: ${booking.bookingReference || "Booking"}`,
        detail: `${formatCurrency(booking.totalAmount)} • ${booking.serviceName || "Service request"}`
      }));
    }

    return MOCK_RECENT_ACTIVITY;
  }, [bookings]);

  const setOnline = async (isOnline) => {
    if (!profile) return;

    setStatusLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const updatedProfile = await api.updateProfessionalStatusSummary(isOnline);
      setProfile(updatedProfile);
      const dashboardData = await api.getProfessionalDashboard();
      setDashboard(dashboardData);

      const successMessage = isOnline
        ? "You are now visible for new assignments."
        : "You are offline and will not receive new jobs.";
      setActionSuccess(successMessage);
      toast.success(successMessage);
    } catch (updateError) {
      console.error(updateError);
      if (isAuthError(updateError)) {
        handleAuthFailure();
        return;
      }
      const message = updateError?.message || "Unable to update professional status.";
      setActionError(message);
      toast.error(message);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleBookingAction = async (booking, action) => {
    const actionKey = `${booking.id}:${action}`;
    setBusyActionKey(actionKey);
    setActionError("");
    setActionSuccess("");

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
      const successMessage = "Booking updated successfully.";
      setActionSuccess(successMessage);
      toast.success(successMessage);
    } catch (updateError) {
      console.error(updateError);
      if (isAuthError(updateError)) {
        handleAuthFailure();
        return;
      }
      const message = updateError?.message || "Unable to update booking.";
      setActionError(message);
      toast.error(message);
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
      notificationCount={dashboardView.notificationCount ?? 0}
      actions={
        <>
          <button
            type="button"
            className="pro-action ghost"
            onClick={() => navigate("/professional/bookings")}
          >
            View Bookings
          </button>
          <button
            type="button"
            className="pro-action primary"
            onClick={() => navigate("/home")}
          >
            Update Profile
          </button>
        </>
      }
    >
      {error ? (
        <ErrorState message={error} onRetry={() => loadDashboard(activeTab)} />
      ) : (
        <>
          {!hasLiveDashboardData && !loading && (
            <section className="pro-section">
              <div className="pro-inline-info">
                <strong>Preview metrics are showing.</strong>
                <span>Live totals will replace these cards as soon as real bookings start coming in.</span>
              </div>
            </section>
          )}

          {actionSuccess && (
            <section className="pro-section">
              <div className="pro-inline-success">
                <strong>Updated.</strong>
                <span>{actionSuccess}</span>
              </div>
            </section>
          )}

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
                    <RatingDisplay rating={profile.rating} />
                  </div>
                  <div>
                    <span className="pro-meta-label">Current focus</span>
                    <strong>
                      {loading
                        ? "Loading your workload..."
                        : (dashboardView.ongoingBookings || 0) > 0
                          ? `${dashboardView.ongoingBookings} active job(s)`
                          : "Ready for new work"}
                    </strong>
                  </div>
                  <div>
                    <span className="pro-meta-label">Base city</span>
                    <strong>{profile.cityName || "City pending"}</strong>
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
                      <p>
                        {profile.isOnline
                          ? "Customers can be assigned to you."
                          : "Switch online when you are ready to take jobs."}
                      </p>
                    </div>
                  </div>

                  <p className="pro-status-helper">
                    {statusLoading
                      ? "Updating your live availability..."
                      : profile.isOnline
                        ? "You are ready to receive new work."
                        : "Turn this on when you are ready to accept new requests."}
                  </p>

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
                  <strong>{dashboardView.totalBookings}</strong>
                </div>
                <div className="pro-stat-tile">
                  <span className="pro-meta-label">Completed</span>
                  <strong>{dashboardView.completedBookings}</strong>
                </div>
                <div className="pro-stat-tile">
                  <span className="pro-meta-label">Earnings</span>
                  <strong>{formatCurrency(dashboardView.earnings)}</strong>
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
              tabCounts={tabCounts}
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

            <div className="pro-summary-strip pro-summary-strip-4">
              <div className="pro-summary-item">
                <span className="pro-meta-label">Primary status</span>
                <strong>{profile ? formatStatus(profile.isOnline ? "ONLINE" : "OFFLINE") : "Loading"}</strong>
              </div>
              <div className="pro-summary-item">
                <span className="pro-meta-label">Upcoming work</span>
                <strong>{dashboardView.upcomingBookings ?? 0} jobs</strong>
              </div>
              <div className="pro-summary-item">
                <span className="pro-meta-label">Completed revenue</span>
                <strong>{formatCurrency(dashboardView.earnings ?? 0)}</strong>
              </div>
              <div className="pro-summary-item">
                <span className="pro-meta-label">Alerts</span>
                <strong>{dashboardView.notificationCount ?? 0} pending</strong>
              </div>
            </div>
          </section>

          <section className="pro-section">
            <div className="pro-section-header">
              <div>
                <p className="pro-section-kicker">Recent activity</p>
                <h2>Latest updates</h2>
              </div>
            </div>

            <div className="pro-list-grid">
              {recentActivity.map((item) => (
                <article key={`${item.title}-${item.detail}`} className="pro-list-card">
                  <span className="pro-meta-label">Activity</span>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </ProfessionalShell>
  );
}
