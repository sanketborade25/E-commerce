import { resolveImage } from "../utils/image";

export default function ServiceGrid({ categories = [], openPopup }) {
  const items = categories.map((c) => ({
    key: c.key || c.id,
    id: c.id,
    slug: c.slug,
    name: c.name,
    img: c.img,
    raw: c.raw
  }));

  return (
    <div className="services-grid">
      {items.length === 0 && <p>No categories available</p>}
      {items.map((item) => (
        <div
          key={item.key}
          className="service-card"
          onClick={() => openPopup(item)}
        >
          {item.img && <img src={resolveImage(item.img)} alt={item.name} />}
          <p>{item.name}</p>
        </div>
      ))}
    </div>
  );
}
