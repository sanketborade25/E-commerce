# Urban Company–like App: QA Interview Prep

## 🧪 Test Cases

### Bookings Module
| Test Case ID | Scenario | Steps | Expected Result | Priority | Severity |
|--------------|----------|-------|----------------|----------|----------|
| BK-01 | User books a service successfully | 1. Login as user 2. Select service 3. Choose slot 4. Complete payment | Booking created, confirmation shown, slot blocked | High | Critical |
| BK-02 | Booking fails after payment | 1. Simulate payment success 2. API fails to create booking | Payment refunded, user notified, no booking created | High | Critical |
| BK-03 | Double booking for same slot | 1. User A books slot 2. User B books same slot | Second booking rejected, error shown | High | Major |
| BK-04 | Cancel booking before service | 1. Book service 2. Cancel before scheduled time | Booking status updated to 'Cancelled', refund processed | Medium | Major |
| BK-05 | Booking history loads for user | 1. Login 2. Go to bookings page | All past and upcoming bookings shown | Medium | Minor |
| BK-06 | Admin views all bookings | 1. Login as admin 2. Open bookings module | All bookings listed with filters | High | Major |
| BK-07 | Professional sees assigned bookings | 1. Login as professional 2. View dashboard | Only their bookings shown | High | Major |
| BK-08 | Booking status transitions | 1. Book service 2. Admin/professional updates status | Status changes reflected in UI and DB | High | Major |
| BK-09 | Payment failure during booking | 1. Simulate payment failure | No booking created, error shown | High | Critical |
| BK-10 | Booking notification sent | 1. Book service | User, admin, professional receive notifications | Medium | Minor |

### Users Module
| Test Case ID | Scenario | Steps | Expected Result | Priority | Severity |
|--------------|----------|-------|----------------|----------|----------|
| US-01 | User registration | 1. Fill signup form 2. Submit | User created, verification email sent | High | Major |
| US-02 | Duplicate phone/email registration | 1. Register with existing phone/email | Error shown, registration blocked | High | Major |
| US-03 | User login with valid credentials | 1. Enter valid credentials 2. Login | Redirect to dashboard | High | Major |
| US-04 | User login with invalid credentials | 1. Enter wrong password | Error shown, login blocked | High | Major |
| US-05 | Admin deactivates user | 1. Admin disables user | User cannot login, status updated | High | Major |
| US-06 | User updates profile | 1. Edit profile 2. Save | Changes reflected in DB and UI | Medium | Minor |
| US-07 | Password reset flow | 1. Request reset 2. Follow link 3. Set new password | Password updated, user notified | Medium | Major |
| US-08 | Unauthorized access to admin panel | 1. Login as user 2. Access /admin | Access denied, redirected | High | Major |
| US-09 | User views own bookings | 1. Login 2. Go to bookings | Only their bookings shown | High | Major |
| US-10 | User deleted by admin | 1. Admin deletes user | User removed, cannot login | High | Major |

### Professionals Module
| Test Case ID | Scenario | Steps | Expected Result | Priority | Severity |
|--------------|----------|-------|----------------|----------|----------|
| PR-01 | Admin approves professional | 1. Admin reviews pending professional 2. Click approve | Status changes to 'Approved', professional notified | High | Major |
| PR-02 | Admin rejects professional | 1. Admin rejects application | Status changes to 'Rejected', professional notified | High | Major |
| PR-03 | Professional deactivated by admin | 1. Admin deactivates professional | Professional cannot login, status updated | High | Major |
| PR-04 | Professional updates profile | 1. Login as professional 2. Edit profile | Changes saved, reflected in UI | Medium | Minor |
| PR-05 | Professional views assigned bookings | 1. Login 2. View dashboard | Only their bookings shown | High | Major |
| PR-06 | Search professionals by name/phone | 1. Use search bar | Results filtered as per input | Medium | Minor |
| PR-07 | Filter professionals by status | 1. Use status filter | Only matching professionals shown | Medium | Minor |
| PR-08 | Professional cannot access admin panel | 1. Login as professional 2. Access /admin | Access denied | High | Major |
| PR-09 | Professional receives booking notification | 1. Booking assigned | Notification sent | Medium | Minor |
| PR-10 | Professional earnings calculation | 1. Complete bookings 2. View earnings | Earnings match completed bookings | Medium | Major |

### Services Management
| Test Case ID | Scenario | Steps | Expected Result | Priority | Severity |
|--------------|----------|-------|----------------|----------|----------|
| SV-01 | Admin adds new service | 1. Login as admin 2. Add service | Service appears in user app | High | Major |
| SV-02 | Admin updates service details | 1. Edit service 2. Save | Changes reflected for users | High | Major |
| SV-03 | User sees only active services | 1. Deactivate service 2. View as user | Inactive services hidden | High | Major |
| SV-04 | Duplicate service name | 1. Add service with existing name | Error shown, not added | Medium | Minor |
| SV-05 | Service deletion | 1. Delete service | Service removed from all views | High | Major |
| SV-06 | Service-category mapping | 1. Assign service to category | Service appears under correct category | Medium | Minor |
| SV-07 | Service search | 1. Search for service | Results filtered | Medium | Minor |
| SV-08 | Service booking after deactivation | 1. Deactivate service 2. Try booking | Booking blocked, error shown | High | Major |
| SV-09 | Admin views all services | 1. Open services module | All services listed | Medium | Minor |
| SV-10 | Service image upload | 1. Add/edit service image | Image displays correctly | Medium | Minor |

