using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace UrbanApi.Filters
{
    public class SwaggerAuthorizeOperationFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            var hasAuthorize =
                context.MethodInfo.GetCustomAttributes(typeof(AuthorizeAttribute), true).Any() ||
                context.MethodInfo.DeclaringType?.GetCustomAttributes(typeof(AuthorizeAttribute), true).Any() == true;

            var hasAllowAnonymous =
                context.MethodInfo.GetCustomAttributes(typeof(AllowAnonymousAttribute), true).Any();

            if (!hasAuthorize || hasAllowAnonymous)
                return;

            operation.Security ??= new List<OpenApiSecurityRequirement>();

            var requirement = new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecuritySchemeReference(
                        "Bearer",
                        new OpenApiDocument(),
                        null
                    ),
                    new List<string>()
                }
            };

            operation.Security.Add(requirement);
        }
    }
}
