import { useEffect, useMemo, useRef, useState } from "react";
import ServiceGrid from "../components/ServiceGrid";
import DynamicPopup from "../components/DynamicPopup";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { api } from "../api/client";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  // Sub-categories are loaded from the API, not local storage.
  const [popupSubCategories, setPopupSubCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [cityId, setCityId] = useState(
    () => localStorage.getItem("selected_city_id") || ""
  );
  const adminVersionRef = useRef(
    localStorage.getItem("admin_data_version") || ""
  );

  const slugify = (value = "") =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");



  const resolveCategoryImage = (category) => {
    if (category?.imageUrl) return category.imageUrl;
    return "Homepage/serviceCategory/InstaHelp.png";
  };

  // Use API-provided slug/name for links (avoid local data mapping).
  const resolveServiceKey = (category) =>
    slugify(category?.slug || category?.name || "");

  // Pull sub-categories from backend API
  const loadPopupSubCategories = async () => {
    try {
      const data = await api.getSubCategories();
      setPopupSubCategories(data || []);
    } catch {
      setPopupSubCategories([]);
    }
  };

  useEffect(() => {
    const handleCity = (e) => {
      const next = e.detail?.cityId || "";
      setCityId(next);
    };
    window.addEventListener("city-changed", handleCity);
    return () => window.removeEventListener("city-changed", handleCity);
  }, []);

  useEffect(() => {
    let mounted = true;
    // Load categories + sub-categories from backend API.
    const load = async () => {
      try {
        const [cats, subcats] = await Promise.all([
          api.getCategories({ cityId: cityId || undefined }),
          api.getSubCategories({ cityId: cityId || undefined })
        ]);
        if (!mounted) return;
        const allCats = cats || [];
        const mappedCats = allCats
          .filter((c) => c.parentCategoryId == null)
          .map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            img: resolveCategoryImage(c),
            raw: c
          }))
          .sort((a, b) => b.id - a.id);
        setCategories(mappedCats);
        setAllCategories(allCats);
        const derivedSubcats = (allCats || []).filter(
          (c) => c.parentCategoryId != null
        );
        setPopupSubCategories(
          subcats && subcats.length > 0 ? subcats : derivedSubcats
        );
      } catch (e) {
        if (!mounted) return;
        setCategories([]);
        setAllCategories([]);
        setPopupSubCategories([]);
      }
    };
    // Keep data in sync with admin updates.
    const handleAdminChange = () => {
      load();
    };
    const handleStorage = (e) => {
      if (e.key === "admin_data_version") load();
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
  }, [cityId]);

  useEffect(() => {
    if (activeCategory) {
      loadPopupSubCategories();
    }
  }, [activeCategory]);

  // Build popup data from sub-categories API response.
  const popupData = useMemo(() => {
    if (!activeCategory) return null;
    const category = activeCategory.raw || activeCategory;
    const serviceKey = resolveServiceKey(category);
    const subSource =
      popupSubCategories.length > 0
        ? popupSubCategories
        : allCategories.filter((c) => c.parentCategoryId != null);
    const getParentId = (item) =>
      item.parentCategoryId ??
      item.parentCategoryID ??
      item.categoryId ??
      item.categoryID ??
      null;
    const subItems = subSource.filter(
      (item) => String(getParentId(item)) === String(category.id)
    );
    return {
      title: activeCategory.name,
      sections: [
        {
          heading: "",
          items: subItems.map((item) => ({
            name: item.name || item.title,
            img: item.imageUrl || activeCategory.img,
            link: `/services/${serviceKey}?subCategoryId=${item.id}`
          }))
        }
      ]
    };
  }, [activeCategory, popupSubCategories, allCategories]);

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
