import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { MiniIcon } from "../components/ProfessionalShell";
import AppLogo from "../components/AppLogo";
import "../styles/pages/admin.css";

function AdminFileInput({ inputKey, label, onChange }) {
  return (
    <label className="admin-file-input">
      <input
        key={inputKey}
        type="file"
        accept="image/*"
        onChange={(e) => onChange(e.target.files?.[0])}
      />
      <span className="admin-file-input-icon">
        <MiniIcon name="image" />
      </span>
      <span className="admin-file-input-text">{label}</span>
    </label>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeAdminSection, setActiveAdminSection] = useState("admin-categories");
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [cityPage, setCityPage] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [popupCategories, setPopupCategories] = useState([]);

  const [cityInput, setCityInput] = useState("");
  const [cityError, setCityError] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [editingCityId, setEditingCityId] = useState("");
  const [editingCityName, setEditingCityName] = useState("");
  const [categoryInput, setCategoryInput] = useState({
    name: "",
    imageUrl: ""
  });
  const [serviceInput, setServiceInput] = useState({
    title: "",
    imageUrl: "",
    bannerImageUrl: ""
  });
  const [serviceCityId, setServiceCityId] = useState("");
  const [serviceSubCategoryId, setServiceSubCategoryId] = useState("");
  const [toggleCityId, setToggleCityId] = useState("");
  const [popupCategoryInput, setPopupCategoryInput] = useState({
    categoryId: "",
    title: "",
    imageUrl: ""
  });
  const [editingPopupCategoryId, setEditingPopupCategoryId] = useState("");
  const [optionInput, setOptionInput] = useState({
    name: "",
    imageUrl: "",
    price: ""
  });
  const [uploading, setUploading] = useState({
    category: false,
    service: false,
    serviceBanner: false,
    option: false,
    popupCategory: false
  });
  const [uploadError, setUploadError] = useState({
    category: "",
    service: "",
    serviceBanner: "",
    option: "",
    popupCategory: ""
  });
  const [fileInputKey, setFileInputKey] = useState({
    category: 0,
    service: 0,
    serviceBanner: 0,
    option: 0,
    popupCategory: 0
  });
  const adminChannel = useMemo(() => {
    if (typeof BroadcastChannel === "undefined") return null;
    return new BroadcastChannel("admin-data");
  }, []);

  const loadAll = async () => {
    const [citiesRes, categoriesRes, optionsRes, servicesRes, subCatsRes] =
      await Promise.allSettled([
        api.getCities({ includeInactive: true }),
        api.getCategories(),
        api.getServiceOptions(),
        api.getAdminServices(),
        api.getSubCategories()
      ]);

    if (citiesRes.status === "fulfilled") {
      const orderedCities = [...(citiesRes.value || [])].sort(
        (a, b) => Number(a.id) - Number(b.id)
      );
      setCities(orderedCities);
    }
    if (categoriesRes.status === "fulfilled") {
      const onlyParents = (categoriesRes.value || []).filter(
        (c) => c.parentCategoryId == null
      );
      setCategories(onlyParents);
    }
    if (servicesRes.status === "fulfilled") {
      setServices(servicesRes.value || []);
    }
    if (optionsRes.status === "fulfilled") {
      setServiceOptions(optionsRes.value || []);
    }
    if (subCatsRes.status === "fulfilled") {
      setPopupCategories(subCatsRes.value || []);
    }
  };

  const notifyDataChanged = () => {
    localStorage.setItem("admin_data_version", String(Date.now()));
    window.dispatchEvent(new Event("admin-data-changed"));
    adminChannel?.postMessage({ type: "refresh", ts: Date.now() });
  };

  useEffect(() => {
    loadAll();
    return () => {
      adminChannel?.close();
    };
  }, []);

  const handleToggleService = async (svc) => {
    try {
      if (svc.isActive) {
        await api.disableService(svc.id);
      } else {
        const cityIdUsed = Number(toggleCityId || svc.cityId || cities[0]?.id);
        if (!cityIdUsed) {
          alert("Select a city to enable service.");
          return;
        }
        await api.enableService(svc.id, cityIdUsed);
      }
      await loadAll();
      notifyDataChanged();
    } catch (error) {
      console.error(error);
      alert("Unable to toggle service: " + error?.message);
    }
  };

  const handleToggleServiceForCity = async (svc) => {
    if (!toggleCityId) {
      alert("Choose a city to apply city-specific enable/disable.");
      return;
    }

    const cityIdUsed = Number(toggleCityId);
    const status = svc.cityStatuses?.find((s) => Number(s.cityId) === cityIdUsed);

    try {
      if (status && status.isEnabled) {
        await api.disableService(svc.id, cityIdUsed);
      } else {
        await api.enableService(svc.id, cityIdUsed);
      }
      await loadAll();
      notifyDataChanged();
    } catch (error) {
      console.error(error);
      alert("Unable to toggle city status: " + error?.message);
    }
  };

  const handleAddCategory = async () => {
    const name = categoryInput.name.trim();
    if (!name) return;
    await api.createCategory({ name, imageUrl: categoryInput.imageUrl || null });
    setCategoryInput({ name: "", imageUrl: "" });
    setFileInputKey((prev) => ({ ...prev, category: prev.category + 1 }));
    await loadAll();
    notifyDataChanged();
  };

  const handleAddService = async () => {
    if (!selectedCategoryId) return;
    if (!serviceSubCategoryId) {
      alert("Please select a sub category.");
      return;
    }
    const title = serviceInput.title.trim();
    if (!title) return;
    await api.createService({
      categoryId: Number(selectedCategoryId),
      subCategoryId: Number(serviceSubCategoryId),
      title,
      cityId: serviceCityId ? Number(serviceCityId) : null,
      imageUrl: serviceInput.imageUrl || null,
      bannerImageUrl: serviceInput.bannerImageUrl || null,
      isActive: true
    });
    setServiceInput({
      title: "",
      imageUrl: "",
      bannerImageUrl: ""
    });
    setFileInputKey((prev) => ({ ...prev, service: prev.service + 1, serviceBanner: prev.serviceBanner + 1 }));
    setServiceSubCategoryId("");
    setServiceCityId("");
    await loadAll();
    notifyDataChanged();
  };

  const handleAddOption = async () => {
    const optionName = optionInput.name.trim();
    if (!selectedServiceId) {
      alert("Please select a service first.");
      return;
    }
    if (!optionName) return;
    await api.createServiceOption({
      serviceId: Number(selectedServiceId),
      name: optionName,
      imageUrl: optionInput.imageUrl || null,
      price: Number(optionInput.price) || 0,
      durationMinutes: null
    });
    setOptionInput({ name: "", imageUrl: "", price: "" });
    setFileInputKey((prev) => ({ ...prev, option: prev.option + 1 }));
    await loadAll();
    notifyDataChanged();
  };

  const handleAddPopupCategory = async () => {
    if (!popupCategoryInput.categoryId) return;
    const title = popupCategoryInput.title.trim();
    if (!title) return;
    const isEditing = Boolean(editingPopupCategoryId);
    if (isEditing) {
      await api.updateSubCategory(editingPopupCategoryId, {
        name: title,
        imageUrl: popupCategoryInput.imageUrl || null,
        parentCategoryId: Number(popupCategoryInput.categoryId)
      });
    } else {
      await api.createSubCategory({
        name: title,
        imageUrl: popupCategoryInput.imageUrl || null,
        parentCategoryId: Number(popupCategoryInput.categoryId)
      });
    }
    setPopupCategoryInput({ categoryId: "", title: "", imageUrl: "" });
    setEditingPopupCategoryId("");
    setFileInputKey((prev) => ({
      ...prev,
      popupCategory: prev.popupCategory + 1
    }));
    await loadAll();
    notifyDataChanged();
  };

  const handleEditPopupCategory = (item) => {
    setPopupCategoryInput({
      categoryId: String(item.parentCategoryId || ""),
      title: item.name || "",
      imageUrl: item.imageUrl || ""
    });
    setEditingPopupCategoryId(String(item.id));
  };

  const handleDeletePopupCategory = async (id) => {
    await api.deleteSubCategory(id);
    if (String(editingPopupCategoryId) === String(id)) {
      setEditingPopupCategoryId("");
      setPopupCategoryInput({ categoryId: "", title: "", imageUrl: "" });
      setFileInputKey((prev) => ({
        ...prev,
        popupCategory: prev.popupCategory + 1
      }));
    }
    await loadAll();
    notifyDataChanged();
  };

  const handleImageUpload = async (file, target) => {
    if (!file) return;
    setUploading((prev) => ({ ...prev, [target]: true }));
    setUploadError((prev) => ({ ...prev, [target]: "" }));
    try {
      const res = await api.uploadImage(file);
      const url = res?.url;
      if (!url) throw new Error("Upload failed.");
      if (target === "category") {
        setCategoryInput((prev) => ({ ...prev, imageUrl: url }));
      }
      if (target === "service") {
        setServiceInput((prev) => ({ ...prev, imageUrl: url }));
      }
      if (target === "serviceBanner") {
        setServiceInput((prev) => ({ ...prev, bannerImageUrl: url }));
      }
      if (target === "option") {
        setOptionInput((prev) => ({ ...prev, imageUrl: url }));
      }
      if (target === "popupCategory") {
        setPopupCategoryInput((prev) => ({ ...prev, imageUrl: url }));
      }
    } catch (e) {
      setUploadError((prev) => ({
        ...prev,
        [target]: e?.message || "Upload failed."
      }));
    } finally {
      setUploading((prev) => ({ ...prev, [target]: false }));
    }
  };

  const handleDeleteService = async (id) => {
    await api.deleteService(id);
    await loadAll();
    notifyDataChanged();
  };

  const handleDeleteOption = async (id) => {
    await api.deleteServiceOption(id);
    await loadAll();
    notifyDataChanged();
  };

  const handleAddCity = async () => {
    const name = cityInput.trim();
    if (!name) return;
    const normalized = name.toLowerCase();
    const exists = cities.some((city) => String(city.name || "").toLowerCase() === normalized);
    if (exists) {
      setCityError("City already exists.");
      return;
    }
    setCityError("");
    try {
      await api.createCity({ name });
      setCityInput("");
      await loadAll();
      notifyDataChanged();
    } catch (e) {
      setCityError(e?.message || "Unable to add city.");
    }
  };

  const handleDeleteCity = async (id) => {
    const city = cities.find((item) => String(item.id) === String(id));
    const ok = window.confirm(
      `Delete ${city?.name || "this city"}? This will soft-delete related services and categories.`
    );
    if (!ok) return;
    await api.deleteCity(id);
    await loadAll();
    notifyDataChanged();
  };

  const handleToggleCityStatus = async (city) => {
    await api.updateCityStatus(city.id, !city.isActive);
    await loadAll();
    notifyDataChanged();
  };

  const handleEditCity = (city) => {
    setEditingCityId(String(city.id));
    setEditingCityName(city.name || "");
  };

  const handleCancelCityEdit = () => {
    setEditingCityId("");
    setEditingCityName("");
  };

  const handleSaveCityEdit = async (city) => {
    const name = editingCityName.trim();
    if (!name) {
      setCityError("City name is required.");
      return;
    }
    const normalized = name.toLowerCase();
    const exists = cities.some(
      (item) => String(item.id) !== String(city.id) && String(item.name || "").toLowerCase() === normalized
    );
    if (exists) {
      setCityError("City already exists.");
      return;
    }
    await api.updateCity(city.id, { name });
    setEditingCityId("");
    setEditingCityName("");
    await loadAll();
    notifyDataChanged();
  };

  const handleDeleteCategory = async (id) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
    if (String(selectedCategoryId) === String(id)) {
      setSelectedCategoryId("");
    }
    await api.deleteCategory(id);
    await loadAll();
    notifyDataChanged();
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_authed");
    api.clearToken();
    navigate("/admin");
  };

  const enabledCount = useMemo(
    () => services.filter((s) => s.isActive).length,
    [services]
  );

  const filteredServices = services.filter((s) => {
    if (selectedCategoryId && String(s.categoryId) !== String(selectedCategoryId))
      return false;
    if (selectedServiceId && String(s.id) !== String(selectedServiceId))
      return false;
    return true;
  });

  const filteredOptions = selectedServiceId
    ? serviceOptions.filter(
        (o) => String(o.serviceId) === String(selectedServiceId)
      )
    : serviceOptions;
  const adminHighlights = [
    { label: "Categories", value: categories.length },
    { label: "Subcategories", value: popupCategories.length },
    { label: "Services", value: services.length },
    { label: "Active Services", value: enabledCount },
    { label: "Cities", value: cities.length }
  ];
  const adminNavItems = [
    { id: "admin-categories", label: "Categories", icon: "folder" },
    { id: "admin-popup-categories", label: "Subcategories", icon: "list" },
    { id: "admin-services", label: "Services", icon: "tools" },
    { id: "admin-options", label: "Service Options", icon: "settings" },
    { id: "admin-cities", label: "Cities", icon: "location" }
  ];

  const citiesPerPage = 20;
  const filteredCities = cities.filter((city) =>
    String(city.name || "").toLowerCase().includes(citySearch.trim().toLowerCase())
  );
  const totalCityPages = Math.max(1, Math.ceil(filteredCities.length / citiesPerPage));
  const pagedCities = filteredCities.slice(
    (cityPage - 1) * citiesPerPage,
    cityPage * citiesPerPage
  );
  const cityPageNumbers = Array.from(
    { length: totalCityPages },
    (_, i) => i + 1
  );

  useEffect(() => {
    if (cityPage > totalCityPages) {
      setCityPage(totalCityPages);
    }
  }, [cityPage, totalCityPages]);

  useEffect(() => {
    setCityPage(1);
  }, [citySearch]);

  useEffect(() => {
    if (!selectedServiceId) return;
    const exists = services.some(
      (s) => String(s.id) === String(selectedServiceId)
    );
    if (!exists) {
      setSelectedServiceId("");
    }
  }, [selectedServiceId, services]);

  useEffect(() => {
    const sectionIds = adminNavItems.map((item) => item.id);
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (sections.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target?.id) {
          setActiveAdminSection(visible[0].target.id);
        }
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0.2, 0.45, 0.7]
      }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="admin-page">
        <div className="admin-topbar">
          <div className="admin-brand">
            <Link to="/home" className="admin-logo">
              <AppLogo />
            </Link>
            <div>
              <p className="admin-console-kicker">Operations workspace</p>
              <h2>Admin Console</h2>
            </div>
          </div>

          <nav className="admin-top-nav">
            {adminNavItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`admin-top-nav-link${activeAdminSection === item.id ? " active" : ""}`}
                onClick={() => setActiveAdminSection(item.id)}
              >
                <MiniIcon name={item.icon} />
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
          <div className="admin-top-actions">
            <button className="admin-btn outline admin-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="admin-hero">
          <div>
            <p className="admin-console-kicker">Platform controls</p>
            <h3>Dashboard</h3>
            <p className="admin-hero-subtitle">
              Manage categories, services, cities, and platform data efficiently.
            </p>
          </div>
          <div className="admin-summary-grid">
            {adminHighlights.map((item) => (
              <div key={item.label} className="admin-summary-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-grid">
          <div className="admin-card" id="admin-categories">
            <h3>Categories</h3>
            <div className="admin-input-row admin-input-row-small">
              <input
                type="text"
                placeholder="Add category"
                value={categoryInput.name}
                onChange={(e) =>
                  setCategoryInput((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Image URL (optional)"
                value={categoryInput.imageUrl}
                onChange={(e) =>
                  setCategoryInput((prev) => ({
                    ...prev,
                    imageUrl: e.target.value
                  }))
                }
              />
              <AdminFileInput
                inputKey={`category-file-${fileInputKey.category}`}
                label="Upload image"
                onChange={(file) => handleImageUpload(file, "category")}
              />
              <button className="admin-btn admin-btn-add" onClick={handleAddCategory}>
                Add
              </button>
            </div>
            <hr/>
            {uploading.category && (
              <p className="admin-muted">Uploading category image...</p>
            )}
            {uploadError.category && (
              <p className="admin-error">{uploadError.category}</p>
            )}
            <div className="admin-list admin-list-grid">
              {categories.map((cat) => (
                <div key={cat.id} className="admin-list-item">
                  <div>{cat.name}</div>
                  <button
                    className="admin-btn outline admin-btn-danger"
                    onClick={() => handleDeleteCategory(cat.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card" id="admin-popup-categories">
            <h3>Sub Categories</h3>
            <div className="admin-input-row admin-input-row-small">
              <select
                value={popupCategoryInput.categoryId}
                onChange={(e) =>
                  setPopupCategoryInput((prev) => ({
                    ...prev,
                    categoryId: e.target.value
                  }))
                }
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Sub-category title"
                value={popupCategoryInput.title}
                onChange={(e) =>
                  setPopupCategoryInput((prev) => ({
                    ...prev,
                    title: e.target.value
                  }))
                }
              />
              <AdminFileInput
                inputKey={`popup-category-file-${fileInputKey.popupCategory}`}
                label="Upload image"
                onChange={(file) => handleImageUpload(file, "popupCategory")}
              />
              <input
                type="text"
                placeholder="Image URL (optional)"
                value={popupCategoryInput.imageUrl}
                onChange={(e) =>
                  setPopupCategoryInput((prev) => ({
                    ...prev,
                    imageUrl: e.target.value
                  }))
                }
              />
              <button
                className="admin-btn admin-btn-add"
                onClick={handleAddPopupCategory}
              >
                {editingPopupCategoryId ? "Update" : "Add"}
              </button>
            </div>
            <hr/>
            {uploading.popupCategory && (
              <p className="admin-muted">Uploading image...</p>
            )}
            {uploadError.popupCategory && (
              <p className="admin-error">{uploadError.popupCategory}</p> 
            )}
            <div className="admin-list admin-list-grid">
              {popupCategories.length === 0 ? (
                <p className="admin-muted">No sub-categories yet.</p>
              ) : (
                popupCategories.map((item) => (
                  <div key={item.id} className="admin-list-item">
                    <div>
                      <strong>{item.name}</strong>
                      <div className="admin-muted">
                        {categories.find(
                          (cat) => String(cat.id) === String(item.parentCategoryId)
                        )?.name || "Unknown category"}
                      </div>
                    </div>
                    <div className="admin-actions">
                      <button
                        className="admin-btn outline admin-btn-secondary"
                        onClick={() => handleEditPopupCategory(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="admin-btn outline admin-btn-danger"
                        onClick={() => handleDeletePopupCategory(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="admin-card" id="admin-services">
            <h3>Services ({enabledCount} active)</h3>
            <p className="admin-muted">Create services with flexible, well-grouped fields.</p>
            <div className="admin-service-form">
              <div className="admin-input-row">
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setServiceSubCategoryId("");
                }}
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={serviceSubCategoryId}
                onChange={(e) => setServiceSubCategoryId(e.target.value)}
              >
                <option value="">Select sub category</option>
                {popupCategories
                  .filter(
                    (sc) =>
                      String(sc.parentCategoryId) ===
                      String(selectedCategoryId)
                  )
                  .map((sc) => (
                    <option key={sc.id} value={String(sc.id)}>
                    {sc.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-input-row">
              <input
                type="text"
                placeholder="Service title"
                value={serviceInput.title}
                onChange={(e) =>
                  setServiceInput((prev) => ({ ...prev, title: e.target.value }))
                }
              />
              <select
                value={serviceCityId}
                onChange={(e) => setServiceCityId(e.target.value)}
              >
                <option value="">Select city</option>
                {cities.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-input-row">
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
              >
                <option value="">Filter by service</option>
                {services.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.title}
                  </option>
                ))}
              </select>
              <select
                value={toggleCityId}
                onChange={(e) => setToggleCityId(e.target.value)}
              >
                <option value="">City for status actions</option>
                {cities.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-input-row">
              <input
                type="text"
                placeholder="Service Image URL (optional)"
                value={serviceInput.imageUrl}
                onChange={(e) =>
                  setServiceInput((prev) => ({
                    ...prev,
                    imageUrl: e.target.value
                  }))
                }
              />
              <input
                type="text"
                placeholder="Banner Image URL (optional)"
                value={serviceInput.bannerImageUrl}
                onChange={(e) =>
                  setServiceInput((prev) => ({
                    ...prev,
                    bannerImageUrl: e.target.value
                  }))
                }
              />
            </div>
            <div className="admin-input-row">
              <AdminFileInput
                inputKey={`service-file-${fileInputKey.service}`}
                label="Upload service image"
                onChange={(file) => handleImageUpload(file, "service")}
              />
              <AdminFileInput
                inputKey={`service-banner-file-${fileInputKey.serviceBanner}`}
                label="Upload banner image"
                onChange={(file) => handleImageUpload(file, "serviceBanner")}
              />
            </div>
            <div className="admin-input-row admin-input-row-actions">
              <button className="admin-btn admin-btn-add" onClick={handleAddService}>
                Add
              </button>
            </div>
            </div>
             <hr/>
            {uploading.service && (
              <p className="admin-muted">Uploading service image...</p>
            )}
            {uploadError.service && (
              <p className="admin-error">{uploadError.service}</p>
            )}
            {uploading.serviceBanner && (
              <p className="admin-muted">Uploading banner image...</p>
            )}
            {uploadError.serviceBanner && (
              <p className="admin-error">{uploadError.serviceBanner}</p>
            )}
            <div className="admin-list admin-list-grid">
              {filteredServices.map((service) => {
                const cityStatus = toggleCityId
                  ? service.cityStatuses?.find((cs) => String(cs.cityId) === toggleCityId)
                  : null;
                const cityStatusLabel = cityStatus
                  ? cityStatus.isEnabled
                    ? "Enabled in city"
                    : "Disabled in city"
                  : toggleCityId
                  ? "Not mapped"
                  : "No specific city selected";
                return (
                  <div key={service.id} className="admin-list-item">
                    <div>
                      <strong>{service.title}</strong>
                      <span className="admin-pill">
                        {service.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="admin-pill" style={{ marginLeft: 8 }}>
                        {cityStatusLabel}
                      </span>
                    </div>
                    <div className="admin-actions">
                      <button
                        className="admin-btn outline admin-btn-secondary"
                        onClick={() => handleToggleService(service)}
                      >
                        {service.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        className="admin-btn outline admin-btn-secondary"
                        onClick={() => handleToggleServiceForCity(service)}
                      >
                        {cityStatus?.isEnabled ? "City Disable" : "City Enable"}
                      </button>
                      <button
                        className="admin-btn outline admin-btn-danger"
                        onClick={() => handleDeleteService(service.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

 <div className="admin-card" id="admin-options">
            <h3>Service Options</h3>
            <div className="admin-input-row admin-input-row-small">
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
              >
                <option value="">Select a service</option>
                {services.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.title}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Service option name"
                value={optionInput.name}
                onChange={(e) =>
                  setOptionInput((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <AdminFileInput
                inputKey={`option-file-${fileInputKey.option}`}
                label="Upload image"
                onChange={(file) => handleImageUpload(file, "option")}
              />
              <input
                type="text"
                placeholder="Option image URL (optional)"
                value={optionInput.imageUrl}
                onChange={(e) =>
                  setOptionInput((prev) => ({ ...prev, imageUrl: e.target.value }))
                }
              />
              <input
                type="number"
                placeholder="Price"
                value={optionInput.price}
                onChange={(e) =>
                  setOptionInput((prev) => ({ ...prev, price: e.target.value }))
                }
              />
              <button className="admin-btn admin-btn-add" onClick={handleAddOption}>
                Add
              </button>
            </div>
             <hr/>
            {uploading.option && (
              <p className="admin-muted">Uploading option image...</p>
            )}
            {uploadError.option && (
              <p className="admin-error">{uploadError.option}</p>
            )}
            <div className="admin-list admin-list-grid">
              {filteredOptions.length === 0 ? (
              <p className="admin-muted">No options for this service.</p>
            ) : (
              filteredOptions.map((opt) => (
                <div key={opt.id} className="admin-list-item">
                  <div>
                    <strong>{opt.name || "Option"}</strong>
                  </div>
                    <button
                      className="admin-btn outline admin-btn-danger"
                      onClick={() => handleDeleteOption(opt.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="admin-card" id="admin-cities">
            <h3>Cities</h3>
            <div className="admin-input-row admin-input-row-small">
              <input
                type="text"
                placeholder="Add new city"
                value={cityInput}
                onChange={(e) => {
                  setCityInput(e.target.value);
                  if (cityError) setCityError("");
                }}
              />
              <button className="admin-btn admin-btn-add" onClick={handleAddCity}>
                Add
              </button>
            </div>
            <div className="admin-input-row admin-input-row-small">
              <input
                type="text"
                placeholder="Search cities"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
              />
              <div className="admin-form-spacer" />
            </div>
            {cityError && <p className="admin-error">{cityError}</p>}
             <hr/>
            <div className="admin-list admin-list-grid">
              {pagedCities.length === 0 ? (
                <p className="admin-muted">No cities found.</p>
              ) : (
                pagedCities.map((city) => (
                  <div key={city.id} className="admin-list-item">
                    <div>
                      {String(editingCityId) === String(city.id) ? (
                        <input
                          type="text"
                          className="admin-inline-input"
                          value={editingCityName}
                          onChange={(e) => setEditingCityName(e.target.value)}
                        />
                      ) : (
                        <strong>{city.name}</strong>
                      )}
                      <div className="admin-pill-row">
                        <span className={`admin-pill ${city.isActive ? "is-active" : "is-inactive"}`}>
                          {city.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <div className="admin-actions">
                      {String(editingCityId) === String(city.id) ? (
                        <>
                          <button className="admin-btn outline admin-btn-secondary" onClick={() => handleSaveCityEdit(city)}>
                            Save
                          </button>
                          <button className="admin-btn outline" onClick={handleCancelCityEdit}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="admin-btn outline admin-btn-secondary" onClick={() => handleEditCity(city)}>
                            Edit
                          </button>
                          <button className="admin-btn outline" onClick={() => handleToggleCityStatus(city)}>
                            {city.isActive ? "Disable" : "Enable"}
                          </button>
                          <button
                            className="admin-btn outline admin-btn-danger"
                            onClick={() => handleDeleteCity(city.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="admin-pagination">
              <button
                className="admin-btn outline"
                onClick={() => setCityPage((p) => Math.max(1, p - 1))}
                disabled={cityPage === 1}
              >
                Prev
              </button>
              <div className="admin-page-numbers">
                {cityPageNumbers.map((p) => (
                  <button
                    key={p}
                    className={`admin-page-btn ${cityPage === p ? "active" : ""}`}
                    onClick={() => setCityPage(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <span className="admin-muted">
                Page {cityPage} of {totalCityPages}
              </span>
              <button
                className="admin-btn outline"
                onClick={() => setCityPage((p) => Math.min(totalCityPages, p + 1))}
                disabled={cityPage === totalCityPages}
              >
                Next
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
