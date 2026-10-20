const API_BASE_URL = "https://localhost:7276/api/v1";

let currentUser = null;

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

    const subTitle = currentUser.role === "Cashier"
        ? `Pencarian Data Transaksi (Hanya Kasir: ${currentUser.username})`
        : `Pencarian Data Transaksi (Menampilkan Semua Kasir)`;
    document.getElementById("historySubtitle").innerText = subTitle;

    document.getElementById("btnSearchHistory").addEventListener("click", () => loadHistoryData(1));
});
async function loadHistoryData(pageNumber = 1) {
    const selectedDate = document.getElementById("inputFilterDate").value;
    if (!selectedDate) {
        alert("Silakan input tanggal terlebih dahulu");
        return;
    }

    let url = `${API_BASE_URL}/Transaction/history?date=${selectedDate}&role=${currentUser.role}&page=${pageNumber}`;
    if (currentUser.role === "Cashier") {
        url += `&idUser=${currentUser.idUser}`;
    }

    try {
        const res = await fetch(url);
        const result = await res.json();
        renderHistoryRows(result);
    } catch (err) {
        alert("Gagal memuat riwayat transaksi");
    }
}

function renderHistoryRows(pagedResult) {
    const tbody = document.getElementById("historyTableBody");
    const paginationContainer = document.getElementById("historyPagination");
    tbody.innerHTML = "";
    paginationContainer.innerHTML = "";

    if (!pagedResult.data || pagedResult.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #888;">Tidak ada data transaksi</td></tr>`;
        return;
    }

    pagedResult.data.forEach(item => {
        const d = new Date(item.transactionDate);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        const formattedDate = `${yyyy}-${mm}-${dd} ${hh}:${min}`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.invoiceNo}</td>
            <td>${formattedDate}</td>
            <td>${item.cashierName}</td>
            <td>${item.totalItems}</td>
            <td>${item.paymentMethod}</td>
            <td>${convertRp(item.totalPrice)}</td>
        `;
        tbody.appendChild(tr);
    });

    for (let p = 1; p <= pagedResult.totalPages; p++) {
        const pageBtn = document.createElement("button");
        pageBtn.type = "button";
        pageBtn.className = "page-btn";
        pageBtn.innerText = p;

        if (p === pagedResult.currentPage) {
            pageBtn.style.backgroundColor = "#0d47a1";
        }

        pageBtn.addEventListener("click", () => loadHistoryData(p));
        paginationContainer.appendChild(pageBtn);
    }
}