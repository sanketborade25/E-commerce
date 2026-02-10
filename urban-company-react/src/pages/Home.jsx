import { useEffect, useMemo, useRef, useState } from "react";
import ServiceGrid from "../components/ServiceGrid";
import DynamicPopup from "../components/DynamicPopup";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { api } from "../api/client";
import leftData from "../data/servicesLeftSidebarData";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [options, setOptions] = useState([]);
  const [popupSubCategories, setPopupSubCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const adminVersionRef = useRef(
    localStorage.getItem("admin_data_version") || ""
  );

  const slugify = (value = "") =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const categoryIconMap = {
    "women": "1Homepage/serviceCategory/SalonForWomen.png",
    "men": "1Homepage/serviceCategory/MenSalon.png",
    "cleaning": "1Homepage/serviceCategory/Cleaning.png",
    "electrician-plumber-carpenter": "1Homepage/serviceCategory/ECP.png",
    "ac-appliance-repair": "1Homepage/serviceCategory/ACRepair.png",
    "painting-waterproofing": "1Homepage/serviceCategory/Painting.png",
    "water-purifier": "1Homepage/serviceCategory/Purifier.png",
    "wall-make-over": "1Homepage/serviceCategory/Wall.png",
    "insta-help": "1Homepage/serviceCategory/InstaHelp.png"
  };

  const resolveCategoryImage = (category) => {
    if (category?.imageUrl) return category.imageUrl;
    const key = slugify(category?.slug || category?.name || "");
    return categoryIconMap[key] || "Homepage/serviceCategory/InstaHelp.png";
  };

  const resolveServiceKey = (category) => {
    if (!category) return "";
    const catKey = slugify(category.slug || category.name);
    const byKey = Object.keys(leftData).find((k) => slugify(k) === catKey);
    if (byKey) return byKey;
    const byTitle = Object.entries(leftData).find(
      ([, v]) => slugify(v.title) === catKey
    );
    return byTitle?.[0] || catKey;
  };

  const loadPopupSubCategories = () => {
    try {
      const stored = localStorage.getItem("popup_subcategories");
      setPopupSubCategories(stored ? JSON.parse(stored) : []);
    } catch {
      setPopupSubCategories([]);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [cats, svcs, opts] = await Promise.all([
          api.getCategories(),
          api.getServices(),
          api.getServiceOptions()
        ]);
        if (!mounted) return;
        const mappedCats = (cats || [])
          .map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            img: resolveCategoryImage(c),
            raw: c
          }))
          .sort((a, b) => b.id - a.id);
        setCategories(mappedCats);
        setServices(svcs || []);
        setOptions(opts || []);
        loadPopupSubCategories();
      } catch (e) {
        if (!mounted) return;
        setCategories([]);
        setServices([]);
        setOptions([]);
        loadPopupSubCategories();
      }
    };
    const handleAdminChange = () => {
      load();
      loadPopupSubCategories();
    };
    const handleStorage = (e) => {
      if (e.key === "admin_data_version") load();
      if (e.key === "popup_subcategories") loadPopupSubCategories();
    };
    const handleFocus = () => load();
    const handleVisibility = () => {
      if (!document.hidden) load();
    };
    const poll = window.setInterval(() => {
      const next = localStorage.getItem("admin_data_version") || "";
      if (next && next !== adminVersionRef.current) {
        adminVersionRef.current = next;
        load();
      }
    }, 2000);
    const channel =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel("admin-data");
    const handleChannel = (event) => {
      if (event?.data?.type === "refresh") load();
    };
    window.addEventListener("admin-data-changed", handleAdminChange);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    channel?.addEventListener("message", handleChannel);
    load();
    return () => {
      mounted = false;
      window.removeEventListener("admin-data-changed", handleAdminChange);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(poll);
      channel?.removeEventListener("message", handleChannel);
      channel?.close();
    };
  }, []);

  useEffect(() => {
    if (activeCategory) {
      loadPopupSubCategories();
    }
  }, [activeCategory]);

  const popupData = useMemo(() => {
    if (!activeCategory) return null;
    const category = activeCategory.raw || activeCategory;
    const serviceKey = resolveServiceKey(category);
    const subItems = popupSubCategories.filter(
      (item) => String(item.categoryId) === String(category.id)
    );
    if (subItems.length > 0) {
      return {
        title: activeCategory.name,
        sections: [
          {
            heading: "Sub Categories",
            items: subItems.map((item) => ({
              name: item.title,
              img: item.imageUrl || activeCategory.img,
              link: `/services/${serviceKey}#${slugify(item.title)}`
            }))
          }
        ]
      };
    }
    const categoryServices = services.filter(
      (s) => s.categoryId === category.id
    );
    const optionsByService = new Map();
    options.forEach((opt) => {
      if (!optionsByService.has(opt.serviceId)) {
        optionsByService.set(opt.serviceId, []);
      }
      optionsByService.get(opt.serviceId).push(opt);
    });

    const sections = categoryServices.map((svc) => {
      const svcOptions = optionsByService.get(svc.id) || [];
      const items =
        svcOptions.length > 0
          ? svcOptions.map((opt) => ({
              name: opt.name || svc.title,
              img: opt.imageUrl || activeCategory.img,
              link: `/services/${serviceKey}#${slugify(svc.title)}`
            }))
          : [
              {
                name: svc.title,
                img: activeCategory.img,
                link: `/services/${serviceKey}#${slugify(svc.title)}`
              }
            ];
      return {
        heading: svc.title,
        items
      };
    });

    return {
      title: activeCategory.name,
      sections
    };
  }, [activeCategory, services, options]);

  return (
    <>
      <Navbar />

      <section className="hero">
        <div>
          <h1>Home services at your doorstep</h1>
          <div className="hero-left">
            <h3>What are you looking for?</h3>
            <ServiceGrid
              categories={categories.slice(0, 9)}
              openPopup={(item) =>
                setActiveCategory({
                  id: item.id,
                  name: item.name,
                  slug: item.slug,
                  img: item.img,
                  raw: item
                })
              }
            />
          </div>
        </div>

        <div className="hero-right">
          <img src="/images/1Homepage/hommepageSideBanner.png" />
        </div>
      </section>

      <section className="offers">
        <h2>Offers & discounts</h2>
        <div className="offer-row">
          <div className="offer-card"><img src="/images/FullRoomCleaning/image_14.png"/><p>Sofa cleaning ₹569</p><button>Book now</button></div>
          <div className="offer-card"><img src="/images/FullHomePainting/image_24.png"/><p>Home painting</p><button>Book now</button></div>
          <div className="offer-card"><img src="/images/massageForMen/image_14.png"/><p>Massage for men</p><button>Book now</button></div>
        </div>
      </section>

      <section className="products">
        <h2>New and noteworthy</h2>
        <div className="product-row">
          <div className="product-card"><img src="images/1Homepage/nnn_1.png"/><p>Insta Help</p></div>
          <div className="product-card"><img src="images/1Homepage/nnn_3.png"/><p>Electrician</p></div>
          <div className="product-card"><img src="images/1Homepage/nnn_4.png"/><p>Stove</p></div>
          <div className="product-card"><img src="images/1Homepage/nnn_9.png"/><p>Laptop</p></div>
          <div className="product-card"><img src="images/1Homepage/nnn_6.png"/><p>Door Locker</p></div>
        </div>
      </section>

      <section className="most-booked">
        <h2>Most booked services</h2>
        <div className="booked-row">
          <div className="booked-card"><img src="/images/1Homepage/mostBookedS (1).png" /><p>Bathroom Cleaning ₹1016</p></div>
          <div className="booked-card"><img src="/images/1Homepage/mostBookedS (1).png" /><p>Classic Cleaning ₹905</p></div>
          <div className="booked-card"><img src="/images/1Homepage/mostBookedS (3).png" /><p>Men Haircut ₹139</p></div>
          <div className="booked-card"><img src="/images/1Homepage/mostBookedS (4).png" /><p>Washing Machine ₹199</p></div>
          <div className="booked-card"><img src="/images/1Homepage/mostBookedS (7).png" /><p>Women Waxing ₹129</p></div>
        </div>
      </section>

      <Footer />

      <DynamicPopup
        data={popupData}
        onClose={() => setActiveCategory(null)}
      />
    </>
  );
}
