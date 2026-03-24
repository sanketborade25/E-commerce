import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [banners, setBanners] = useState([]);
  const [cityPage, setCityPage] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedBannerSection, setSelectedBannerSection] = useState("");
  const [popupCategories, setPopupCategories] = useState([]);

  const [cityInput, setCityInput] = useState("");
  const [cityError, setCityError] = useState("");
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
  const [bannerInput, setBannerInput] = useState({
    title: "",
    imageUrl: "",
    linkUrl: "",
    displayOrder: ""
  });
  const [uploading, setUploading] = useState({
    category: false,
    service: false,
    serviceBanner: false,
    option: false,
    banner: false,
    popupCategory: false
  });
  const [uploadError, setUploadError] = useState({
    category: "",
    service: "",
    serviceBanner: "",
    option: "",
    banner: "",
    popupCategory: ""
  });
  const [fileInputKey, setFileInputKey] = useState({
    category: 0,
    service: 0,
    serviceBanner: 0,
    option: 0,
    banner: 0,
    popupCategory: 0
  });
  const adminChannel = useMemo(() => {
    if (typeof BroadcastChannel === "undefined") return null;
    return new BroadcastChannel("admin-data");
  }, []);

  const loadAll = async () => {
    const [citiesRes, categoriesRes, optionsRes, servicesRes, subCatsRes, bannersRes] =
      await Promise.allSettled([
        api.getCities(),
        api.getCategories(),
        api.getServiceOptions(),
        api.getAdminServices(),
        api.getSubCategories(),
        api.getBanners({ all: true })
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
    if (bannersRes.status === "fulfilled") {
      setBanners(bannersRes.value || []);
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
      if (target === "banner") {
        setBannerInput((prev) => ({ ...prev, imageUrl: url }));
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

  const handleAddBanner = async () => {
    if (!selectedBannerSection) {
      alert("Please select a section.");
      return;
    }
    if (!bannerInput.imageUrl) {
      alert("Please upload a banner image.");
      return;
    }

    await api.createBanner({
      section: selectedBannerSection,
      title: bannerInput.title.trim() || null,
      imageUrl: bannerInput.imageUrl,
      linkUrl: bannerInput.linkUrl.trim() || null,
      displayOrder: Number(bannerInput.displayOrder) || 0,
      isActive: true
    });

    setBannerInput({ title: "", imageUrl: "", linkUrl: "", displayOrder: "" });
    setFileInputKey((prev) => ({ ...prev, banner: prev.banner + 1 }));
    await loadAll();
    notifyDataChanged();
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
    await api.deleteCity(id);
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

  const handleDeleteBanner = async (id) => {
    await api.deleteBanner(id);
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
  const filteredBanners = selectedBannerSection
    ? banners.filter((b) => b.section === selectedBannerSection)
    : banners;

  const citiesPerPage = 20;
  const totalCityPages = Math.max(1, Math.ceil(cities.length / citiesPerPage));
  const pagedCities = cities.slice(
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
    if (!selectedServiceId) return;
    const exists = services.some(
      (s) => String(s.id) === String(selectedServiceId)
    );
    if (!exists) {
      setSelectedServiceId("");
    }
  }, [selectedServiceId, services]);

  return (
    <>
      <div className="admin-page">
        <div className="admin-topbar">
          <Link to="/home" className="admin-logo">
            <img src="/images/1Homepage/logo (1).png" alt="Urban Company" />
          </Link>

          <nav className="admin-top-nav">
            <a href="#admin-categories" className="admin-btn outline">Categories</a>
            <a href="#admin-popup-categories" className="admin-btn outline">Sub Categories</a>
            <a href="#admin-services" className="admin-btn outline">Services</a>
            <a href="#admin-options" className="admin-btn outline">Service Options</a>
            <a href="#admin-cities" className="admin-btn outline">Cities</a>
            <a href="#admin-banners" className="admin-btn outline">Banner Images</a>
          </nav>
          <div>
            <h2>Admin Dashboard</h2>
            </div>
          <div className="admin-top-actions">
            <button className="admin-btn outline" onClick={handleLogout}>
              Logout
            </button>
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
              <input
                key={`category-file-${fileInputKey.category}`}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleImageUpload(e.target.files?.[0], "category")
                }
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
                    className="admin-btn outline"
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
              <input
                key={`popup-category-file-${fileInputKey.popupCategory}`}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleImageUpload(e.target.files?.[0], "popupCategory")
                }
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
              <label style={{ marginRight: 8 }}>
                City for status actions:
                <select
                  value={toggleCityId}
                  onChange={(e) => setToggleCityId(e.target.value)}
                  style={{ marginLeft: 8 }}
                >
                  <option value="">Any city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="admin-input-row admin-input-row-small">
                      <div className="admin-muted">
                        {categories.find(
                          (cat) => String(cat.id) === String(item.parentCategoryId)
                        )?.name || "Unknown category"}
                      </div>
                    </div>
                    <div className="admin-actions">
                      <button
                        className="admin-btn outline"
                        onClick={() => handleEditPopupCategory(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="admin-btn outline"
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
            <p className="admin-muted">Choose service option</p>
            <div className="admin-input-row admin-input-row-small">
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
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
              >
                <option value="">Filter by service (optional)</option>
                {services.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-input-row admin-input-row-small">
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
                key={`service-file-${fileInputKey.service}`}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleImageUpload(e.target.files?.[0], "service")
                }
              />
        {/* banner image */}
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
              <input
                key={`service-banner-file-${fileInputKey.serviceBanner}`}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleImageUpload(e.target.files?.[0], "serviceBanner")
                }
              />
              <button className="admin-btn admin-btn-add" onClick={handleAddService}>
                Add
              </button>
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
                        className="admin-btn outline"
                        onClick={() => handleToggleService(service)}
                      >
                        {service.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        className="admin-btn outline"
                        onClick={() => handleToggleServiceForCity(service)}
                      >
                        {cityStatus?.isEnabled ? "City Disable" : "City Enable"}
                      </button>
                      <button
                        className="admin-btn outline"
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
              <input
                key={`option-file-${fileInputKey.option}`}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleImageUpload(e.target.files?.[0], "option")
                }
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
                      className="admin-btn outline"
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
            {cityError && <p className="admin-error">{cityError}</p>}
             <hr/>
            <div className="admin-list admin-list-grid">
              {pagedCities.map((city) => (
                <div key={city.id} className="admin-list-item">
                  <div>{city.name}</div>
                  <button
                    className="admin-btn outline"
                    onClick={() => handleDeleteCity(city.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
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

          <div className="admin-card admin-wide" id="admin-banners">
            <h3>Banner Images</h3>
            <div className="admin-input-row admin-input-row-small">
              <select
                value={selectedBannerSection}
                onChange={(e) => setSelectedBannerSection(e.target.value)}
              >
                <option value="">Select section</option>
                <option value="offers">Offers & discounts</option>
                <option value="new_noteworthy">New and noteworthy</option>
                <option value="most_booked">Most booked services</option>
              </select>
              <input
                type="text"
                placeholder="Banner title"
                value={bannerInput.title}
                onChange={(e) =>
                  setBannerInput((prev) => ({ ...prev, title: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Banner link URL (optional)"
                value={bannerInput.linkUrl}
                onChange={(e) =>
                  setBannerInput((prev) => ({ ...prev, linkUrl: e.target.value }))
                }
              />
                <input
                  key={`banner-file-${fileInputKey.banner}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageUpload(e.target.files?.[0], "banner")
                  }
                />
              <input
                type="number"
                placeholder="Order (0,1,2..)"
                value={bannerInput.displayOrder}
                onChange={(e) =>
                  setBannerInput((prev) => ({
                    ...prev,
                    displayOrder: e.target.value
                  }))
                }
              />
              <button className="admin-btn admin-btn-add" onClick={handleAddBanner}>
                Add
              </button>
            </div>
             <hr/>
            {uploading.banner && (
              <p className="admin-muted">Uploading banner image...</p>
            )}
            {uploadError.banner && (
              <p className="admin-error">{uploadError.banner}</p>
            )}
            <div className="admin-list admin-list-grid">
              {filteredBanners.length === 0 ? (
                <p className="admin-muted">No banners added yet.</p>
              ) : (
                filteredBanners.map((item) => (
                  <div key={item.id} className="admin-list-item">
                    <div>
                      <strong>{item.title || "Untitled banner"}</strong>
                      <div className="admin-muted">{item.section}</div>
                      <div className="admin-muted">
                        {item.imageUrl}
                      </div>
                    </div>
                    <button
                      className="admin-btn outline"
                      onClick={() => handleDeleteBanner(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
