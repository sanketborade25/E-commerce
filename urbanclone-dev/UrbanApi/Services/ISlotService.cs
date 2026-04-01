using UrbanApi.Dto;

namespace UrbanApi.Services
{
    public interface ISlotService
    {
        Task<List<SlotDto>> GetAvailableSlotsAsync(Guid professionalId, DateTime date, CancellationToken ct);
        Task<SlotReservationResult> TryReserveSlotAsync(Guid professionalId, DateTime scheduledAt, CancellationToken ct);
    }
}
