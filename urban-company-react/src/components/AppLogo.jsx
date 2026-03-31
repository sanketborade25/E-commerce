import "../styles/components/app-logo.css";

export default function AppLogo({ className = "", label = "UC" }) {
  return (
    <div className="app-logo" aria-label="Urban Company logo">
      <span className={`app-logo-badge ${className}`.trim()}>{label}</span>
    </div>
  );
}
