export default function ServiceCard({ title, onClick }) {
  return (
    <div className="service-card" onClick={onClick}>
      <p>{title}</p>
    </div>
  );
}
