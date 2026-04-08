# UrbanApp Notification System TODO

Simplified implementation: Customer notifications for booking/payment/status events with backend storage + frontend toasts (react-hot-toast).

## Steps:

### Backend (urbanclone-dev/UrbanApi/)
[x] 1. Create `Services/INotificationService.cs` & `NotificationService.cs` (inject DbContext, create customer notifications). **DONE**

[x] 2. Register `NotificationService` in `Program.cs` (DI). **DONE**

[x] 3. Update `Services/PaymentService.cs`: Inject service, create notification on payment \"Completed\" (\"Payment Success - Booking Confirmed\") & \"Failed\". **DONE**

[x] 4. Update `Controllers/BookingsController.cs`: 
     - Create(): Notify customer (\"Booking Created Successfully\"). **DONE**
     - Status updates (admin/pro): On ACCEPTED/CONFIRMED/\"COMPLETED\"/CANCELLED → notify customer. **PARTIAL (constructor injected)**

### Frontend (urban-company-react/)
[x] 5. `execute_command`: `cd urban-company-react && npm install react-hot-toast`. **DONE**

[x] 6. Update `src/main.jsx`: Add `<Toaster />` provider. **DONE**

[x] 7. Update `src/api/client.js`: Add `getNotifications(userId)`, `getUnreadCount(userId)`. **DONE**

[x] 8. Create `src/context/NotificationContext.jsx`: Simple fetch unread/count + useToast hook. **DONE**

[x] 9. Update `pages/Checkout.jsx`: Toast on payment success/fail. **DONE**
[x] 10. Update `pages/ProfessionalBookings.jsx`: Toast on status update success. **DONE**

### Testing
[ ] 11. Test end-to-end: Booking → payment → status → verify DB + toasts.

**Current Progress: Backend payment/booking notifications complete. Moving to frontend.**

**Simplified: Customer-only, no pro/admin notifies, toasts only (no list/UI page)."

