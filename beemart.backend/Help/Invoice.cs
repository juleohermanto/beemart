using Microsoft.EntityFrameworkCore;
using beemart.api.Data;

namespace beemart.api.Services
{
    public interface Invoice
    {
        Task<string> GenerateInvoiceNumberAsync(string userId);
    }

    public class InvoiceService : Invoice
    {
        private readonly BeeMartDbContext _db;

        public InvoiceService(BeeMartDbContext db)
        {
            _db = db;
        }

        public async Task<string> GenerateInvoiceNumberAsync(string userId)
        {
               
            //disini saya pakainya GTC+7 sesuai dengan wib aja
            var today = DateTime.UtcNow.AddHours(7);
            var codeDate = today.ToString("ddMMyy");
            var invoicePrefix = $"{userId}{codeDate}";
            var sequence = await _db.TrTransactions
                .AsNoTracking()
                .CountAsync(x => x.InvoiceNo.StartsWith(invoicePrefix));

            return $"{invoicePrefix}{(sequence + 1):D3}";
        }
    }
}