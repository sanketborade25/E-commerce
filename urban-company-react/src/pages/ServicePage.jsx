import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import leftData from "../data/servicesLeftSidebarData";
import ServiceLayout from "../components/ServiceLayout";
import Navbar from "../components/Navbar";
import { api } from "../api/client";

export default function ServicePage() {
  const { serviceKey } = useParams();
  const location = useLocation();

  const leftPageData = leftData[serviceKey];
  const [menu, setMenu] = useState([]);
  const [sections, setSections] = useState([]);
  const [cityId, setCityId] = useState(
    () => localStorage.getItem("selected_city_id") || ""
  );

  const slugify = (value = "") =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const buildLongDesc = (label, existing) => {
    const base = existing || `Includes ${label.toLowerCase()} service.`;
    return (
      `${base} ` +
      "Detailed inspection and preparation included. " +
      "Standard tools and materials used where applicable. " +
      "Clean finish with after-service guidance."
    );
  };

  const resolveCategory = (categories) => {
    if (!categories?.length) return null;
    const matchBySlug = categories.find(
      (c) => c.slug && slugify(c.slug) === slugify(serviceKey)
    );
    if (matchBySlug) return matchBySlug;
    const leftTitle = leftPageData?.title || "";
    const byKey = categories.find(
      (c) => slugify(c.name) === slugify(serviceKey)
    );
    if (byKey) return byKey;
    const byTitle = categories.find(
      (c) => slugify(c.name) === slugify(leftTitle)
    );
    return byTitle || null;
  };

  const pickImageForService = (serviceTitle, fallbackUrl) => {
    if (fallbackUrl) return fallbackUrl;
    return "";
  };

  const buildSectionsFromApi = (services, options) => {
    const optionsByService = new Map();
    options.forEach((opt) => {
      if (!optionsByService.has(opt.serviceId)) {
        optionsByService.set(opt.serviceId, []);
      }
      optionsByService.get(opt.serviceId).push(opt);
    });

    return services.map((svc) => {
      const svcOptions = optionsByService.get(svc.id) || [];
      const items =
        svcOptions.length > 0
          ? svcOptions.map((opt) => ({
              img: pickImageForService(svc.title, opt.imageUrl || svc.imageUrl),
              name: opt.name || svc.title,
              desc: buildLongDesc(opt.name || svc.title, svc.shortDescription),
              price: Number(opt.price) || Number(svc.basePrice) || 0
            }))
          : [
              {
                img: pickImageForService(svc.title, svc.imageUrl),
                name: svc.title,
                desc: buildLongDesc(svc.title, svc.shortDescription),
                price: Number(svc.basePrice) || 0
              }
            ];

      return {
        id: slugify(svc.title),
        img: pickImageForService(svc.title, svc.imageUrl),
        title: svc.title,
        items
      };
    });
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
    const load = async () => {
      try {
        const [categories, options] = await Promise.all([
          api.getCategories(),
          api.getServiceOptions()
        ]);
        const category = resolveCategory(categories);
        if (!category) return;
        const services = await api.getServices({
          categoryId: category.id,
          cityId: cityId || undefined
        });
        if (!mounted) return;

        const newSections = buildSectionsFromApi(services, options);
        setSections(newSections);
        setMenu(
          newSections.map((s) => ({
            id: s.id,
            img: s.img,
            label: s.title
          }))
        );
      } catch (e) {
        if (!mounted) return;
        setSections([]);
      }
    };
    if (leftPageData) load();
    return () => {
      mounted = false;
    };
  }, [serviceKey, cityId]);

  useEffect(() => {
    if (!location.hash) return;
    const id = decodeURIComponent(location.hash.replace("#", ""));
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash, serviceKey, sections.length]);

  if (!leftPageData) return <h2>Not Found</h2>;

  const finalSections = sections.length ? sections : [];
  const finalMenu = menu.length ? menu : [];

  return (
    <>
      <Navbar />
      <ServiceLayout menu={finalMenu} sections={finalSections} />
    </>
  );
}
