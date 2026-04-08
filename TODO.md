# Payment Flow Fix - TODO

## Completed (3/8) ✅
- [x] 1. Add forceOutcome param to PaymentProcessDto
- [x] 2. Update PaymentService.SimulatePaymentProcessing() to use forceOutcome  
- [x] 3. Add detailed logging to ProcessPaymentAsync

## Pending:
- [ ] 5. Add frontend error logging in Checkout.jsx (optional)
- [ ] 6. Test success scenario (force=always-success)
- [ ] 7. Test failure scenario (force=always-fail) 
- [ ] 8. Verify booking states in DB
- [ ] 9. Test retry flow works without duplicates

**Status:** Backend fixes complete ✅ Ready for testing!

**Next:** 
1. Run `dotnet build` in urbanclone-dev/UrbanApi/
2. Test API: POST /api/Payments/process with `"forceOutcome": "always-success"`
3. Check logs in backend-out.log
