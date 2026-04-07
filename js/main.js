// Memanggil library Supabase langsung dari internet (CDN)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// TODO: Ganti dengan URL dan Kunci dari Dashboard Supabase milikmu
const supabaseUrl = 'https://otxxqvsryhumqewahnxt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90eHhxdnNyeWh1bXFld2Fobnh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NjA1NzksImV4cCI6MjA5MTEzNjU3OX0.EzNVPlfUT9U7Cg7yUJ5eo4IeQrymdVmIVpIP-LzMI0A'
const supabase = createClient(supabaseUrl, supabaseKey)

// Fungsi utilitas untuk memformat angka menjadi Rupiah (Rp 10.000)
const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
};

// Fungsi untuk menentukan warna latar belakang ikon dompet
const getWalletColor = (colorCode) => {
    const colors = {
        'blue': 'bg-blue-600',
        'green': 'bg-green-500',
        'emerald': 'bg-emerald-500',
        'default': 'bg-gray-500'
    };
    return colors[colorCode] || colors['default'];
};

// Fungsi utama menarik dan menampilkan data dompet
async function renderWalletsAndBalance() {
    try {
        const { data: wallets, error } = await supabase.from('wallets').select('*');
        if (error) throw error;

        let totalBalance = 0;
        let walletsHTML = '';

        // Looping (perulangan) untuk setiap dompet yang ditemukan di database
        wallets.forEach(wallet => {
            // 1. Tambahkan saldo dompet ini ke Total Kekayaan
            totalBalance += Number(wallet.balance);

            // 2. Buat elemen HTML (Card) untuk dompet ini
            const initial = wallet.wallet_name.substring(0, 3).toUpperCase();
            const bgColorClass = getWalletColor(wallet.icon_color);

            walletsHTML += `
            <div class="flex items-center gap-3 bg-white/20 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-2xl flex-shrink-0 snap-start">
                <div class="w-8 h-8 ${bgColorClass} rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white/30">
                    ${initial}
                </div>
                <div>
                    <p class="text-blue-100 text-[10px] uppercase tracking-wider">${wallet.wallet_type}</p>
                    <p class="text-white text-sm font-bold">${formatRupiah(wallet.balance)}</p>
                </div>
            </div>`;
        });

        // Suntikkan hasil kalkulasi dan HTML ke layar
        document.getElementById('current-balance').innerText = formatRupiah(totalBalance);
        document.getElementById('wallets-container').innerHTML = walletsHTML;

    } catch (error) {
        console.error("Gagal memuat data dompet:", error.message);
    }
}

// Fungsi untuk memformat tanggal (Contoh: Sun 02, 10:15 AM)
const formatTransactionDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
        weekday: 'short', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    }).replace('.', ':');
};

async function renderTransactions() {
    try {
        // Ambil data transaksi terbaru (limit 10)
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .order('transaction_date', { ascending: false })
            .limit(10);

        if (error) throw error;

        let transactionsHTML = '';
        let todayExpenseTotal = 0;
        const today = new Date().toISOString().split('T')[0];

        transactions.forEach(trx => {
            const isExpense = trx.transaction_type === 'expense';
            const amountFormatted = formatRupiah(trx.amount);
            
            // Hitung total pengeluaran khusus hari ini
            const trxDate = new Date(trx.transaction_date).toISOString().split('T')[0];
            if (isExpense && trxDate === today) {
                todayExpenseTotal += Number(trx.amount);
            }

            // Tentukan warna dan ikon berdasarkan tipe
            const iconClass = isExpense ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600';
            const rotateClass = isExpense ? '-rotate-45' : 'rotate-45';
            const amountColor = isExpense ? 'text-red-500 bg-red-50' : 'text-green-600 bg-green-50';
            const symbol = isExpense ? '-' : '+';
            const iconPath = isExpense 
                ? 'M5 10l7-7m0 0l7 7m-7-7v18' // Panah Atas (untuk pengeluaran/out)
                : 'M19 14l-7 7m0 0l-7-7m7 7V3'; // Panah Bawah (untuk pemasukan/in)

            transactionsHTML += `
            <div class="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-50">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 ${iconClass} rounded-xl flex items-center justify-center">
                        <svg class="w-6 h-6 transform ${rotateClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}"/>
                        </svg>
                    </div>
                    <div>
                        <h4 class="font-bold text-sm text-gray-900">${trx.title}</h4>
                        <p class="text-xs text-gray-400 mt-0.5">${formatTransactionDate(trx.transaction_date)}</p>
                    </div>
                </div>
                <span class="font-bold text-sm ${amountColor} px-2 py-1 rounded-md">
                    ${symbol} ${amountFormatted}
                </span>
            </div>`;
        });

        // Update UI
        document.getElementById('transactions-container').innerHTML = transactionsHTML;
        document.getElementById('today-expense').innerText = formatRupiah(todayExpenseTotal);

    } catch (error) {
        console.error("Gagal memuat transaksi:", error.message);
    }
}



