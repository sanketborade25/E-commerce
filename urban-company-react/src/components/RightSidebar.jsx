import { useCart } from "../context/CartContext";
import { resolveImage } from "../utils/image";

export default function RightSidebar() {
  const { cartItems, removeFromCart, updateQty, setQty } = useCart();
  const totalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  return (
    <div className="right-sidebar">
      {cartItems.length === 0 ? (
        <div className="cart-box">
          <h4>Your cart</h4>
          <p>No items in your cart</p>
        </div>
      ) : (
        <div className="cart-box filled">
          <div className="cart-header">
            <h4>Your cart</h4>
            <span>{totalQty} items</span>
          </div>
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={item.key} className="cart-item">
                <img src={resolveImage(item.img)} alt={item.name} />
                <div className="cart-item-info">
                  <p className="cart-item-name">{item.name}</p>
                  <span className="cart-item-meta">
                    Qty {item.qty} · Rs {item.price}
                  </span>
                  <div className="cart-qty-controls">
                    <button
                      className="qty-btn"
                      onClick={() => updateQty(item.key, -1)}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <input
                      className="qty-input"
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        setQty(item.key, Number.isNaN(value) ? 0 : value);
                      }}
                    />
                    <button
                      className="qty-btn"
                      onClick={() => updateQty(item.key, 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="cart-item-price">Rs {item.price * item.qty}</div>
                <button
                  className="remove-item-btn"
                  onClick={() => removeFromCart(item.key)}
                  aria-label="Remove item"
                >
                  x
                </button>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <span>Total</span>
            <strong>Rs {totalPrice}</strong>
          </div>
          <button className="view-cart-btn">View Cart</button>
        </div>
      )}

      <div className="offer-box">
        <p>Amazon cashback upto Rs 100</p>
        <a href="#">View More Offers</a>
      </div>

      <div className="promise-box">
        <img src="/images/1Homepage/logo (4).png" alt="UC Promise" />
        <div className="promise-content">
          <h4>UC Promise</h4>
          <ul>
            <li>Verified Professionals</li>
            <li>Hassle Free Booking</li>
            <li>Transparent Pricing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
