using Microsoft.EntityFrameworkCore;
using UrbanApi.Data;
using UrbanApi.Dto;

namespace UrbanApi.Services
{
    public class SlotService : ISlotService
    {
        private static readonly string[] NonBookableStatuses = { "REJECTED", "CANCELLED" };

        private readonly AppDbContext _db;
        public SlotService(AppDbContext db)
        {
            _db = db;
        }

        public async Task<List<SlotDto>> GetAvailableSlotsAsync(Guid professionalId, DateTime date, CancellationToken ct)
        {
            var dayStart = date.Date;
            var dayEnd = dayStart.AddDays(1);

            var rawSlots = await _db.Availabilities
                .AsNoTracking()
                .Where(a =>
                    a.ProfessionalId == professionalId &&
                    !a.IsDeleted &&
                    a.Status == "available" &&
                    a.StartAt < dayEnd &&
                    a.EndAt > dayStart)
                .OrderBy(a => a.StartAt)
                .Select(a => new SlotDto
                {
                    AvailabilityId = a.Id,
                    ProfessionalId = a.ProfessionalId,
                    Date = a.StartAt.Date,
                    StartAt = a.StartAt,
                    EndAt = a.EndAt,
                    IsRecurring = a.IsRecurring,
                    Status = "available"
                })
                .ToListAsync(ct);

            var bookedTimes = await _db.Bookings
                .AsNoTracking()
                .Where(b =>
                    b.ProfessionalId == professionalId &&
                    !b.IsDeleted &&
                    !NonBookableStatuses.Contains(b.Status.ToUpper()) &&
                    b.ScheduledAt >= dayStart &&
                    b.ScheduledAt < dayEnd)
                .Select(b => b.ScheduledAt)
                .ToListAsync(ct);

            return rawSlots
                .Where(slot => !bookedTimes.Any(bookedAt => bookedAt >= slot.StartAt && bookedAt < slot.EndAt))
                .ToList();
        }

        public async Task<SlotReservationResult> TryReserveSlotAsync(Guid professionalId, DateTime scheduledAt, CancellationToken ct)
        {
            for (var attempt = 0; attempt < 3; attempt++)
            {
                var candidate = await _db.Availabilities
                    .AsNoTracking()
                    .Where(a =>
                        a.ProfessionalId == professionalId &&
                        !a.IsDeleted &&
                        a.Status == "available" &&
                        a.StartAt <= scheduledAt &&
                        a.EndAt > scheduledAt)
                    .OrderBy(a => a.StartAt)
                    .Select(a => new { a.Id, a.StartAt, a.EndAt })
                    .FirstOrDefaultAsync(ct);

                if (candidate == null)
                {
                    return new SlotReservationResult
                    {
                        Success = false,
                        Message = "Selected slot is not available."
                    };
                }

                var affected = 0;
                affected = await _db.Database.ExecuteSqlInterpolatedAsync(
                    $@"UPDATE Availabilities
                       SET Status = 'booked',
                           UpdatedAt = SYSUTCDATETIME()
                       WHERE Id = {candidate.Id}
                         AND ProfessionalId = {professionalId}
                         AND IsDeleted = 0
                         AND Status = 'available'",
                    ct
                );

                if (affected == 1)
                {
                    return new SlotReservationResult
                    {
                        Success = true,
                        AvailabilityId = candidate.Id,
                        StartAt = candidate.StartAt,
                        EndAt = candidate.EndAt,
                        Message = "Slot reserved."
                    };
                }
            }

            return new SlotReservationResult
            {
                Success = false,
                Message = "Selected slot was just booked by another user."
            };
        }
    }
}
