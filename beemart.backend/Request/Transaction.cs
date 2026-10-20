namespace beemart.api.Request
{
    public class CartItem
    {
        public string IdProduct { get; set; } = string.Empty;
        public int Qty { get; set; }
    }

    public class CreateTransactionRequest
    {
        public string IdUser { get; set; } = string.Empty;
        public int IdPaymentMethod { get; set; }
        public List<CartItem> Items { get; set; } = new();
    }

    public class TransactionHistoryItem
    {
        public string InvoiceNo { get; set; } = string.Empty;
        public DateTime TransactionDate { get; set; }
        public string CashierName { get; set; } = string.Empty;
        public int TotalItems { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public decimal TotalPrice { get; set; }
    }

    public class PagedHistoryResult
    {
        public int CurrentPage { get; set; }
        public int TotalPages { get; set; }
        public int TotalRecords { get; set; }
        public List<TransactionHistoryItem> Data { get; set; } = new();
    }
}