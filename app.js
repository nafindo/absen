const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbySMzB3SsqaMqJITxhXu1eWorAB_I5BboEcqNcncwLfSo4Iu_vDvGu50rth3IM6g2I/exec';

let currentUser = null; // Menyimpan data user yang login

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Fungsi Helper API ---
    async function apiCall(action, payload) {
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8', // Hindari CORS preflight di GAS
                },
                body: JSON.stringify({ action: action, payload: payload })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, message: 'Koneksi ke server gagal atau terputus.' };
        }
    }

    // --- Login Logic ---
    const loginForm = document.getElementById('login-form');
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    const userSelect = loginForm.querySelector('select');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userId = userSelect.value;
        if(!userId) return alert('Silakan pilih nama karyawan terlebih dahulu.');

        // Loading state
        const btn = loginForm.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Memverifikasi...';
        btn.disabled = true;

        // Panggil API Login
        const result = await apiCall('login', { userId: userId });

        if (result.success) {
            currentUser = result.user;
            
            // Update UI dengan info user dari backend
            document.querySelector('.user-details h3').textContent = currentUser.nama;
            document.querySelector('.user-details p').textContent = currentUser.jabatan + ' - ' + currentUser.namaToko;
            
            // Set image placeholder with initials
            const avatarImg = document.querySelector('.avatar');
            avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.nama)}&background=0D8ABC&color=fff`;

            // Ganti layar
            loginScreen.classList.remove('active');
            mainApp.classList.add('active');
            
            // Re-trigger animations in main app
            const animatedElements = mainApp.querySelectorAll('.animate-slide-up');
            animatedElements.forEach(el => {
                el.style.animation = 'none';
                el.offsetHeight; /* trigger reflow */
                el.style.animation = null; 
            });
        } else {
            alert('Login gagal: ' + result.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });

    // --- Bottom Navigation Logic ---
    const navItems = document.querySelectorAll('.nav-item');
    const navFab = document.querySelector('.nav-fab');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(targetId) {
        // Update Tabs
        tabContents.forEach(tab => {
            if (tab.id === targetId) {
                tab.classList.add('active');
                // Re-trigger animations
                const animatedElements = tab.querySelectorAll('.animate-slide-up');
                animatedElements.forEach(el => {
                    el.style.animation = 'none';
                    el.offsetHeight; 
                    el.style.animation = null; 
                });
            } else {
                tab.classList.remove('active');
            }
        });

        // Update Nav Items
        navItems.forEach(item => {
            if (item.dataset.target === targetId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Reset FAB animation if not active
        if (targetId === 'tab-absensi') {
            navFab.style.animation = 'none';
        } else {
            navFab.style.animation = 'pulse 2s infinite';
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            switchTab(item.dataset.target);
        });
    });

    navFab.addEventListener('click', () => {
        switchTab(navFab.dataset.target);
    });

    // --- Absensi Actions Logic ---
    const btnMasuk = document.getElementById('btn-absen-masuk');
    const btnPulang = document.getElementById('btn-absen-pulang');

    btnMasuk.addEventListener('click', async () => {
        if (!currentUser) return alert('Session expire, silakan login ulang.');

        const originalText = btnMasuk.innerHTML;
        btnMasuk.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Mengirim Data...';
        btnMasuk.disabled = true;
        
        // Mock koordinat GPS (Bisa diganti dengan navigator.geolocation)
        const lat = -6.2088; 
        const lng = 106.8456;
        
        // Mock Foto (Kosong untuk sementara)
        const photoBase64 = "";

        const payload = {
            idKaryawan: currentUser.idKaryawan,
            nama: currentUser.nama,
            idToko: currentUser.idToko,
            namaToko: currentUser.namaToko,
            lat: lat,
            lng: lng,
            fotoBase64: photoBase64
        };

        const result = await apiCall('absenMasuk', payload);

        if (result.success) {
            btnMasuk.style.display = 'none';
            btnPulang.style.display = 'inline-flex';
            btnMasuk.disabled = false;
            btnMasuk.innerHTML = originalText;
            
            // Update Card Shift Status in Beranda
            const shiftStatus = document.querySelector('.shift-location');
            if(shiftStatus) {
                shiftStatus.innerHTML = '<i class="bi bi-record-circle text-success"></i> Sedang Bekerja (Masuk ' + result.jamMasuk + ')';
            }
            
            alert('Absen Masuk Berhasil!');
            switchTab('tab-beranda'); 
        } else {
            alert('Absen Gagal: ' + result.message);
            btnMasuk.innerHTML = originalText;
            btnMasuk.disabled = false;
        }
    });

    btnPulang.addEventListener('click', async () => {
        if (!currentUser) return alert('Session expire, silakan login ulang.');

        const originalText = btnPulang.innerHTML;
        btnPulang.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Mengirim Data...';
        btnPulang.disabled = true;
        
        const payload = {
            idKaryawan: currentUser.idKaryawan,
            lat: -6.2088,
            lng: 106.8456,
            fotoBase64: "" // Base64 foto
        };

        const result = await apiCall('absenPulang', payload);

        if (result.success) {
            btnPulang.style.display = 'none';
            // btnMasuk.style.display = 'inline-flex'; // Sembunyikan jika sudah pulang
            
            const shiftStatus = document.querySelector('.shift-location');
            if(shiftStatus) {
                shiftStatus.innerHTML = '<i class="bi bi-check-circle-fill text-success"></i> Selesai (Pulang ' + result.jamPulang + ')';
            }
            
            alert('Absen Pulang Berhasil! Terima kasih.');
            switchTab('tab-beranda');
        } else {
            alert('Absen Gagal: ' + result.message);
            btnPulang.innerHTML = originalText;
            btnPulang.disabled = false;
        }
    });

});

// Spinner animation class
const style = document.createElement('style');
style.innerHTML = `
.spin {
    animation: spin 1s linear infinite;
}
@keyframes spin {
    100% { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);
