import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useState } from "react";
import { api } from "../api/client";

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, updateQty, clearCart } = useCart();

  const [avoidCall, setAvoidCall] = useState(true);
  const [selectedTip, setSelectedTip] = useState(100);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
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
  const slotSelected = Boolean(selectedDay && selectedTime);
  const days = [
    { key: "thu", label: "Thu", date: "05" },
    { key: "fri", label: "Fri", date: "06" },
    { key: "sat", label: "Sat", date: "07" },
    { key: "sun", label: "Sun", date: "08" }
  ];
  const times = ["05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"];
  const selectedDayMeta = days.find((d) => d.key === selectedDay);
  const selectedSlotText = selectedDayMeta
    ? `${selectedDayMeta.label}, Mar ${selectedDayMeta.date} - ${selectedTime}`
    : "";

  const buildScheduledAt = () => {
    const date = new Date();
    const dayToDate = { thu: 5, fri: 6, sat: 7, sun: 8 };
    const day = dayToDate[selectedDay] || date.getDate();
    const [hm, period] = selectedTime.split(" ");
    const [hhRaw, mmRaw] = hm.split(":").map((v) => Number(v));
    let hh = hhRaw % 12;
    if (period === "PM") hh += 12;
    const out = new Date(date.getFullYear(), date.getMonth(), day, hh, mmRaw || 0, 0);
    return out.toISOString();
  };

  const slotIsReserved = (dayKey, timeValue) =>
    reservedSlots.some(
      (s) => s.address === selectedAddress && s.day === dayKey && s.time === timeValue
    );

  const reserveSelectedSlot = () => {
    if (!selectedAddress || !selectedDay || !selectedTime) return;
    const next = [
      ...reservedSlots,
      { address: selectedAddress, day: selectedDay, time: selectedTime }
    ];
    setReservedSlots(next);
    localStorage.setItem("reserved_slots", JSON.stringify(next));
  };

  const buildBookingPayload = (userId) => ({
    userId,
    professionalId: null,
    scheduledAt: buildScheduledAt(),
    addressId: null,
    items: (cartItems || [])
      .filter((i) => Number.isFinite(Number(i.serviceId)))
      .map((i) => ({
        serviceId: Number(i.serviceId),
        serviceOptionId: i.serviceOptionId ?? null,
        price: Number(i.price) * Number(i.qty || 1),
        durationMinutes: 45
      }))
  });

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
      }))
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
    try {
      let nextRef = "";
      const authUserRaw = localStorage.getItem("auth_user");
      let authUser = null;
      try {
        authUser = authUserRaw ? JSON.parse(authUserRaw) : null;
      } catch {
        authUser = null;
      }

      if (authUser?.id && buildBookingPayload(authUser.id).items.length > 0) {
        try {
          const created = await api.createBooking(buildBookingPayload(authUser.id));
          nextRef = created?.bookingReference || "";
        } catch {
          nextRef = "";
        }
      }

      if (!nextRef) {
        nextRef = saveLocalBooking(authUser?.id || null);
      }

      reserveSelectedSlot();
      clearCart();
      setBookingRef(nextRef);
      setPaymentDone(true);
    } finally {
      setPaymentBusy(false);
    }
  };

  const handleAddressProceed = () => {
    if (!selectedAddress) return;
    const noSlotAvailable = days.every((day) =>
      times.every((time) =>
        reservedSlots.some(
          (s) => s.address === selectedAddress && s.day === day.key && s.time === time
        )
      )
    );
    const unavailable = /busy|unavailable|no slot/i.test(selectedAddress) || noSlotAvailable;
    setProfessionalsUnavailable(unavailable);
    setShowAddressModal(false);
    setShowAddAddressForm(false);
    setSelectedDay("");
    setSelectedTime("");
    setShowSlotModal(true);
  };

  const handleAddAddress = () => {
    const value = newAddress.trim();
    if (!value) return;
    setSavedAddresses((prev) => [...prev, value]);
    setSelectedAddress(value);
    setNewAddress("");
    setShowAddAddressForm(false);
  };

  const openSlotPicker = () => {
    if (!selectedAddress) return;
    const noSlotAvailable = days.every((day) =>
      times.every((time) =>
        reservedSlots.some(
          (s) => s.address === selectedAddress && s.day === day.key && s.time === time
        )
      )
    );
    const unavailable = /busy|unavailable|no slot/i.test(selectedAddress) || noSlotAvailable;
    setProfessionalsUnavailable(unavailable);
    setShowSlotModal(true);
  };

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <button type="button" className="checkout-logo" onClick={() => navigate("/")}>
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
                  {selectedAddress && (
                    <button
                      type="button"
                      className="checkout-edit-btn"
                      onClick={() => setShowAddressModal(true)}
                    >
                      Edit
                    </button>
                  )}
                </div>
                {selectedAddress ? (
                  <p className="checkout-meta checkout-address-preview">
                    {selectedAddress}
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

            <div className={`checkout-row ${!selectedAddress ? "muted" : ""}`}>
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
                {selectedAddress && !slotSelected && (
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
            {!paymentDone ? (
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
                    {paymentBusy ? "Processing..." : "Continue"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Payment Successful</h3>
                <p className="checkout-meta">
                  Your payment of Rs {total} was completed successfully.
                </p>
                {bookingRef && (
                  <p className="checkout-meta">Booking reference: {bookingRef}</p>
                )}
                <div className="payment-modal-actions">
                  <button
                    type="button"
                    className="payment-continue-btn"
                    onClick={() => {
                      closePaymentModal();
                      navigate("/bookings", {
                        state: { bookingReference: bookingRef, paymentStatus: "Paid" }
                      });
                    }}
                  >
                    View Booking
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
                  <label key={`${addr}-${idx}`} className="address-item">
                    <input
                      type="radio"
                      name="saved-address"
                      checked={selectedAddress === addr}
                      onChange={() => setSelectedAddress(addr)}
                    />
                    <div>
                      <strong>Address {idx + 1}</strong>
                      <span>{addr}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <hr />
            <button
              type="button"
              className="address-proceed"
              disabled={!selectedAddress}
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
                  {days.map((day) => (
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
                    <button
                      key={time}
                      type="button"
                      className={selectedTime === time ? "on" : ""}
                      disabled={slotIsReserved(selectedDay || "thu", time)}
                      onClick={() => setSelectedTime(time)}
                    >
                      {slotIsReserved(selectedDay || "thu", time) ? `${time} (Booked)` : time}
                    </button>
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
