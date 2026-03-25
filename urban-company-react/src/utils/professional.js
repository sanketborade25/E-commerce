export const PROFESSIONAL_NAV_ITEMS = [
  { to: "/professional/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/professional/bookings", label: "Bookings", icon: "bookings" },
  { to: "/professional/availability", label: "Availability", icon: "availability" },
  { to: "/professional/earnings", label: "Earnings", icon: "earnings" }
];

export const BOOKING_TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "ongoing", label: "Ongoing" },
  { key: "completed", label: "Completed" }
];

export function normalizeStatus(status) {
  return String(status || "PENDING").trim().toUpperCase();
}

export function formatStatus(status) {
  return normalizeStatus(status)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getBookingTab(status) {
  const normalized = normalizeStatus(status);
  if (normalized === "COMPLETED") return "completed";
  if (normalized === "STARTED" || normalized === "ON_THE_WAY") return "ongoing";
  return "upcoming";
}

export function getStatusTone(status) {
  const normalized = normalizeStatus(status);
  if (normalized === "COMPLETED") return "success";
  if (normalized === "STARTED" || normalized === "ON_THE_WAY") return "info";
  if (normalized === "REJECTED") return "danger";
  return "warning";
}

export function getBookingActions(status) {
  const normalized = normalizeStatus(status);

  if (normalized === "PENDING" || normalized === "ASSIGNED") {
    return [
      { key: "accept", label: "Accept", kind: "primary" },
      { key: "reject", label: "Reject", kind: "danger" }
    ];
  }

  if (normalized === "ACCEPTED") {
    return [{ key: "onTheWay", label: "On the way", kind: "secondary" }];
  }

  if (normalized === "ON_THE_WAY") {
    return [{ key: "start", label: "Start", kind: "secondary" }];
  }

  if (normalized === "STARTED" || normalized === "ON_THE_WAY") {
    return [{ key: "complete", label: "Complete", kind: "success" }];
  }

  return [];
}

export function getServiceLabel(booking, servicesById) {
  if (booking?.serviceName) {
    if ((booking?.itemCount || booking?.items?.length || 0) > 1 && booking.serviceNames?.length > 1) {
      return `${booking.serviceName} +${booking.serviceNames.length - 1} more`;
    }
    return booking.serviceName;
  }

  const firstItem = booking?.items?.[0];
  const totalItems = booking?.items?.length || 0;

  if (!firstItem) return "General service";

  const serviceName = servicesById[firstItem.serviceId]?.title || `Service #${firstItem.serviceId}`;
  if (totalItems <= 1) return serviceName;

  return `${serviceName} +${totalItems - 1} more`;
}

export function formatDateTime(value) {
  if (!value) return "Schedule pending";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function getNotificationCount(bookings) {
  return (bookings || []).filter((booking) =>
    ["PENDING", "ASSIGNED"].includes(normalizeStatus(booking.status))
  ).length;
}

export function getQuickStats(bookings) {
  const safeBookings = bookings || [];
  const completed = safeBookings.filter(
    (booking) => normalizeStatus(booking.status) === "COMPLETED"
  );
  const ongoing = safeBookings.filter((booking) => getBookingTab(booking.status) === "ongoing");

  return {
    total: safeBookings.length,
    ongoing: ongoing.length,
    completed: completed.length,
    earnings: completed.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0)
  };
}

export function clearPartnerSession() {
  localStorage.removeItem("professional_authed");
  localStorage.removeItem("auth_user");
  localStorage.removeItem("auth_token");
  window.dispatchEvent(new Event("auth-token-changed"));
}

export function isAuthError(error) {
  return error?.status === 401 || error?.status === 403;
}
