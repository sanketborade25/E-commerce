using System;
using System.Threading;
using System.Threading.Tasks;

namespace UrbanApi.Services
{
    public interface INotificationService
    {
        Task CreateCustomerNotificationAsync(Guid userId, string title, string message, CancellationToken ct = default);
    }
}

