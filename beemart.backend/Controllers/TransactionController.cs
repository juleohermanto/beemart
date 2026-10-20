using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using beemart.api.Data;
using beemart.api.Models;
using beemart.api.Request;
using beemart.api.Services;
namespace beemart.api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class TransactionController : ControllerBase
    {
        private readonly BeeMartDbContext _context;
        private readonly Invoice _invoice;
        public TransactionController(BeeMartDbContext context, Invoice invoice)
        {
            _context = context;
            _invoice = invoice;
        }
        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CreateTransactionRequest dto)
        {
            if (dto.Items == null || !dto.Items.Any())
            {
                return BadRequest(new { message = "Keranjang belanja masih kosong" });
            }

            var user = await _context.MsUsers.FirstOrDefaultAsync(u => u.IdUser == dto.IdUser);
            if (user == null)
            {
                return BadRequest(new { message = "User tidak valid." });
            }
            var productIds = dto.Items.Select(i => i.IdProduct).ToList();
            var products = await _context.MsProducts
                .Where(p => productIds.Contains(p.IdProduct) && p.Stsrc == true)
                .ToListAsync();

            foreach (var item in dto.Items)
            {
                var prod = products.FirstOrDefault(p => p.IdProduct == item.IdProduct);
                if (prod == null || item.Qty > prod.Stock)
                {
                    return BadRequest(new { message = "Jumlah barang yang dimasukkan melebihi sisa stok" });
                }
            }
            var now = DateTime.Now;
            var datePart = now.ToString("ddMMyy");
            var prefix = $"{user.IdUser}{datePart}";

            var todayTransactionsCount = await _context.TrTransactions
                .CountAsync(t => t.InvoiceNo.StartsWith(prefix));

            var runningNumber = (todayTransactionsCount + 1).ToString("D3");
            var invoiceNo = $"{prefix}{runningNumber}";

            var transactionId = Guid.NewGuid().ToString();
            decimal grandTotal = 0;
            var details = new List<TrTransactionDetail>();

            foreach (var item in dto.Items)
            {
                var prod = products.First(p => p.IdProduct == item.IdProduct);
                var discountAmount = prod.Price * (prod.Discount / 100m);
                var unitPriceAfterDiscount = prod.Price - discountAmount;
                var subTotal = unitPriceAfterDiscount * item.Qty;
                grandTotal += subTotal;
                prod.Stock -= item.Qty;
                prod.Dateup = now;
                prod.Userup = user.Username;

                details.Add(new TrTransactionDetail
                {
                    IdTransactionDetail = Guid.NewGuid().ToString(),
                    IdTransaction = transactionId,
                    IdProduct = prod.IdProduct,
                    Qty = item.Qty,
                    Price = prod.Price,
                    Discount = prod.Discount,
                    SubTotal = subTotal,
                    Stsrc = true,
                    Datein = now,
                    Userin = user.Username
                });
            }

            var transaction = new TrTransaction
            {
                IdTransaction = transactionId,
                InvoiceNo = invoiceNo,
                TransactionDate = now,
                IdUser = user.IdUser,
                IdPaymentMethod = dto.IdPaymentMethod,
                TotalPrice = grandTotal,
                Stsrc = true,
                Datein = now,
                Userin = user.Username
            };

            _context.TrTransactions.Add(transaction);
            _context.TrTransactionDetails.AddRange(details);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Transaksi berhasil", invoiceNo = invoiceNo });
        }
        [HttpGet("history")]
        public async Task<IActionResult> GetHistory(
            [FromQuery] DateTime date,
            [FromQuery] string role,
            [FromQuery] string? idUser = null,
            [FromQuery] int page = 1)
        {
            const int pageSize = 20;
            if (page < 1) page = 1;

            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            var query = _context.TrTransactions
                .AsNoTracking()
                .Include(t => t.IdUserNavigation)
                .Include(t => t.IdPaymentMethodNavigation)
                .Include(t => t.TrTransactionDetails)
                .Where(t => t.Stsrc == true && t.TransactionDate >= startDate && t.TransactionDate < endDate);
            if (role.Equals("Cashier", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrWhiteSpace(idUser))
                {
                    return BadRequest(new { message = "IdUser wajib dikirim untuk role Cashier" });
                }
                query = query.Where(t => t.IdUser == idUser);
            }

            var totalRecords = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalRecords / (double)pageSize);
            var items = await query
                .OrderBy(t => t.TransactionDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new TransactionHistoryItem
                {
                    InvoiceNo = t.InvoiceNo,
                    TransactionDate = t.TransactionDate,
                    CashierName = t.IdUserNavigation.FullName,
                    TotalItems = t.TrTransactionDetails.Sum(d => d.Qty),
                    PaymentMethod = t.IdPaymentMethodNavigation.MethodName,
                    TotalPrice = t.TotalPrice
                })
                .ToListAsync();

            return Ok(new PagedHistoryResult
            {
                CurrentPage = page,
                TotalPages = totalPages == 0 ? 1 : totalPages,
                TotalRecords = totalRecords,
                Data = items
            });
        }
        [HttpGet("next-invoice")]
        public async Task<IActionResult> GetNextInvoice([FromQuery] string idUser)
        {
            if (string.IsNullOrWhiteSpace(idUser))
            {
                return BadRequest(new { message = "Must to write it" });
            }

            var invoiceNo = await _invoice.GenerateInvoiceNumberAsync(idUser);
            return Ok(new { invoiceNo });
        }
    }
}