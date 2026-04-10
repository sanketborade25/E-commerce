import { Link, useNavigate } from "react-router-dom";
import { toast } from 'react-hot-toast';
import { useCart } from "../context/CartContext";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import "../styles/pages/checkout.css";

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, updateQty, clearCart } = useCart();
  const [cityId, setCityId] = useState(() => localStorage.getItem("selected_city_id") || "");
  const [cityName, setCityName] = useState(() => localStorage.getItem("selected_city_name") || "");

  const [avoidCall, setAvoidCall] = useState(true);
  const [selectedTip, setSelectedTip] = useState(100);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [professionalsUnavailable, setProfessionalsUnavailable] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [upiError, setUpiError] = useState("");
  const [paymentDone, setPaymentDone] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending"); // "pending", "processing", "success", "failed"
  const [paymentMessage, setPaymentMessage] = useState("");
  const [createdBookingId, setCreatedBookingId] = useState(null);
  const [reservedSlots, setReservedSlots] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("reserved_slots") || "[]");
    } catch {
      return [];
    }
  });

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const taxesAndFee = subtotal > 0 ? Math.round(subtotal * 0.072) : 0;
  const tipAmount = selectedTip === "custom" ? 0 : Number(selectedTip || 0);
  const total = subtotal + taxesAndFee + tipAmount;
  const displayedTitle = cartItems[0]?.name || "Salon Prime";
  const times = ["05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"];
  const getSlotValue = (slot) => {
    if (typeof slot === "string") return slot;
    if (!slot || typeof slot !== "object") return "";
    return slot.startTime || slot.start || slot.time || slot.value || slot.label || "";
  };
  const getSlotLabel = (slot) => {
    if (typeof slot === "string") return slot;
    if (!slot || typeof slot !== "object") return "";
    return slot.label || slot.startTime || slot.start || slot.time || slot.value || "";
  };
  const selectedTimeValue = getSlotValue(selectedTime);
  const slotSelected = Boolean(selectedDay && selectedTimeValue);
  const selectedAddressText = selectedAddress?.line1 || "";
  const selectedAddressCity = selectedAddress?.city || cityName || "";
  const normalizeText = (value) => {
    const text = String(value || "").trim();
    return text || undefined;
  };
  const sanitizeObject = (value) =>
    Object.fromEntries(
      Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== "")
    );
  const parseTime12h = (value) => {
    const [timePart, modifier] = String(value || "").trim().split(" ");
    if (!timePart || !modifier) return { hour: 0, minute: 0 };
    const [rawHour, rawMinute] = timePart.split(":").map(Number);
    let hour = rawHour % 12;
    if (modifier.toUpperCase() === "PM") hour += 12;
    return { hour, minute: Number(rawMinute || 0) };
  };

  const generateAvailableDays = () => {
    const today = new Date();
    const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
    const dayFormatter = new Intl.DateTimeFormat("en-US", { day: "2-digit" });

    return Array.from({ length: 3 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayKey = date.toISOString().split("T")[0];
      return {
        key: dayKey,
        value: dayKey,
        label: i === 0 ? "Today" : weekdayFormatter.format(date),
        date: dayFormatter.format(date),
        fullDate: date
      };
    });
  };

  const availableDays = useMemo(() => generateAvailableDays(), []);
  const selectedDayMeta = availableDays.find((day) => day.key === selectedDay);
  const selectedSlotText = selectedDayMeta
    ? `${selectedDayMeta.label}, ${selectedDayMeta.date} - ${getSlotLabel(selectedTime)}`
    : "";

  const buildScheduledAt = () => {
    if (!selectedDayMeta || !selectedTimeValue) return null;

    const { hour, minute } = parseTime12h(selectedTimeValue);
    const selectedDate = new Date(selectedDayMeta.fullDate);
    selectedDate.setHours(hour, minute, 0, 0);

    return selectedDate.toISOString();
  };

  const slotIsReserved = (dayKey, timeValue) =>
    reservedSlots.some(
      (s) => s.address === selectedAddressText && s.day === dayKey && s.time === timeValue
    );

  const reserveSelectedSlot = () => {
    if (!selectedAddressText || !selectedDay || !selectedTimeValue) return;
    const next = [
      ...reservedSlots,
      { address: selectedAddressText, day: selectedDay, time: selectedTimeValue }
    ];
    setReservedSlots(next);
    localStorage.setItem("reserved_slots", JSON.stringify(next));
  };

  useEffect(() => {
    const fetchSelectedCityName = async (nextCityId) => {
      if (!nextCityId) {
        setCityName("");
        localStorage.removeItem("selected_city_name");
        return "";
      }

      try {
        const cities = await api.getCities();
        const matchedCity = (cities || []).find((city) => String(city?.id) === String(nextCityId));
        const nextCityName = normalizeText(matchedCity?.name) || "";
        setCityName(nextCityName);
        if (nextCityName) {
          localStorage.setItem("selected_city_name", nextCityName);
        }
        return nextCityName;
      } catch (error) {
        console.error("Unable to load cities for checkout:", error);
        return "";
      }
    };

    const handleCityChanged = async (event) => {
      const nextCityId = String(event.detail?.cityId || localStorage.getItem("selected_city_id") || "");
      setCityId(nextCityId);
      await fetchSelectedCityName(nextCityId);
    };

    const loadCheckoutContext = async () => {
      const selectedCityId = String(localStorage.getItem("selected_city_id") || "");
      setCityId(selectedCityId);
      const nextCityName = await fetchSelectedCityName(selectedCityId);

      const authUserRaw = localStorage.getItem("auth_user");
      let authUser = null;

      try {
        authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
      } catch {
        authUser = null;
      }

      if (!authUser?.id) return;

      try {
        const addresses = await api.getAddressesByUser(authUser.id);
        const mapped = (addresses || []).map((address) =>
          sanitizeObject({
            id: address?.id ?? null,
            line1: normalizeText(address?.line1),
            city: nextCityName || normalizeText(cityName),
            cityId: address?.cityId ?? (selectedCityId ? Number(selectedCityId) : undefined)
          })
        );
        setSavedAddresses(mapped.filter((address) => address.line1));
      } catch (error) {
        console.error("Unable to load saved addresses:", error);
      }
    };

    loadCheckoutContext();
    window.addEventListener("city-changed", handleCityChanged);

    return () => window.removeEventListener("city-changed", handleCityChanged);
  }, []);

  const ensureBookingAddress = async (userId) => {
    const address = normalizeText(selectedAddress?.line1 || newAddress);
    const city = normalizeText(selectedAddress?.city || cityName);
    const parsedCityId = Number(selectedAddress?.cityId || cityId);

    if (!address || !city || !Number.isFinite(parsedCityId) || parsedCityId <= 0) {
      return null;
    }

    if (selectedAddress?.id) {
      return {
        addressId: selectedAddress.id,
        address,
        city,
        cityId: parsedCityId
      };
    }

    const createdAddress = await api.createAddress({
      userId,
      line1: address,
      cityId: parsedCityId,
      isDefault: false
    });

    const nextAddress = sanitizeObject({
      id: createdAddress?.id,
      line1: normalizeText(createdAddress?.line1) || address,
      city,
      cityId: createdAddress?.cityId ?? parsedCityId
    });

    setSavedAddresses((prev) => {
      const exists = prev.some((entry) => entry.id === nextAddress.id || entry.line1 === nextAddress.line1);
      return exists ? prev : [...prev, nextAddress];
    });
    setSelectedAddress(nextAddress);

    return {
      addressId: nextAddress.id,
      address: nextAddress.line1,
      city: nextAddress.city,
      cityId: Number(nextAddress.cityId)
    };
  };

  const buildBookingPayload = async (userId) => {
    const location = await ensureBookingAddress(userId);
    const scheduledAt = buildScheduledAt();
    const items = (cartItems || [])
      .filter((i) => Number.isFinite(Number(i.serviceId)))
      .map((i) =>
        sanitizeObject({
          serviceId: Number(i.serviceId),
          serviceOptionId: i.serviceOptionId ?? null,
          price: Number(i.price) * Number(i.qty || 1),
          durationMinutes: 45
        })
      );

    if (!location?.addressId || !location.address || !location.city || !scheduledAt) {
      return null;
    }

    return sanitizeObject({
      userId,
      professionalId: null,
      scheduledAt,
      addressId: location.addressId,
      address: location.address,
      city: location.city,
      cityId: location.cityId,
      items
    });
  };

  const saveLocalBooking = (userId = null) => {
    const ref = `BK-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
    const booking = {
      id: `local-${Date.now()}`,
      userId,
      bookingReference: ref,
      status: "Confirmed",
      scheduledAt: buildScheduledAt(),
      totalAmount: total,
      paymentStatus: "Paid",
      items: (cartItems || []).map((i) => ({
        serviceId: i.serviceId,
        serviceOptionId: i.serviceOptionId ?? null,
        price: Number(i.price) * Number(i.qty || 1),
        durationMinutes: 45
      })),
      address: selectedAddressText,
      city: selectedAddressCity
    };
    let list = [];
    try {
      list = JSON.parse(localStorage.getItem("guest_bookings") || "[]");
    } catch {
      list = [];
    }
    list.unshift(booking);
    localStorage.setItem("guest_bookings", JSON.stringify(list));
    return ref;
  };

  const resetPaymentState = () => {
    setUpiId("");
    setUpiError("");
    setPaymentDone(false);
    setPaymentStatus("pending");
    setPaymentMessage("");
    setCreatedBookingId(null);
  };

  const openPaymentModal = () => {
    resetPaymentState();
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    resetPaymentState();
  };

  const handlePaymentContinue = async () => {
    const value = upiId.trim();
    if (!value || !value.includes("@")) {
      setUpiError("Enter a valid UPI ID (example: name@bank).");
      return;
    }
    setUpiError("");
    setPaymentBusy(true);
    setPaymentStatus("processing");
    setPaymentMessage("Processing your payment...");

    try {
      const authUserRaw = localStorage.getItem("auth_user");
      let authUser = null;
      try {
        authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
      } catch {
        authUser = null;
      }

      const address = normalizeText(selectedAddressText || newAddress);
      const city = normalizeText(selectedAddressCity || cityName);
      const scheduledAt = buildScheduledAt();

      if (!address || !city || !scheduledAt) {
        setPaymentStatus("failed");
        setPaymentMessage("Please select a valid address, city, date, and time before continuing.");
        return;
      }

      // Step 1: Create booking with Pending payment status
      let bookingId = null;
      let createdBooking = null;

      if (authUser?.id) {
        try {
          const bookingPayload = await buildBookingPayload(authUser.id);
          if (!bookingPayload?.items?.length) {
            setPaymentStatus("failed");
            setPaymentMessage("Your cart is empty or booking details are incomplete.");
            return;
          }

          console.log("Final booking payload:", bookingPayload);
          createdBooking = await api.createBooking(bookingPayload);
          bookingId = createdBooking?.id;
        } catch (err) {
          console.error("Booking creation failed:", err);
          setPaymentStatus("failed");
          setPaymentMessage("Failed to create booking. Please try again.");
          return;
        }
      } else {
        setPaymentStatus("failed");
        setPaymentMessage("Please login to complete the booking.");
        return;
      }

      // Step 2: Process payment
      if (!bookingId) {
        setPaymentStatus("failed");
        setPaymentMessage("Booking creation failed. Please try again.");
        return;
      }

      try {
        const paymentResponse = await api.processPayment({
          bookingId: bookingId,
          amount: total,
          provider: "UPI",
          providerPaymentId: upiId
        });

        if (paymentResponse?.status === "Completed") {
          toast.success(paymentResponse?.message || "Payment successful! Booking confirmed.");
          // Payment successful
          setPaymentStatus("success");
          setPaymentMessage(paymentResponse?.message || "Payment successful! Your booking is confirmed.");
          setBookingRef(createdBooking?.bookingReference || `BK-${bookingId}`);
          setCreatedBookingId(bookingId);
          setPaymentDone(true);
          reserveSelectedSlot();
          clearCart();
        } else {
          toast.error(paymentResponse?.message || "Payment failed. Please try again.");
          // Payment failed
          setPaymentStatus("failed");
          setPaymentMessage(paymentResponse?.message || "Payment failed. Please try again.");
        }
      } catch (err) {
        console.error("Payment processing error:", err);
        setPaymentStatus("failed");
        setPaymentMessage(err?.message || "Payment failed. Please try again.");
      }
    } finally {
      setPaymentBusy(false);
    }
  };

  const handleAddressProceed = () => {
    if (!selectedAddressText || !selectedAddressCity) return;
    const noSlotAvailable = availableDays.every((day) =>
      times.every((time) =>
        reservedSlots.some(
          (s) => s.address === selectedAddressText && s.day === day.key && s.time === time
        )
      )
    );
    const unavailable = /busy|unavailable|no slot/i.test(selectedAddressText) || noSlotAvailable;
    setProfessionalsUnavailable(unavailable);
    setShowAddressModal(false);
    setShowAddAddressForm(false);
    setSelectedDay("");
    setSelectedTime("");
    setShowSlotModal(true);
  };

  const handleAddAddress = () => {
    const value = newAddress.trim();
    const nextCity = normalizeText(cityName);
    const parsedCityId = Number(cityId);
    if (!value || !nextCity || !Number.isFinite(parsedCityId) || parsedCityId <= 0) return;
    const nextAddress = {
      line1: value,
      city: nextCity,
      cityId: parsedCityId
    };
    setSavedAddresses((prev) => [...prev, nextAddress]);
    setSelectedAddress(nextAddress);
    setNewAddress("");
    setShowAddAddressForm(false);
  };

  const openSlotPicker = () => {
    if (!selectedAddressText) return;
    const noSlotAvailable = availableDays.every((day) =>
      times.every((time) =>
        reservedSlots.some(
          (s) => s.address === selectedAddressText && s.day === day.key && s.time === time
        )
      )
    );
    const unavailable = /busy|unavailable|no slot/i.test(selectedAddressText) || noSlotAvailable;
    setProfessionalsUnavailable(unavailable);
    if (!selectedDay && availableDays[0]?.key) {
      setSelectedDay(availableDays[0].key);
    }
    setShowSlotModal(true);
  };

  const isPastTime = (time) => {
    if (!selectedDayMeta || selectedDayMeta.key !== availableDays[0]?.key) return false;

    const { hour, minute } = parseTime12h(time);
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return hour < currentHour || (hour === currentHour && minute < currentMinute);
  };

  const handleTimeSelect = (timeSlot) => {
    setSelectedTime(getSlotValue(timeSlot));
  };

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <button type="button" className="checkout-logo" onClick={() => navigate("/Home")}>
          UC
        </button>
        <div>
          <h2>Checkout</h2>
        </div>
      </div>

      <div className="checkout-grid">
        <div className="checkout-left">
          <div className="checkout-card">
            <div className="checkout-row">
              <div className="checkout-icon" aria-hidden>
                i
              </div>
              <div>
                <p className="checkout-title">Send booking details to</p>
                <p className="checkout-meta">+91 7760252524</p>
              </div>
            </div>

            <div className="checkout-row">
              <div className="checkout-icon" aria-hidden>
                i
              </div>
              <div>
                <div className="checkout-row-head">
                  <p className="checkout-title">Address</p>
                  {selectedAddressText && (
                    <button
                      type="button"
                      className="checkout-edit-btn"
                      onClick={() => setShowAddressModal(true)}
                    >
                      Edit
                    </button>
                  )}
                </div>
                {selectedAddressText ? (
                  <p className="checkout-meta checkout-address-preview">
                    {selectedAddressText}
                    {selectedAddressCity ? `, ${selectedAddressCity}` : ""}
                  </p>
                ) : (
                  <button
                    type="button"
                    className="checkout-select-address"
                    onClick={() => setShowAddressModal(true)}
                  >
                    Select address
                  </button>
                )}
              </div>
            </div>

            <div className={`checkout-row ${!selectedAddressText ? "muted" : ""}`}>
              <div className="checkout-icon" aria-hidden>
                T
              </div>
              <div>
                <div className="checkout-row-head">
                  <p className="checkout-title">Slot</p>
                  {slotSelected && (
                    <button
                      type="button"
                      className="checkout-edit-btn"
                      onClick={openSlotPicker}
                    >
                      Edit
                    </button>
                  )}
                </div>
                {selectedAddressText && !slotSelected && (
                  <button
                    type="button"
                    className="checkout-select-address"
                    onClick={openSlotPicker}
                  >
                    Select time & date
                  </button>
                )}
                {slotSelected && <p className="checkout-meta">{selectedSlotText}</p>}
              </div>
            </div>

            <div className={`checkout-row ${slotSelected ? "" : "muted"}`}>
              <div className="checkout-icon" aria-hidden>
                $
              </div>
              <div>
                <p className="checkout-title">Payment Method</p>
                {slotSelected && (
                  <>
                    <button
                      type="button"
                      className="checkout-select-address"
                      onClick={openPaymentModal}
                    >
                      Proceed to pay
                    </button>
                    <p className="checkout-payment-terms">
                      By proceeding, you agree to our T&C, Privacy and Cancellation
                      Policy.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="checkout-policy">
            <h3>Cancellation policy</h3>
            <p>
              Free cancellations if done more than 12 hrs before the service. A fee
              will be charged otherwise.
            </p>
            <Link className="checkout-policy-link" to="#">
              Read full policy
            </Link>
          </div>
        </div>

        <div className="checkout-right">
          <div className="checkout-card">
            <h3>{displayedTitle}</h3>
            {cartItems.length === 0 ? (
              <p className="checkout-meta">No items added yet.</p>
            ) : (
              cartItems.map((item) => (
                <div key={item.key} className="checkout-item">
                  <div>
                    <p className="checkout-item-name">{item.name}</p>
                  </div>
                  <div className="checkout-item-qty">
                    <button
                      type="button"
                      onClick={() => updateQty(item.key, -1)}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span>{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.key, 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <div className="checkout-item-price">Rs {item.price * item.qty}</div>
                </div>
              ))
            )}

            <label className="checkout-toggle" htmlFor="avoid-calls">
              <input
                id="avoid-calls"
                type="checkbox"
                checked={avoidCall}
                onChange={(e) => setAvoidCall(e.target.checked)}
              />
              Avoid calling before reaching the location
            </label>
          </div>

          <div className="checkout-card">
            <h3>Payment summary</h3>
            <div className="checkout-summary">
              <div>
                <span>Item total</span>
                <span>Rs {subtotal}</span>
              </div>
              <div>
                <span>Taxes and Fee</span>
                <span>Rs {taxesAndFee}</span>
              </div>
              <div className="checkout-summary-total">
                <strong>Total amount</strong>
                <strong>Rs {total}</strong>
              </div>
              <div>
                <strong>Amount to pay</strong>
                <strong>Rs {total}</strong>
              </div>
            </div>

            <div className="checkout-tip">
              <h4>Add a tip to thank the Professional</h4>
              <div className="checkout-tip-row">
                {[50, 75, 100].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={selectedTip === value ? "on" : ""}
                    onClick={() => setSelectedTip(value)}
                  >
                    Rs {value}
                  </button>
                ))}
                <button
                  type="button"
                  className={selectedTip === "custom" ? "on" : ""}
                  onClick={() => setSelectedTip("custom")}
                >
                  Custom
                </button>
              </div>
              <p className="checkout-meta">100% of the tip goes to the professional.</p>
            </div>
          </div>

          {!slotSelected && (
            <div className="checkout-pay">
              <div>
                <p className="checkout-title">Amount to pay</p>
                <h3>Rs {total}</h3>
              </div>
              <button
                type="button"
                className="checkout-breakup-link"
                onClick={openPaymentModal}
              >
                Continue to payment
              </button>
            </div>
          )}
        </div>
      </div>

      {showPaymentModal && (
        <div className="payment-modal-overlay" onClick={closePaymentModal}>
          <div className="payment-modal-card" onClick={(e) => e.stopPropagation()}>
            {paymentStatus === "pending" && (
              <>
                <h3>UPI Payment</h3>
                <p className="checkout-meta">Amount to pay: Rs {total}</p>
                <input
                  type="text"
                  className="payment-upi-input"
                  placeholder="Enter UPI ID (e.g. user@bank)"
                  value={upiId}
                  onChange={(e) => {
                    setUpiId(e.target.value);
                    if (upiError) setUpiError("");
                  }}
                />
                {upiError && <p className="payment-error">{upiError}</p>}
                <div className="payment-modal-actions">
                  <button
                    type="button"
                    className="payment-cancel-btn"
                    onClick={closePaymentModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="payment-continue-btn"
                    onClick={handlePaymentContinue}
                    disabled={paymentBusy}
                  >
                    {paymentBusy ? "Processing..." : "Pay Now"}
                  </button>
                </div>
              </>
            )}

            {paymentStatus === "processing" && (
              <>
                <h3>Processing Payment</h3>
                <p className="checkout-meta">{paymentMessage}</p>
                <div className="payment-loading">
                  <div className="spinner"></div>
                </div>
              </>
            )}

            {paymentStatus === "success" && (
              <>
                <h3>✓ Payment Successful</h3>
                <p className="checkout-meta">{paymentMessage}</p>
                {bookingRef && (
                  <p className="checkout-meta">
                    <strong>Booking Reference:</strong> {bookingRef}
                  </p>
                )}
                <div className="payment-modal-actions">
                  <button
                    type="button"
                    className="payment-continue-btn"
                    onClick={() => {
                      closePaymentModal();
                      navigate("/bookings", {
                        state: { 
                          bookingReference: bookingRef, 
                          paymentStatus: "Completed",
                          bookingId: createdBookingId
                        }
                      });
                    }}
                  >
                    View Booking Details
                  </button>
                </div>
              </>
            )}

            {paymentStatus === "failed" && (
              <>
                <h3>✗ Payment Failed</h3>
                <p className="checkout-meta">{paymentMessage}</p>
                <p className="checkout-meta payment-error-note">
                  Your booking was not confirmed. Please retry or use a different payment method.
                </p>
                <div className="payment-modal-actions">
                  <button
                    type="button"
                    className="payment-cancel-btn"
                    onClick={() => {
                      resetPaymentState();
                      setShowPaymentModal(false);
                    }}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="payment-continue-btn"
                    onClick={() => setPaymentStatus("pending")}
                  >
                    Retry Payment
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showAddressModal && (
        <div className="address-modal" onClick={() => setShowAddressModal(false)}>
          <div className="address-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="address-modal-header">
              <h3>Saved addresses</h3>
              <button
                type="button"
                className="address-close"
                onClick={() => setShowAddressModal(false)}
                aria-label="Close"
              >
                x
              </button>
            </div>

            <button
              type="button"
              className="address-add"
              onClick={() => setShowAddAddressForm((v) => !v)}
            >
              + Add another address
            </button>

            {showAddAddressForm && (
              <div className="address-add-form">
                <input
                  type="text"
                  placeholder="Enter address"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
                <button type="button" className="address-proceed" onClick={handleAddAddress}>
                  Save address
                </button>
              </div>
            )}

            {savedAddresses.length > 0 && (
              <div className="address-list">
                {savedAddresses.map((addr, idx) => (
                  <label key={`${addr.id || addr.line1}-${idx}`} className="address-item">
                    <input
                      type="radio"
                      name="saved-address"
                      checked={selectedAddress?.id ? selectedAddress.id === addr.id : selectedAddress?.line1 === addr.line1}
                      onChange={() => setSelectedAddress(addr)}
                    />
                    <div>
                      <strong>Address {idx + 1}</strong>
                      <span>
                        {addr.line1}
                        {addr.city ? `, ${addr.city}` : ""}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <hr />
            <button
              type="button"
              className="address-proceed"
              disabled={!selectedAddressText || !selectedAddressCity}
              onClick={handleAddressProceed}
            >
              Proceed
            </button>
          </div>
        </div>
      )}

      {showSlotModal && (
        <div className="address-modal" onClick={() => setShowSlotModal(false)}>
          <div
            className={`address-modal-card ${professionalsUnavailable ? "slot-unavailable-card" : "slot-modal-card"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="address-modal-header">
              <h3>
                {professionalsUnavailable
                  ? "Professionals unavailable"
                  : "When should the professional arrive?"}
              </h3>
              <button
                type="button"
                className="address-close"
                onClick={() => setShowSlotModal(false)}
                aria-label="Close"
              >
                x
              </button>
            </div>

            {professionalsUnavailable ? (
              <>
                <p className="checkout-meta slot-note">
                  All our professionals for this location are busy. We can notify
                  you when available.
                </p>
                <div className="slot-unavailable-actions">
                  <button type="button" className="checkout-select-address">
                    Notify when slots are available
                  </button>
                  <button
                    type="button"
                    className="slot-secondary-btn"
                    onClick={() => {
                      setShowSlotModal(false);
                      setShowAddressModal(true);
                    }}
                  >
                    Change service address
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="checkout-meta slot-note">Service will take approx. 45 mins</p>
                <div className="slot-days">
                  {availableDays.map((day) => (
                    <button
                      key={day.key}
                      type="button"
                      className={selectedDay === day.key ? "on" : ""}
                      onClick={() => setSelectedDay(day.key)}
                    >
                      <span>{day.label}</span>
                      <strong>{day.date}</strong>
                    </button>
                  ))}
                </div>

                <h4 className="slot-title">Select start time of service</h4>
                <div className="slot-times">
                  {times.map((time) => (
                    (() => {
                      const slotValue = getSlotValue(time);
                      const slotLabel = getSlotLabel(time);
                      const isSelected = selectedTimeValue === slotValue;
                      const isReserved = slotIsReserved(
                        selectedDay || availableDays[0].value,
                        slotValue
                      );
                      const disabled = isReserved || isPastTime(slotValue);

                      return (
                    <button
                      key={slotValue || slotLabel}
                      type="button"
                      className={isSelected ? "on active" : ""}
                      disabled={disabled}
                      onClick={() => handleTimeSelect(time)}
                    >
                      {isReserved ? `${slotLabel} (Booked)` : slotLabel}
                    </button>
                      );
                    })()
                  ))}
                </div>
                <hr />
                <button
                  type="button"
                  className="address-proceed slot-proceed-btn"
                  disabled={!slotSelected}
                  onClick={() => setShowSlotModal(false)}
                >
                  Proceed to checkout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
