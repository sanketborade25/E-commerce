using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;
using UrbanApi.Data;

var builder = WebApplication.CreateBuilder(args);

// ------------ JWT CONFIG ------------
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection.GetValue<string>("Key") ?? throw new InvalidOperationException("Jwt:Key not found");
var jwtIssuer = jwtSection.GetValue<string>("Issuer");
var jwtAudience = jwtSection.GetValue<string>("Audience");
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

// ------------ AUTHENTICATION / AUTHORIZATION ------------
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
            ClockSkew = TimeSpan.Zero
        };
    });
builder.Services.AddAuthorization();

// ------------ DB CONTEXT ------------
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ------------ AUTOMAPPER ------------
builder.Services.AddAutoMapper(typeof(UrbanApi.Mapping.MappingProfile));

// ------------ CONTROLLERS ------------
builder.Services.AddControllers();

// ------------ SWAGGER (root OpenApi types) ------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "UrbanClone API",
        Version = "v1",
        Description = "Backend API (development)"
    });

    // Avoid schema ID collisions
    c.CustomSchemaIds(type => type.FullName);
    c.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());

    // JWT definition for Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    // Mark [Authorize] endpoints with the Bearer scheme
    c.OperationFilter<UrbanApi.Filters.SwaggerAuthorizeOperationFilter>();
});

// ------------ CORS ------------
const string AllowLocalDev = "AllowLocalDev";
builder.Services.AddCors(options =>
{
    options.AddPolicy(AllowLocalDev, policy =>
    {
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .WithOrigins("http://localhost:4200", "http://localhost:5173", "https://localhost:5173")
              .AllowCredentials();
    });
});

// ------------ BUILD APP ------------
var app = builder.Build();

// ------------ MIDDLEWARE ORDER (CRITICAL) ------------
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "UrbanClone API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseStaticFiles();

app.UseRouting();

app.UseHttpsRedirection();

app.UseCors(AllowLocalDev);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
