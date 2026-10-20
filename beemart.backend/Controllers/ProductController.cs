using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using beemart.api.Data;

namespace beemart.api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly BeeMartDbContext _context;

        public ProductController(BeeMartDbContext context)
        {
            _context = context;
        }
        [HttpGet("search")]
        public async Task<IActionResult> SearchProducts([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return Ok(new List<object>());
            }

            var products = await _context.MsProducts
                .AsNoTracking()
                .Where(p => p.Stsrc == true && p.Name.ToLower().Contains(query.ToLower()))
                .Take(10)
                .Select(p => new
                {
                    p.IdProduct,
                    p.Name,
                    p.Weight,
                    p.Stock,
                    p.Price,
                    p.Discount
                })
                .ToListAsync();

            return Ok(products);
        }
        [HttpGet("payment-methods")]
        public async Task<IActionResult> GetPaymentMethods()
        {
            var methods = await _context.LtPaymentMethods
                .Where(m => m.Stsrc == true)
                .Select(m => new
                {
                    m.IdPaymentMethod,
                    m.MethodName
                })
                .ToListAsync();

            return Ok(methods);
        }
    }
}