// --- LOGIKA MODAL BOTTOM SHEET & INSERT TRANSAKSI ---

const modal = document.getElementById('add-trx-modal');
const backdrop = document.getElementById('modal-backdrop');
const sheet = document.getElementById('modal-sheet');
const fabButton = document.getElementById('fab-button'); // Pastikan ID ini ada di HTML FAB-mu
const addTrxForm = document.getElementById('add-trx-form');
const walletSelect = document.getElementById('trx-wallet');
const categorySelect = document.getElementById('trx-category');

// ID User Dummy kita (Dari skrip SQL sebelumnya)
const USER_ID = '11111111-1111-1111-1111-111111111111'; 

// Fungsi Buka Modal
const openModal = () => {
    modal.classList.remove('hidden');
    // Sedikit jeda agar animasi CSS Tailwind bekerja
    setTimeout(() => {
        backdrop.classList.remove('opacity-0');
        sheet.classList.remove('translate-y-full');
    }, 10);
};

// Fungsi Tutup Modal
const closeModal = () => {
    backdrop.classList.add('opacity-0');
    sheet.classList.add('translate-y-full');
    setTimeout(() => {
        modal.classList.add('hidden');
        addTrxForm.reset(); // Kosongkan form setelah ditutup
    }, 300);
};

// Pasang event listener untuk Buka/Tutup
if (fabButton) fabButton.addEventListener('click', openModal);
backdrop.addEventListener('click', closeModal);

// Fungsi untuk mengisi pilihan Dropdown Dompet
async function populateWalletSelect() {
    const { data: wallets } = await supabase.from('wallets').select('id, wallet_name');
    if (wallets) {
        walletSelect.innerHTML = wallets.map(w => `<option value="${w.id}">${w.wallet_name}</option>`).join('');
    }
}

// Fungsi Submit Form (Insert Data ke Supabase)
addTrxForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Cegah halaman reload
    
    const submitBtn = addTrxForm.querySelector('button[type="submit"]');
    submitBtn.innerText = 'Menyimpan...';

    const amount = document.getElementById('trx-amount').value;
    const title = document.getElementById('trx-title').value;
    const type = document.querySelector('input[name="trx_type"]:checked').value;
    const walletId = walletSelect.value;
    const categoryId = categorySelect.value;

    try {
        // 1. Simpan baris transaksi baru
        const { error: trxError } = await supabase.from('transactions').insert([
            {
                user_id: USER_ID,
                wallet_id: walletId,
                category_id: categoryId,
                amount: amount,
                transaction_type: type,
                title: title,
                // category_id dikosongkan sementara, bisa kita urus nanti
            }
        ]);
        if (trxError) throw trxError;

        // 2. Update saldo dompet terkait (+ atau -)
        const { data: currentWallet } = await supabase.from('wallets').select('balance').eq('id', walletId).single();
        const currentBalance = Number(currentWallet.balance);
        const newBalance = type === 'expense' ? currentBalance - Number(amount) : currentBalance + Number(amount);
        
        await supabase.from('wallets').update({ balance: newBalance }).eq('id', walletId);

        // 3. Sukses! Tutup modal dan refresh data di layar
        closeModal();
        renderWalletsAndBalance();
        renderTransactions();

    } catch (error) {
        alert("Gagal menyimpan transaksi: " + error.message);
    } finally {
        submitBtn.innerText = 'Simpan Data';
    }
});

async function populateCategorySelect() {
    // Mengambil kategori sesuai tipe (income/expense) bisa dikembangkan nanti, 
    // sekarang kita ambil semua dulu.
    const { data: categories } = await supabase
        .from('categories')
        .select('id, name, type');
        
    if (categories) {
        categorySelect.innerHTML = categories.map(c => 
            `<option value="${c.id}">${c.name} (${c.type === 'income' ? 'Masuk' : 'Keluar'})</option>`
        ).join('');
    }
}

