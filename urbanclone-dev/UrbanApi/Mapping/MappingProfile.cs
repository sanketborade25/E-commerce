using AutoMapper;
using UrbanApi.Dto;
using UrbanApi.Models;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace UrbanApi.Mapping
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // City
            CreateMap<City, CityDto>().ReverseMap();
            CreateMap<CityCreateDto, City>();

            // Category
            CreateMap<Category, CategoryDto>().ReverseMap();
            CreateMap<CategoryCreateDto, Category>();

            // Service
            CreateMap<Service, ServiceDto>().ReverseMap();
            CreateMap<ServiceCreateDto, Service>();

            // ServiceOption
            CreateMap<ServiceOption, ServiceOptionDto>().ReverseMap();
            CreateMap<ServiceOptionCreateDto, ServiceOption>();

            // User
            CreateMap<User, UserDto>().ReverseMap();
            CreateMap<UserCreateDto, User>();

            // Professional
            CreateMap<Professional, ProfessionalDto>().ReverseMap();
            CreateMap<ProfessionalCreateDto, Professional>();

            // Address
            CreateMap<Address, AddressDto>().ReverseMap();
            CreateMap<AddressCreateDto, Address>();

            // Booking & BookingItem
            CreateMap<Booking, BookingDto>().ReverseMap();
            CreateMap<BookingCreateDto, Booking>();
            CreateMap<BookingItem, BookingItemDto>().ReverseMap();
            CreateMap<BookingItemCreateDto, BookingItem>();

            // Payment
            CreateMap<Payment, PaymentDto>().ReverseMap();
            CreateMap<PaymentCreateDto, Payment>();

            // Review
            CreateMap<Review, ReviewDto>().ReverseMap();
            CreateMap<ReviewCreateDto, Review>();

            // Availability
            CreateMap<Availability, AvailabilityDto>().ReverseMap();
            CreateMap<AvailabilityCreateDto, Availability>();

            // Document
            CreateMap<Document, DocumentDto>().ReverseMap();
            CreateMap<DocumentCreateDto, Document>();

            // Coupon
            CreateMap<Coupon, CouponDto>().ReverseMap();
            CreateMap<CouponCreateDto, Coupon>();

            // Notification
            CreateMap<Notification, NotificationDto>().ReverseMap();
            CreateMap<NotificationCreateDto, Notification>();
        }
    }
}
