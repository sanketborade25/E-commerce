import React from "react";
import { resolveImage } from "../utils/image";

export default function LeftSidebar({ menu = [] }) {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="left-sidebar">
      <h4>Select a service<span><hr/></span></h4>
      {menu.length === 0 && <p>No services available</p>}
      <div className="menu-item">
        {menu.map((item) => (
          <div
            key={item.id}
            className="item"
            onClick={() => scrollTo(item.id)}
          >
            {item.img && (
              <img
                src={resolveImage(item.img)}
                alt={item.label}
                className="menu-icon"
              />
            )}
           <p>{item.label}</p>
           
          </div>
        ))}
      </div>
    </div>
  );
}
