import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfessionalBookingBoard from "../components/ProfessionalBookingBoard";
import ProfessionalShell from "../components/ProfessionalShell";
import { api } from "../api/client";
import {
  clearPartnerSession,
  isAuthError
} from "../utils/professional";

export default function ProfessionalBookings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyActionKey, setBusyActionKey] = useState("");

  const handleAuthFailure = () => {
    clearPartnerSession();
    navigate("/professional/login");
  };

  const load = async (selectedTab = activeTab) => {
    const auth = localStorage.getItem("professional_authed") === "true";
    if (!auth) {
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
      setError(loadError?.message || "Unable to load professional bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(activeTab);
  }, [activeTab]);

  const handleBookingAction = async (booking, action) => {
    const actionKey = `${booking.id}:${action}`;
    setBusyActionKey(actionKey);
    setError("");

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

      await load(activeTab);
    } catch (updateError) {
      console.error(updateError);
      if (isAuthError(updateError)) {
        handleAuthFailure();
        return;
      }
      setError(updateError?.message || "Unable to update professional booking.");
    } finally {
      setBusyActionKey("");
    }
  };

  const quickStats = useMemo(
    () => [
      { label: "Upcoming", value: dashboard?.upcomingBookings ?? 0 },
      { label: "In progress", value: dashboard?.ongoingBookings ?? 0 },
      { label: "Completed", value: dashboard?.completedBookings ?? 0 }
    ],
    [dashboard]
  );

  return (
    <ProfessionalShell
      profile={profile}
      bookings={bookings}
      title="Professional bookings"
      subtitle="Stay on top of what is next, what is in progress, and what has already been delivered."
      quickStats={quickStats}
      notificationCount={dashboard?.notificationCount ?? 0}
    >
      {error && (
        <section className="pro-section">
          <div className="pro-error-banner">
            <div>
              <strong>Bookings are temporarily unavailable.</strong>
              <p>{error}</p>
            </div>
            <button type="button" className="pro-action primary" onClick={() => load(activeTab)}>
              Retry
            </button>
          </div>
        </section>
      )}

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
    </ProfessionalShell>
  );
}
