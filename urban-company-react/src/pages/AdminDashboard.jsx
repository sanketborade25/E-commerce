import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { api } from "../api/client";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");

  const [cityInput, setCityInput] = useState("");
  const [categoryInput, setCategoryInput] = useState({
    name: "",
    imageUrl: ""
  });
  const [serviceInput, setServiceInput] = useState({
    title: "",
    basePrice: "",
    shortDescription: "",
    imageUrl: ""
  });
  const [serviceCityId, setServiceCityId] = useState("");
  const [optionInput, setOptionInput] = useState({
    name: "",
    price: "",
    imageUrl: ""
  });
  const [uploading, setUploading] = useState({
    category: false,
    service: false,
    option: false
  });
  const [uploadError, setUploadError] = useState({
    category: "",
    service: "",
    option: ""
  });

  const loadAll = async () => {
    const [citiesRes, categoriesRes, optionsRes] = await Promise.all([
      api.getCities(),
      api.getCategories(),
      api.getServiceOptions()
    ]);
    const servicesRes = await api.getServices();
    setCities(citiesRes || []);
    setCategories(categoriesRes || []);
    setServices(servicesRes || []);
    setServiceOptions(optionsRes || []);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleToggleService = async (svc) => {
    await api.updateService(svc.id, {
      categoryId: svc.categoryId,
      cityId: svc.cityId,
      title: svc.title,
      shortDescription: svc.shortDescription,
      imageUrl: svc.imageUrl || null,
      basePrice: svc.basePrice,
      durationMinutes: svc.durationMinutes,
      isActive: !svc.isActive
    });
    loadAll();
  };

  const handleAddCategory = async () => {
    const name = categoryInput.name.trim();
    if (!name) return;
    await api.createCategory({ name, imageUrl: categoryInput.imageUrl || null });
    setCategoryInput({ name: "", imageUrl: "" });
    loadAll();
  };

  const handleAddService = async () => {
    if (!selectedCategoryId) return;
    const title = serviceInput.title.trim();
    if (!title) return;
    await api.createService({
      categoryId: Number(selectedCategoryId),
      cityId: serviceCityId ? Number(serviceCityId) : null,
      title,
      shortDescription: serviceInput.shortDescription || null,
      imageUrl: serviceInput.imageUrl || null,
      basePrice: Number(serviceInput.basePrice) || 0,
      durationMinutes: null,
      isActive: true
    });
    setServiceInput({
      title: "",
      basePrice: "",
      shortDescription: "",
      imageUrl: ""
    });
    setServiceCityId("");
    loadAll();
  };

  const handleAddOption = async () => {
    if (!selectedServiceId) return;
    await api.createServiceOption({
      serviceId: Number(selectedServiceId),
      name: optionInput.name,
      imageUrl: optionInput.imageUrl || null,
      price: Number(optionInput.price) || 0,
      durationMinutes: null
    });
    setOptionInput({ name: "", price: "", imageUrl: "" });
    loadAll();
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
      if (target === "option") {
        setOptionInput((prev) => ({ ...prev, imageUrl: url }));
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
    loadAll();
  };

  const handleDeleteOption = async (id) => {
    await api.deleteServiceOption(id);
    loadAll();
  };

  const handleAddCity = async () => {
    const name = cityInput.trim();
    if (!name) return;
    await api.createCity({ name });
    setCityInput("");
    loadAll();
  };

  const handleDeleteCity = async (id) => {
    await api.deleteCity(id);
    loadAll();
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

  const filteredServices = selectedCategoryId
    ? services.filter((s) => String(s.categoryId) === String(selectedCategoryId))
    : services;

  const filteredOptions = selectedServiceId
    ? serviceOptions.filter(
        (o) => String(o.serviceId) === String(selectedServiceId)
      )
    : [];

  return (
    <>
      <Navbar />
      <div className="admin-page">
        <div className="admin-header">
          <div>
            <h2>Admin Dashboard</h2>
            <p className="admin-sub">
              Manage services, sections, and cities.
            </p>
          </div>
          <button className="admin-btn outline" onClick={handleLogout}>
            Logout
          </button>
        </div>

        <div className="admin-grid">
          <div className="admin-card">
            <h3>Services ({enabledCount} active)</h3>
            <div className="admin-input-row admin-input-row-small">
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
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
                <option value="">Select service</option>
                {filteredServices.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="admin-input-row admin-input-row-wide">
              <input
                type="text"
                placeholder="Service title"
                value={serviceInput.title}
                onChange={(e) =>
                  setServiceInput((prev) => ({ ...prev, title: e.target.value }))
                }
              />
              <input
                type="number"
                placeholder="Base price"
                value={serviceInput.basePrice}
                onChange={(e) =>
                  setServiceInput((prev) => ({
                    ...prev,
                    basePrice: e.target.value
                  }))
                }
              />
              <select
                value={serviceCityId}
                onChange={(e) => setServiceCityId(e.target.value)}
              >
                <option value="">All cities</option>
                {cities.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Short description"
                value={serviceInput.shortDescription}
                onChange={(e) =>
                  setServiceInput((prev) => ({
                    ...prev,
                    shortDescription: e.target.value
                  }))
                }
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleImageUpload(e.target.files?.[0], "service")
                }
              />
              <input
                type="text"
                placeholder="Image URL (optional)"
                value={serviceInput.imageUrl}
                onChange={(e) =>
                  setServiceInput((prev) => ({
                    ...prev,
                    imageUrl: e.target.value
                  }))
                }
              />
              <button className="admin-btn" onClick={handleAddService}>
                Add
              </button>
            </div>
            {uploading.service && (
              <p className="admin-muted">Uploading service image...</p>
            )}
            {uploadError.service && (
              <p className="admin-error">{uploadError.service}</p>
            )}
            <div className="admin-list">
              {filteredServices.map((service) => (
                <div key={service.id} className="admin-list-item">
                  <div>
                    <strong>{service.title}</strong>
                    <span className="admin-pill">
                      {service.isActive ? "Active" : "Inactive"}
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
                      onClick={() => handleDeleteService(service.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <h3>Cities</h3>
            <div className="admin-input-row admin-input-row-small">
              <input
                type="text"
                placeholder="Add new city"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
              />
              <button className="admin-btn" onClick={handleAddCity}>
                Add
              </button>
            </div>
            <div className="admin-list">
              {cities.map((city) => (
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
          </div>

          <div className="admin-card admin-wide">
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
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleImageUpload(e.target.files?.[0], "category")
                }
              />
              <button className="admin-btn" onClick={handleAddCategory}>
                Add
              </button>
            </div>
            {uploading.category && (
              <p className="admin-muted">Uploading category image...</p>
            )}
            {uploadError.category && (
              <p className="admin-error">{uploadError.category}</p>
            )}
            <div className="admin-list">
              {categories.map((cat) => (
                <div key={cat.id} className="admin-list-item">
                  <div>{cat.name}</div>
                  <button
                    className="admin-btn outline"
                    onClick={() => api.deleteCategory(cat.id).then(loadAll)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card admin-wide">
            <h3>Service Options</h3>
            <div className="admin-input-row admin-input-row-wide">
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
              >
                <option value="">Select service</option>
                {services.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.title}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Option name"
                value={optionInput.name}
                onChange={(e) =>
                  setOptionInput((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Image URL (optional)"
                value={optionInput.imageUrl}
                onChange={(e) =>
                  setOptionInput((prev) => ({
                    ...prev,
                    imageUrl: e.target.value
                  }))
                }
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleImageUpload(e.target.files?.[0], "option")
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
              <button className="admin-btn" onClick={handleAddOption}>
                Add
              </button>
            </div>
            {uploading.option && (
              <p className="admin-muted">Uploading option image...</p>
            )}
            {uploadError.option && (
              <p className="admin-error">{uploadError.option}</p>
            )}
            <div className="admin-sections">
              {filteredOptions.length === 0 ? (
                <p className="admin-muted">No options for this service.</p>
              ) : (
                filteredOptions.map((opt) => (
                  <div key={opt.id} className="admin-list-item">
                    <div>
                      <strong>{opt.name || "Option"}</strong>
                      <span className="admin-pill">Rs {opt.price}</span>
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
        </div>
      </div>
    </>
  );
}
