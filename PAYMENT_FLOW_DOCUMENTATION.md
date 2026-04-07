# Payment Flow Implementation Guide

## Overview
This document outlines the integrated payment flow for the Urban Company application. The system simulates payment processing without integrating with real payment gateways, making it perfect for development and testing.

---

## 🏗️ Architecture

### Payment Flow Diagram
```
User selects services → Checkout page → Address & Slot selection 
  → Payment modal → UPI validation → Process Payment API 
  → Mock payment processing → Booking creation/update 
  → Payment confirmation
```

### Components Involved

**Backend:**
- `PaymentsController` - REST API endpoints for payment operations
- `PaymentService` - Business logic for payment processing
- `BookingsController` - Creates/updates bookings
- `Payment` Model - Stores payment records in database
- `Booking` Model - Links payments to bookings

**Frontend:**
- `Checkout.jsx` - Main checkout page with payment flow
- `api/client.js` - API client with payment methods
- `checkout.css` - Styling for payment modal and states

---

## 📋 API Endpoints

### 1. **Process Payment**
```
POST /api/Payments/process
```

**Request Body:**
```json
{
  "bookingId": "uuid-string",
  "amount": 1500.00,
  "provider": "UPI",
  "providerPaymentId": "user@bank"
}
```

**Success Response (200 OK):**
```json
{
  "id": 123,
  "bookingId": "uuid-string",
  "amount": 1500.00,
  "status": "Completed",
  "provider": "UPI",
  "providerPaymentId": "PAY_ABC123XYZ789",
  "message": "Payment successful! Your booking has been confirmed."
}
```

**Failure Response (400 Bad Request):**
```json
{
  "id": 124,
  "bookingId": "uuid-string",
  "amount": 1500.00,
  "status": "Failed",
  "provider": "UPI",
  "providerPaymentId": "PAY_DEF456UVW012",
  "message": "Payment failed. Please try again or use a different payment method."
}
```

### 2. **Get Payments by Booking**
```
GET /api/Payments/{bookingId}
```

**Response:**
```json
[
  {
    "id": 123,
    "bookingId": "uuid-string",
    "provider": "UPI",
    "providerPaymentId": "PAY_ABC123XYZ789",
    "amount": 1500.00,
    "status": "Completed"
  }
]
```

### 3. **Get Payment Status**
```
GET /api/Payments/status/{bookingId}
```

**Response:**
```json
{
  "bookingId": "uuid-string",
  "paymentStatus": "Completed"
}
```

---

## 🔄 Payment Flow Details

### Step 1: User Initiates Checkout
- User adds services to cart
- Navigates to `/checkout` page
- Selects service address and time slot

### Step 2: Payment Modal Opens
- User clicks "Pay Now" or "Proceed to payment"
- Payment modal displays with UPI input field
- Shows total amount to pay

### Step 3: UPI Validation
- Frontend validates UPI ID format (must contain "@")
- Shows error if format is invalid
- User can correct and retry

### Step 4: Process Payment
**Frontend Actions:**
1. Create booking via `POST /api/Bookings`
2. Process payment via `POST /api/Payments/process`
3. Pass booking ID to payment endpoint

**Backend Actions:**
1. Validate booking exists
2. Check for duplicate payments
3. Simulate payment (90% success rate)
4. Create Payment record
5. Update Booking status:
   - `PaymentStatus = "Completed"` → Booking status = `"CONFIRMED"`
   - `PaymentStatus = "Failed"` → Booking status = `"CANCELLED"`

### Step 5: Show Result to User
**On Success:**
- Display success message
- Show booking reference number
- Link to view booking details
- Clear cart
- Reserve selected slot locally

**On Failure:**
- Display error message
- Show "Retry Payment" button
- User can attempt payment again or close modal

---

## 🎯 QA Test Scenarios

### Scenario 1: Successful Payment
**Steps:**
1. Add services to cart
2. Go to Checkout
3. Select address and time slot
4. Click "Pay Now"
5. Enter valid UPI ID
6. Click "Continue" button

