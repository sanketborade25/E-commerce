export function notifyAdminDataChanged() {
  localStorage.setItem("admin_data_version", String(Date.now()));
  window.dispatchEvent(new Event("admin-data-changed"));
}
