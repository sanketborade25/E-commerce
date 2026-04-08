import { MiniIcon } from "../ProfessionalShell";

export default function AdminFileInput({ inputKey, label, onChange }) {
  return (
    <label className="admin-file-input">
      <input
        key={inputKey}
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0])}
      />
      <span className="admin-file-input-icon">
        <MiniIcon name="image" />
      </span>
      <span className="admin-file-input-text">{label}</span>
    </label>
  );
}