async function renderSubscriptions() {
    try {
        const { data: subs, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('is_active', true)
            .order('next_due_date', { ascending: true });

        if (error) throw error;

        let subsHTML = '';
        const today = new Date();

        subs.forEach(sub => {
            const dueDate = new Date(sub.next_due_date);
            // Menghitung selisih hari
            const diffTime = dueDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Logika tampilan: Jika < 3 hari beri warna indigo, jika lebih beri warna putih
            const isUrgent = diffDays <= 3;
            const cardClass = isUrgent 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-white border border-gray-100 text-gray-800 shadow-sm';
            const textMuted = isUrgent ? 'text-indigo-200' : 'text-gray-500';
            const badgeClass = isUrgent ? 'bg-indigo-500/50' : 'bg-gray-100 text-gray-600';

            subsHTML += `
            <div class="min-w-[140px] ${cardClass} rounded-2xl p-4 snap-start flex-shrink-0 relative">
                <div class="w-8 h-8 ${isUrgent ? 'bg-white/20' : 'bg-gray-100'} rounded-lg flex items-center justify-center mb-6 font-bold text-xl">
                    ${sub.service_name.charAt(0)}
                </div>
                <h4 class="font-semibold text-sm">${sub.service_name}</h4>
                <p class="${textMuted} text-[11px] font-semibold my-1">${formatRupiah(sub.amount)}</p>
                <div class="mt-2 ${badgeClass} inline-block px-2 py-1 rounded text-[10px] font-medium">
                    ${diffDays} hari lagi
                </div>
            </div>`;
        });

        document.getElementById('subscriptions-container').innerHTML = subsHTML;

    } catch (error) {
        console.error("Gagal memuat langganan:", error.message);
    }
}

// Fungsi untuk memanggil AI Penasihat Keuangan
async function renderAIAnalysis() {
    const aiTextElement = document.getElementById('ai-analysis-text');
    aiTextElement.innerText = "AI sedang membaca pola keuanganmu...";

    try {
        // Panggil server Python dengan mengirimkan ID User
        const response = await fetch(`http://127.0.0.1:8000/api/analyze-spending?user_id=${USER_ID}`);
        
        if (!response.ok) throw new Error("Gagal mengambil analisis");
        
        const data = await response.json();
        
        // Tampilkan pesan gaul dari Gemini di banner oranye
        aiTextElement.innerText = data.message;
    } catch (error) {
        console.error("AI Analysis error:", error);
        aiTextElement.innerText = "Catat semua pengeluaranmu agar keuanganmu tetap aman!";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderWalletsAndBalance();
    renderTransactions();
    populateWalletSelect();
    populateCategorySelect();
    renderSubscriptions();
    renderAIAnalysis(); // <--- TAMBAHKAN INI AGAR AI LANGSUNG BERBICARA
});


// Hapus atau ganti variabel fabButton yang lama
const btnManualAdd = document.getElementById('btn-manual-add');
const receiptUpload = document.getElementById('receipt-upload');

// 1. Klik tombol (+) di atas -> Buka Form Manual
if (btnManualAdd) {
    btnManualAdd.addEventListener('click', openModal);
}

// 2. Klik FAB ungu -> Langsung otomatis memicu receiptUpload (karena HTML-nya menggunakan tag <label for="...">)
// Dan saat gambar dipilih, langsung tembak ke Python API
if (receiptUpload) {
    receiptUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. TANGKAP ELEMEN LOADING
        const loadingOverlay = document.getElementById('loading-overlay');
        
        // 2. MUNCULKAN LOADING OVERLAY
        loadingOverlay.classList.remove('hidden');
        loadingOverlay.classList.add('flex');

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Tembak API Python
            const response = await fetch('http://127.0.0.1:8000/api/scan-receipt', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error("Server gagal memproses");
            
            const data = await response.json();

            // 3. SEMBUNYIKAN LOADING SEBELUM MUNCULKAN MODAL
            loadingOverlay.classList.add('hidden');
            loadingOverlay.classList.remove('flex');

            // Buka Modal & Isi Datanya
            openModal();
            document.getElementById('trx-amount').value = data.amount || '';
            document.getElementById('trx-title').value = data.title || '';
            document.querySelector('input[value="expense"]').checked = true;

            // Reset input file agar gambar yang sama bisa di-upload lagi jika form ditutup
            receiptUpload.value = '';

        } catch (error) {
            console.error("Gagal scan:", error);
            // Sembunyikan loading jika gagal
            loadingOverlay.classList.add('hidden');
            loadingOverlay.classList.remove('flex');
            receiptUpload.value = '';
            
            // Munculkan peringatan ke user
            alert("Terjadi kesalahan saat memindai struk. Silakan coba lagi.");
        }
    });
}