**Expected Results:**
- ✅ Payment processes successfully (~90% of attempts)
- ✅ Booking is created with status "CONFIRMED"
- ✅ Booking PaymentStatus = "Completed"
- ✅ Success message displays
- ✅ Booking reference is shown
- ✅ Cart is cleared
- ✅ Slot is marked as reserved
- ✅ User can view booking details

**Test Cases:**
- `Payment Success 1` - Normal flow
- `Payment Success 2` - Retry after failure
- `Payment Success 3` - Different service amounts

---

### Scenario 2: Payment Failure
**Steps:**
1. Follow same steps as successful payment
2. Close success modal without proceeding

**Expected Results:**
- ✅ Payment fails (~10% of attempts)
- ✅ Error message displays
- ✅ "Retry Payment" button appears
- ✅ Booking is marked with PaymentStatus = "Failed"
- ✅ Booking status = "CANCELLED"
- ✅ Cart remains unchanged
- ✅ Slot is NOT reserved (optional behavior)

**Test Cases:**
- `Payment Failure 1` - First failure
- `Payment Failure 2` - Multiple retries
- `Payment Failure 3` - Then successful retry

---

### Scenario 3: Duplicate Payment Prevention
**Steps:**
1. Complete a successful payment
2. Manually call API to process payment again for same booking

**Expected Results:**
- ✅ API returns 400 Bad Request
- ✅ Error message: "Payment already processed for this booking"
- ✅ No duplicate Payment record created
- ✅ Booking status unchanged

**Test Case:**
- `No Duplicate Payments` - Prevent accidental double charges

---

### Scenario 4: Invalid UPI ID
**Steps:**
1. Go through checkout flow
2. Try to complete payment with:
   - Empty UPI ID
   - UPI ID without "@"
   - Invalid characters

**Expected Results:**
- ✅ Frontend validation error appears
- ✅ Error message: "Enter a valid UPI ID (example: name@bank)."
- ✅ Payment API is not called
- ✅ User can correct and retry

**Test Cases:**
- `Empty UPI` - Blank input
- `Missing @` - user.bank format
- `Multiple @` - user@@bank format

---

### Scenario 5: Network Error / Timeout
**Steps:**
1. Complete checkout steps
2. Disconnect internet or cause network delay
3. Attempt payment

**Expected Results:**
- ✅ API client retries (up to 2 times)
- ✅ If still fails, error message displays
- ✅ User can retry or close modal
- ✅ No booking created if API fails

**Test Cases:**
- `Network Timeout` - Slow connection
- `Server Error (500)` - Backend error
- `API Unavailable` - No response

---

### Scenario 6: Payment with Various Amounts
**Steps:**
- Test payments with different amounts:
  - Minimum amount (₹0.01)
  - Typical amount (₹1000)
  - Large amount (₹100000)

**Expected Results:**
- ✅ Each payment processes independently
- ✅ Correct amount stored in database
- ✅ Booking total amount matches

**Test Cases:**
- `Small Amount Payment` - ₹50
- `Normal Amount Payment` - ₹1500
- `Large Amount Payment` - ₹50000

---

### Scenario 7: Mock Payment Success Rate
**Objective:** Verify 90% success / 10% failure rate

**Test:**
```bash
# Run 100 payment attempts and track results
SUCCESS_COUNT=0
FAILURE_COUNT=0
for i in {1..100}
do
  # Process payment and check status
  # Count successes and failures
done

# Expected: ~90 successes, ~10 failures
```

---

## 🔍 Database Verification

### Check Payment Records
```sql
-- View all payments
SELECT * FROM Payments WHERE BookingId = 'your-booking-id';

-- Check payment status distribution
SELECT Status, COUNT(*) as Count 
FROM Payments 
GROUP BY Status;

-- Verify booking and payment relationship
SELECT b.Id, b.BookingReference, b.PaymentStatus, p.Status, p.Amount
FROM Bookings b
LEFT JOIN Payments p ON b.Id = p.BookingId
WHERE b.Id = 'your-booking-id';
```

