import { resolveImage } from "../utils/image";

export default function DynamicPopup({ data, onClose }) {
  if (!data) return null;

  return (
    <div className="modal" style={{ display: "flex" }}>
      <div className="modal-content large-modal">
        <span className="close-btn" onClick={onClose}>&times;</span>

        <h2>{data.title}</h2>

        {data.sections.map((section, i) => (
          <div key={i}>
            {section.heading && <h3>{section.heading}</h3>}
            <div className="popup-services four-cols">
              {section.items.map((item, j) => (
                <div
                  key={j}
                  className="popup-card"
                  onClick={() => item.link && (window.location.href = item.link)}
                >
                  {item.tag && <span className="tag">{item.tag}</span>}
                  {item.img && (
                    <img src={resolveImage(item.img)} alt={item.name} />
                  )}
                  <p>
                    {item.name}
                    {item.instant && <><br /><small>⚡ Instant</small></>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
