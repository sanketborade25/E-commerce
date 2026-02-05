import { useEffect, useMemo, useState } from "react";
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
  const [activeCategory, setActiveCategory] = useState(null);

  const slugify = (value = "") =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const resolveCategoryImage = (category) => category?.imageUrl || "";

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
      } catch (e) {
        if (!mounted) return;
        setCategories([]);
        setServices([]);
        setOptions([]);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const popupData = useMemo(() => {
    if (!activeCategory) return null;
    const category = activeCategory.raw || activeCategory;
    const serviceKey = resolveServiceKey(category);
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
              img: opt.imageUrl || svc.imageUrl || activeCategory.img,
              link: `/services/${serviceKey}#${slugify(svc.title)}`
            }))
          : [
              {
                name: svc.title,
                img: svc.imageUrl || activeCategory.img,
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
          <p className="admin-muted">Add offers from the admin panel.</p>
        </div>
      </section>

      <section className="products">
        <h2>New and noteworthy</h2>
        <div className="product-row">
          <p className="admin-muted">Add new items from the admin panel.</p>
        </div>
      </section>

      <section className="most-booked">
        <h2>Most booked services</h2>
        <div className="booked-row">
          <p className="admin-muted">Most booked services will appear here.</p>
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

