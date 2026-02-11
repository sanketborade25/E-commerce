import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import ServiceLayout from "../components/ServiceLayout";
import Navbar from "../components/Navbar";
import { api } from "../api/client";

export default function ServicePage() {
  const { serviceKey } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const subCategoryId = searchParams.get("subCategoryId");

  const [menu, setMenu] = useState([]);
  const [sections, setSections] = useState([]);
  const [pageTitle, setPageTitle] = useState("");
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

  const buildLongDesc = (label) => {
    const base = `Includes ${label.toLowerCase()} service.`;
    return (
      `${base} ` +
      "Detailed inspection and preparation included. " +
      "Standard tools and materials used where applicable. " +
      "Clean finish with after-service guidance."
    );
  };

  const resolveCategory = (categories) => {
    if (!categories?.length) return null;
    return (
      categories.find(
        (c) => c.slug && slugify(c.slug) === slugify(serviceKey)
      ) ||
      categories.find((c) => slugify(c.name) === slugify(serviceKey)) ||
      null
    );
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
              serviceId: svc.id,
              serviceOptionId: opt.id,
              img: pickImageForService(svc.title, opt.imageUrl || svc.imageUrl),
              name: opt.name || svc.title,
              desc: buildLongDesc(opt.name || svc.title),
              price: Number(opt.price) || 0
            }))
          : [
              {
                serviceId: svc.id,
                serviceOptionId: null,
                img: pickImageForService(svc.title, svc.imageUrl),
                name: svc.title,
                desc: buildLongDesc(svc.title),
                price: 0
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
        if (!category) {
          setSections([]);
          setMenu([]);
          setPageTitle("");
          return;
        }
        setPageTitle(category.name || "");
        let services = await api.getServices({
          categoryId: category.id,
          subCategoryId: subCategoryId || undefined,
          cityId: cityId || undefined
        });
        if (!services?.length && cityId) {
          services = await api.getServices({
            categoryId: category.id,
            subCategoryId: subCategoryId || undefined
          });
        }
        if (!services?.length && subCategoryId) {
          services = await api.getServices({
            categoryId: category.id,
            cityId: cityId || undefined
          });
        }
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
    const handleAdminChange = () => {
      load();
    };
    const handleStorage = (e) => {
      if (e.key === "admin_data_version") load();
    };
    const handleFocus = () => {
      load();
    };
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
      channel?.removeEventListener("message", handleChannel);
      channel?.close();
      window.clearInterval(poll);
    };
  }, [serviceKey, cityId, subCategoryId]);

  useEffect(() => {
    if (!location.hash) return;
    const id = decodeURIComponent(location.hash.replace("#", ""));
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash, serviceKey, sections.length]);

  if (!pageTitle) return <h2>Not Found</h2>;

  const finalSections = sections.length ? sections : [];
  const finalMenu = menu.length ? menu : [];

  return (
    <>
      <Navbar />
      <ServiceLayout menu={finalMenu} sections={finalSections} />
    </>
  );
}
