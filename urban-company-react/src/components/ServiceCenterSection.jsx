import { useCart } from "../context/CartContext";
import { resolveImage } from "../utils/image";

export default function ServiceCenterSection({ sections = [] }) {
  const { addToCart } = useCart();

  return (
    <div className="service-center-section">
      {sections.length === 0 && <p>No services available</p>}
      {sections.map((section) => (
        <div key={section.id} id={section.id} className="service-section">
          {section.img && (
            <img src={resolveImage(section.img)} alt={section.title} />
          )}
          <h3>{section.title}</h3>

          {section.items.map((item, index) => (
            <div key={index} className="service-card-row">
              <div>
                <h4>{item.name}</h4>
                {item.desc && <p>{item.desc}</p>}
                <span className="service-price">Rs {item.price}</span>
                <p>----------------------------------------------------------</p>
              </div>
              <div className="service-card-action">
                {item.img && (
                  <img src={resolveImage(item.img)} alt={item.name} />
                )}
                <button
                  className="add-btn"
                  onClick={() =>
                    addToCart({
                      key: `${section.id}-${item.serviceId || "svc"}-${item.serviceOptionId || item.name}`,
                      serviceId: item.serviceId,
                      serviceOptionId: item.serviceOptionId,
                      name: item.name,
                      price: item.price,
                      img: item.img
                    })
                  }
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
