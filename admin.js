// Gunakan endpoint yang sama dengan PWA Karyawan
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbySMzB3SsqaMqJITxhXu1eWorAB_I5BboEcqNcncwLfSo4Iu_vDvGu50rth3IM6g2I/exec';

// API Fetch Wrapper
async function fetchAdminAPI(action, payload = {}) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: action, payload: payload })
        });
        return await response.json();
    } catch(e) {
        console.error('API Request Failed:', e);
        return { success: false, message: 'Koneksi ke server gagal.' };
    }
}

// Format waktu
function updateClock() {
    const d = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' };
    document.getElementById('current-time').textContent = d.toLocaleString('id-ID', options) + ' WIB';
}

// Muat Dashboard
async function loadDashboard() {
    const content = document.getElementById('page-content');
    content.innerHTML = `
        <div style="text-align:center; padding: 100px;">
            <i class="bi bi-arrow-repeat" style="font-size: 3rem; color: #0D8ABC; animation: spin 1s linear infinite; display: inline-block;"></i>
            <p style="margin-top: 16px; color: #64748B;">Menyinkronkan data dengan server...</p>
        </div>
    `;
    
    const data = await fetchAdminAPI('getDashboard');
    
    if(!data.success) {
        content.innerHTML = `<div style="text-align:center; padding: 50px; color: #FF3B30;"><i class="bi bi-exclamation-triangle" style="font-size:3rem;"></i><p>Gagal memuat data dari server.</p></div>`;
        return;
    }

    // Generate tabel HTML
    let rowsHtml = '';
    data.absensiHariIni.forEach(row => {
        let badgeClass = row.status.toLowerCase() === 'ontime' ? 'ontime' : (row.status.toLowerCase() === 'telat' ? 'telat' : 'alpa');
        rowsHtml += `<tr>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(row.nama)}&background=random" style="width:30px; border-radius:50%">
                    ${row.nama}
                </div>
            </td>
            <td>${row.toko}</td>
            <td>${row.shift}</td>
            <td>${row.jamMasuk || '-'}</td>
            <td>${row.jamPulang || '-'}</td>
            <td><span class="badge ${badgeClass}">${row.status}</span></td>
        </tr>`;
    });

    content.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <p>Total Hadir Hari Ini</p>
                <h3>${data.stats.hadir}</h3>
            </div>
            <div class="stat-card">
                <p>Karyawan Terlambat</p>
                <h3 style="color: var(--warning)">${data.stats.telat}</h3>
            </div>
            <div class="stat-card">
                <p>Belum Absen / Alpa</p>
                <h3 style="color: var(--danger)">${data.stats.alpa}</h3>
            </div>
            <div class="stat-card">
                <p>Total Karyawan Aktif</p>
                <h3>${data.stats.total}</h3>
            </div>
        </div>

        <div class="table-container">
            <div class="table-header">
                <h3>Log Absensi Hari Ini</h3>
                <button style="padding: 8px 16px; background:var(--primary); color:white; border:none; border-radius:8px; cursor:pointer;" onclick="loadDashboard()">
                    <i class="bi bi-arrow-clockwise"></i> Refresh
                </button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Nama Karyawan</th>
                        <th>Toko</th>
                        <th>Shift</th>
                        <th>Jam Masuk</th>
                        <th>Jam Pulang</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="6" style="text-align:center; color:#64748B;">Belum ada data absensi hari ini.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    
    setInterval(updateClock, 1000);
    updateClock();

    // Navigasi Sidebar
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            navItems.forEach(n => n.classList.remove('active'));
            e.currentTarget.classList.add('active');
            
            const target = e.currentTarget.getAttribute('href');
            document.querySelector('.page-title').textContent = e.currentTarget.textContent.trim();
            
            if(target === '#dashboard') {
                loadDashboard();
            } else {
                // Halaman Dummy untuk menu lain (Berdasarkan PRD Phase 2)
                document.getElementById('page-content').innerHTML = `
                    <div class="table-container" style="text-align:center; padding: 100px 20px;">
                        <i class="bi bi-tools" style="font-size: 4rem; color:#CBD5E1; margin-bottom: 20px; display:inline-block;"></i>
                        <h3>Halaman ${e.currentTarget.textContent.trim()}</h3>
                        <p style="color: #64748B; margin-top: 10px; max-width: 400px; margin-left:auto; margin-right:auto;">
                            Modul ini sedang dalam tahap pengembangan (Phase 2). Sesuai rancangan PRD, halaman ini akan segera tersedia.
                        </p>
                    </div>
                `;
            }
        });
    });

    // Muat dashboard pertama kali
    loadDashboard();
});