---

## 🛠️ Development Notes

### Mock Payment Processor
Located in `PaymentService.SimulatePaymentProcessing()`

**Current Behavior:**
- 90% success rate
- 10% failure rate
- Fails if amount ≤ 0

**To Adjust Success Rate:**
```csharp
// Current: 10% failure (< 0.1)
if (successChance < 0.1) return "Failed";

// Change to 20% failure:
if (successChance < 0.2) return "Failed";

// Change to 50% failure:
if (successChance < 0.5) return "Failed";
```

### Real Payment Gateway Integration
To integrate with real payment gateways (Razorpay, Stripe, PayPal):

1. Replace `SimulatePaymentProcessing()` with actual API call
2. Handle real payment responses and error codes
3. Store payment gateway transaction IDs
4. Implement webhook handlers for async notifications
5. Add PCI compliance measures

### Logging
All payment operations are logged:
- Successful payments
- Failed payments
- Duplicate attempts
- Validation errors
- Database errors

View logs in:
- Console output (development)
- Event Log (production)
- Application Insights (Azure)

---

## 🚨 Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Booking not found" | Invalid booking ID | Verify booking was created |
| "Payment already processed" | Duplicate payment attempt | Backend prevents duplicates |
| "Invalid payment amount" | Amount ≤ 0 | Check booking total calculation |
| "Network timeout" | Slow connection | API client retries automatically |
| "Request failed (500)" | Backend error | Check server logs |

---

## 📱 Frontend State Management

### Payment States
```javascript
paymentStatus: "pending"    // Initial state, waiting for UPI input
paymentStatus: "processing" // Payment API call in progress
paymentStatus: "success"    // Payment completed successfully
paymentStatus: "failed"     // Payment failed, show retry option
```

### Related States
```javascript
paymentBusy: boolean        // Disables button while processing
paymentMessage: string      // User-friendly status message
upiId: string              // UPI ID input value
upiError: string           // Validation error message
createdBookingId: uuid     // ID of created booking
bookingRef: string         // Booking reference for display
```

---

## 🎓 Integration Checklist

- [x] Backend API endpoints created
- [x] Payment service with business logic
- [x] Frontend payment modal with states
- [x] API client methods
- [x] Error handling and retry logic
- [x] Booking creation dependency
- [x] Payment status tracking
- [x] Database schema (already had PaymentStatus field)
- [x] CSS styling for payment states
- [x] Duplicate payment prevention
- [x] Logging and monitoring
- [ ] Real payment gateway integration (future)
- [ ] Payment webhooks (future)
- [ ] Payment history/receipts (future)

---

## 📚 Related Files

### Backend
- `Controllers/PaymentsController.cs` - REST API
- `Services/IPaymentService.cs` - Interface
- `Services/PaymentService.cs` - Implementation
- `Models/Payment.cs` - Payment model
- `Dto/PaymentDto.cs` - DTOs
- `Controllers/BookingsController.cs` - Booking creation

### Frontend
- `pages/Checkout.jsx` - Main component
- `api/client.js` - API client
- `styles/pages/checkout.css` - Styling
- `context/CartContext.jsx` - Cart state

---

## 🔐 Security Considerations

### Currently NOT Implemented (For Production)
- PCI DSS Compliance
- Real encryption for sensitive data
- Secure payment gateway integration
- Payment webhook verification
- Fraud detection
- Rate limiting on payment attempts
- Two-factor authentication

### Recommended Next Steps
1. Implement real payment gateway (Razorpay recommended for India)
2. Add PCI compliance measures
3. Implement fraud detection
4. Add payment webhook handling
5. Implement rate limiting
6. Add audit logging for compliance

---

## 📞 Support

For issues or questions about the payment system:
1. Check the logs for detailed error messages
2. Review QA test scenarios above
3. Check database records
4. Verify API endpoint responses
5. Review code comments and documentation

---

**Last Updated:** April 8, 2026
**Payment System Version:** 1.0 (Mock Implementation)
**Status:** ✅ Ready for Development & QA Testing