---

## 🔍 Scenario-Based Interview Questions
1. If booking fails after payment, what will you test?
2. If admin updates a service but user sees old data, why?
3. If two users book the same slot, what will you test?
4. If a professional is deactivated but still receives bookings, what’s wrong?
5. If user cannot reset password, what will you check?
6. If booking status is not updating in UI, what will you debug?
7. If notifications are not sent to professionals, what will you check?
8. If user sees another user’s bookings, what’s the root cause?
9. If payment is deducted but booking not created, what’s your approach?
10. If service search is slow, how will you optimize?
11. If admin cannot approve a professional, what will you check?
12. If booking history is empty for a user with bookings, what’s the issue?
13. If booking status is inconsistent between admin and user, what will you test?
14. If API returns 500 on booking, what’s your debug plan?
15. If user is able to access admin panel, what’s the risk?
16. If booking slot is double-booked, what’s the fix?
17. If service images are not loading, what will you check?
18. If user is not receiving emails, what’s your debug plan?
19. If booking cancellation is not processed, what will you check?
20. If professional’s earnings are incorrect, what’s your approach?
21. If user cannot login after registration, what’s the checklist?
22. If booking is created but not visible to professional, what’s the cause?

---

## 🔍 API Testing Scenarios
- Validate all request/response fields match backend DTOs.
- Test all status codes: 200, 201, 400, 401, 403, 404, 409, 500.
- Test error messages for invalid input (e.g., missing required fields).
- Test edge cases: empty lists, null values, large payloads.
- Test unauthorized access (no/invalid token).
- Test forbidden access (wrong role).
- Test concurrency: two users booking same slot.
- Test idempotency: repeated requests (e.g., double booking/cancellation).
- Test pagination and filtering (if supported).
- Test partial updates (PATCH) for professionals/services.
- Test soft delete: deactivated users/professionals/services not returned.
- Test data integrity after updates (e.g., status, verification).
- Test rollback on failure (e.g., payment success but booking fail).
- Test response time and API performance under load.

---

## 🔍 Real-Time Bug Scenarios
| Bug Scenario | Root Cause | How to Debug |
|--------------|------------|--------------|
| Booking created but payment failed | Payment callback not handled atomically | Check transaction handling, logs, rollback logic |
| User sees old service data after update | Caching not invalidated | Check cache headers, API cache, client cache |
| Double booking for same slot | No locking or slot check in DB | Check DB constraints, add atomic check |
| Professional receives bookings after deactivation | Status not checked in assignment logic | Review assignment code, add status check |
| User cannot login after password reset | Token not invalidated, or hash mismatch | Check reset flow, token expiry, password hashing |
| Booking status not updating in UI | WebSocket/event not triggered, or polling broken | Check frontend event handling, backend push |
| Notifications not sent | Email/SMS queue failure | Check notification logs, queue status |
| Service image not loading | Wrong URL or missing file | Check image upload, storage path, URL mapping |
| Booking cancellation not processed | Status update fails, or refund logic broken | Check cancellation API, payment gateway logs |
| Admin cannot approve professional | API permission or validation error | Check API logs, role checks, validation errors |
| User sees another user’s data | Broken auth or missing user filter | Check API filters, session, auth middleware |
| Booking history empty | Query filter or join issue | Check DB query, joins, user ID filter |
| API returns 500 on booking | Unhandled exception | Check logs, add error handling, validate input |
| Professional’s earnings incorrect | Calculation bug or missing bookings | Check earnings logic, booking status filter |

---

## 🔍 Project Explanation (Interview-Ready)
**Project:** Urban Company–like Marketplace Platform

**Architecture:**
- Frontend: React (Vite), modular SPA, REST API integration
- Backend: ASP.NET Core Web API, layered architecture (Controllers, Services, Data, DTOs)
- Database: SQL Server, Entity Framework Core
- Auth: JWT-based, role-based access (User, Admin, Professional)
- Deployment: (describe if cloud/on-prem, e.g., Azure, Docker, IIS)

**Modules:**
- User Website: Service discovery, booking, payments, profile
- Admin Panel: Manage bookings, users, professionals, services
- Professionals: Dashboard, booking management, earnings
- Services: CRUD, category mapping, availability

**My Role:**
- Full-stack developer (or specify: backend/frontend/QA lead)
- Designed and implemented core modules
- Integrated payment gateway, notifications
- Led API and UI integration
- Wrote automated and manual test cases

**Challenges Faced:**
- Preventing double bookings under concurrency
- Ensuring real-time status updates (bookings, professionals)
- Handling payment failures and rollbacks
- Managing role-based security and data privacy
- Optimizing API performance for large data sets

**How I Solved Them:**
- Used DB-level constraints and atomic transactions for bookings
- Implemented WebSocket/polling for real-time updates
- Added robust error handling and compensation logic for payments
- Applied strict role checks and DTO filtering
- Used pagination, indexing, and caching for performance
