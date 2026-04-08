import { BOOKING_TABS, formatCurrency, formatDateTime, formatStatus, getBookingActions, getServiceLabel, getStatusTone } from "../utils/professional";
import { MiniIcon } from "./ProfessionalShell";

export default function ProfessionalBookingBoard({
  bookings = [],
  servicesById = {},
  activeTab,
  onTabChange,
  tabCounts = {},
  busyActionKey,
  onAction
}) {
  return (
    <section className="pro-section">
      <div className="pro-section-header">
        <div>
          <p className="pro-section-kicker">Bookings</p>
          <h2>Service pipeline</h2>
        </div>
        <div className="pro-tab-list" role="tablist" aria-label="Booking categories">
          {BOOKING_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`pro-tab${activeTab === tab.key ? " active" : ""}`}
              onClick={() => onTabChange(tab.key)}
            >
              <span>{tab.label}</span>
              <strong>{tabCounts[tab.key] ?? 0}</strong>
            </button>
          ))}
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="pro-empty-state">
          <div className="pro-empty-icon">
            <MiniIcon name="bookings" />
          </div>
          <h3>No {activeTab} bookings</h3>
          <p>Your work queue for this section is clear right now.</p>
        </div>
      ) : (
        <div className="pro-booking-grid">
          {bookings.map((booking) => {
            const actions = getBookingActions(booking.status);
            const statusTone = getStatusTone(booking.status);

            return (
              <article key={booking.id} className="pro-booking-card">
                <div className="pro-booking-top">
                  <div>
                    <p className="pro-booking-service">{getServiceLabel(booking, servicesById)}</p>
                    <h3>{booking.bookingReference || "Booking"}</h3>
                  </div>
                  <span className={`pro-status-badge ${statusTone}`}>{formatStatus(booking.status)}</span>
                </div>

                <div className="pro-booking-meta">
                  <div>
                    <span className="pro-meta-label">Date & time</span>
                    <strong>{formatDateTime(booking.scheduledAt)}</strong>
                  </div>
                  <div>
                    <span className="pro-meta-label">Amount</span>
                    <strong>{formatCurrency(booking.totalAmount)}</strong>
                  </div>
                  <div>
                    <span className="pro-meta-label">Items</span>
                    <strong>{booking.itemCount || booking.items?.length || 0} service(s)</strong>
                  </div>
                </div>

                <div className="pro-booking-footer">
                  <span className="pro-payment-chip">{booking.paymentStatus || "Pending payment"}</span>
                  <div className="pro-booking-actions">
                    {actions.length === 0 ? (
                      <button type="button" className="pro-action ghost" disabled>
                        Up to date
                      </button>
                    ) : (
                      actions.map((action) => {
                        const actionKey = `${booking.id}:${action.key}`;
                        return (
                          <button
                            key={action.key}
                            type="button"
                            className={`pro-action ${action.kind}`}
                            disabled={busyActionKey === actionKey}
                            onClick={() => onAction(booking, action.key)}
                          >
                            {busyActionKey === actionKey ? "Updating..." : action.label}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
