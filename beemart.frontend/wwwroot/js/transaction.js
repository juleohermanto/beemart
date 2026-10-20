const API_BASE_URL = "https://localhost:7276/api/v1";

let currentUser = null;
let cartItems = [];
let activeProduct = null;

function convertRp(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(amount);
}

document.addEventListener("DOMContentLoaded", () => {
    const session = localStorage.getItem("beemart_user");
    if (!session) return;
    currentUser = JSON.parse(session);

    loadInvoiceNumber();
    loadPaymentMethods();
    setupEventListeners();
});
async function loadInvoiceNumber() {
    try {
        const res = await fetch(`${API_BASE_URL}/Transaction/next-invoice?idUser=${currentUser.idUser}`);
        const data = await res.json();
        document.getElementById("displayInvoiceNo").innerText = `Invoice No: ${data.invoiceNo}`;
    } catch (err) {
        console.error("Gagal invoice", err);
    }
}

async function loadPaymentMethods() {
    try {
        const res = await fetch(`${API_BASE_URL}/Product/payment-methods`);
        const methods = await res.json();
        const select = document.getElementById("selectPaymentMethod");
        select.innerHTML = "";

        methods.forEach(m => {
            const opt = document.createElement("option");
            opt.value = m.idPaymentMethod;
            opt.innerText = m.methodName;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error("Pembayaran error", err);
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById("searchBarangInput");
    searchInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const keyword = searchInput.value.trim();
            if (!keyword) return;

            try {
                const res = await fetch(`${API_BASE_URL}/Product/search?query=${encodeURIComponent(keyword)}`);
                const products = await res.json();
                renderSearchResults(products);
            } catch (err) {
                alert("Gagal melakukan pencarian");
            }
        }
    });

    document.getElementById("btnAddToCart").addEventListener("click", addProductToCart);
    document.getElementById("btnSubmitTransaction").addEventListener("click", submitOrder);
}

function renderSearchResults(products) {
    const wrapper = document.getElementById("searchResultWrapper");
    const tbody = document.getElementById("searchResultTableBody");
    tbody.innerHTML = "";

    if (!products || products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;"></td></tr>`;
        wrapper.style.display = "block";
        return;
    }

    products.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${p.name}</td>
            <td>${p.weight} Kg</td>
            <td>${p.stock}</td>
            <td>${convertRp(p.price)}</td>
            <td>${p.discount}%</td>
            <td><button type="button" class="btn-select">Pilih</button></td>
        `;

        tr.querySelector(".btn-select").addEventListener("click", () => openSelectDialog(p));
        tbody.appendChild(tr);
    });

    wrapper.style.display = "block";
}
function openSelectDialog(prod) {
    activeProduct = prod;
    document.getElementById("selectedProdName").innerText = prod.name;
    document.getElementById("selectedProdPrice").innerText = convertRp(prod.price);
    document.getElementById("selectedProdStock").innerText = prod.stock;
    document.getElementById("inputQty").value = 1;
    document.getElementById("selectedProductBox").style.display = "flex";
}

function addProductToCart() {
    if (!activeProduct) return;

    const qty = parseInt(document.getElementById("inputQty").value, 10);
    if (isNaN(qty) || qty <= 0) {
        alert("Masukkan jumlah kuantitas yang benar");
        return;
    }

    if (qty > activeProduct.stock) {
        alert("Jumlah barang yang dimasukkan melebihi sisa stok");
        return;
    }

    const priceAfterDiscount = activeProduct.price - (activeProduct.price * (activeProduct.discount / 100));
    const subTotal = priceAfterDiscount * qty;

    const existingIndex = cartItems.findIndex(i => i.idProduct === activeProduct.idProduct);
    if (existingIndex > -1) {
        if (cartItems[existingIndex].qty + qty > activeProduct.stock) {
            alert("Jumlah barang yang dimasukkan melebihi sisa stok");
            return;
        }
        cartItems[existingIndex].qty += qty;
        cartItems[existingIndex].subTotal += subTotal;
    } else {
        cartItems.push({
            idProduct: activeProduct.idProduct,
            name: activeProduct.name,
            price: activeProduct.price,
            discount: activeProduct.discount,
            qty: qty,
            subTotal: subTotal
        });
    }

    document.getElementById("selectedProductBox").style.display = "none";
    activeProduct = null;
    renderCart();
}

function renderCart() {
    const tbody = document.getElementById("cartTableBody");
    tbody.innerHTML = "";

    if (cartItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #888;">Tidak ada barang</td></tr>`;
        document.getElementById("displayGrandTotal").innerText = "Total: Rp 0";
        return;
    }

    let grandTotal = 0;
    cartItems.forEach((item, index) => {
        grandTotal += item.subTotal;
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${convertRp(item.price)}</td>
            <td>${item.discount}%</td>
            <td>${item.qty}</td>
            <td>${convertRp(item.subTotal)}</td>
            <td><button type="button" class="btn-delete">Hapus</button></td>
        `;

        tr.querySelector(".btn-delete").addEventListener("click", () => {
            cartItems.splice(index, 1);
            renderCart();
        });

        tbody.appendChild(tr);
    });

    document.getElementById("displayGrandTotal").innerText = `Total: ${convertRp(grandTotal)}`;
}

async function submitOrder() {
    if (cartItems.length === 0) {
        alert("Keranjang belanja kosong");
        return;
    }

    const paymentId = parseInt(document.getElementById("selectPaymentMethod").value, 10);
    const payload = {
        idUser: currentUser.idUser,
        idPaymentMethod: paymentId,
        items: cartItems.map(i => ({ idProduct: i.idProduct, qty: i.qty }))
    };

    try {
        const res = await fetch(`${API_BASE_URL}/Transaction/checkout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        if (!res.ok) {
            alert(result.message || "Gagal transaksi");
            return;
        }

        alert("Transaksi berhasil disubmit");
        cartItems = [];
        renderCart();
        document.getElementById("searchBarangInput").value = "";
        document.getElementById("searchResultWrapper").style.display = "none";
        loadInvoiceNumber();
    } catch (err) {
        alert("Gagal menghubungi server");
    }
}