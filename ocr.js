const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxDyDhOWjdbi1dO9HBbcSEZumOkBGlg2Z4UzJ-YqcirnX7u487kUUOYota52PV-5BlN/exec';

let idKaryawan = '';
let videoStream = null;
let isLocked = false;

document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    idKaryawan = urlParams.get('id');

    if (!idKaryawan) {
        showError("Link tidak valid", "ID Karyawan tidak ditemukan dalam URL.");
        return;
    }

    try {
        const res = await apiRequest('getProfilStatus', { idKaryawan });
        if (!res.success) {
            showError("Akses Ditolak", res.error);
            return;
        }

        if (res.isComplete) {
            showError("Sudah Lengkap", "Profil Anda sudah lengkap dan tidak dapat diubah lagi melalui link ini.");
            return;
        }

        // Show Main Content
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
        
        document.getElementById('lbl-nama').textContent = res.nama || 'Karyawan';
        document.getElementById('inp-nama').value = res.nama || '';
        document.getElementById('inp-jabatan').value = res.jabatan || '';

    } catch (e) {
        showError("Koneksi Gagal", "Gagal menghubungi server. Pastikan internet Anda aktif.");
    }
});

// === OCR CAMERA ===
const video = document.getElementById('camera-feed');
const canvas = document.getElementById('canvas-foto');
const btnStartCamera = document.getElementById('btn-start-camera');
const cameraWrapper = document.getElementById('camera-wrapper');
const btnCapture = document.getElementById('btn-capture');
const previewImg = document.getElementById('foto-ktp-preview');

btnStartCamera.addEventListener('click', async () => {
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        video.srcObject = videoStream;
        cameraWrapper.style.display = 'block';
        btnStartCamera.style.display = 'none';
        previewImg.style.display = 'none';
    } catch (e) {
        alert("Gagal mengakses kamera. Mohon izinkan akses kamera di browser Anda.");
    }
});

btnCapture.addEventListener('click', () => {
    if (!videoStream) return;
    
    // Draw canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Stop camera
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
    
    const base64Img = canvas.toDataURL('image/jpeg', 0.8);
    previewImg.src = base64Img;
    document.getElementById('inp-foto-base64').value = base64Img;
    
    cameraWrapper.style.display = 'none';
    previewImg.style.display = 'block';
    btnStartCamera.style.display = 'block';
    btnStartCamera.textContent = '📸 Ulangi Pindai KTP';

    // Start OCR
    runOCR(base64Img);
});

async function runOCR(base64Img) {
    const loader = document.getElementById('ocr-loading');
    const statusText = document.getElementById('ocr-status-text');
    loader.style.display = 'block';
    statusText.textContent = "Menghubungkan ke Mesin OCR (1/3)...";

    try {
        const worker = await Tesseract.createWorker('ind');
        statusText.textContent = "Membaca teks dari gambar KTP (2/3)...";
        
        const ret = await worker.recognize(base64Img);
        const text = ret.data.text;
        
        statusText.textContent = "Memproses teks (3/3)...";
        await worker.terminate();

        parseKtpText(text);

        loader.style.display = 'none';
    } catch (e) {
        loader.style.display = 'none';
        alert("Gagal membaca teks dari gambar. Anda bisa mengetik manual.");
        console.error(e);
    }
}

function parseKtpText(text) {
    console.log("OCR Result:", text);
    const lines = text.split('\\n').map(l => l.trim()).filter(l => l.length > 2);

    // Regex for NIK
    const nikMatch = text.match(/\\b\\d{16}\\b/);
    if (nikMatch) document.getElementById('inp-nik').value = nikMatch[0];

    // LAKI-LAKI or PEREMPUAN
    if (text.toUpperCase().includes('LAKI')) document.getElementById('inp-jk').value = 'LAKI-LAKI';
    if (text.toUpperCase().includes('PEREMPUAN')) document.getElementById('inp-jk').value = 'PEREMPUAN';

    // Parse specific lines loosely based on Keywords
    lines.forEach(line => {
        let upperLine = line.toUpperCase();
        
        if (upperLine.includes('NAMA') && !upperLine.includes('PROVINSI') && !upperLine.includes('KOTA')) {
            const val = extractValue(line);
            if(val) document.getElementById('inp-nama').value = val;
        }
        else if (upperLine.includes('TEMPAT') || upperLine.includes('TGL LHR')) {
            const val = extractValue(line);
            if (val) {
                const parts = val.split(',');
                if (parts.length > 1) {
                    document.getElementById('inp-tempat-lahir').value = parts[0].trim();
                    document.getElementById('inp-tgl-lahir').value = parts[1].trim();
                } else {
                    document.getElementById('inp-tempat-lahir').value = val;
                }
            }
        }
        else if (upperLine.includes('ALAMAT')) {
            const val = extractValue(line);
            if (val) document.getElementById('inp-alamat').value = val;
        }
        else if (upperLine.includes('RT/RW') || upperLine.includes('RT')) {
            const val = extractValue(line);
            if (val) document.getElementById('inp-rtrw').value = val;
        }
        else if (upperLine.includes('KEL') || upperLine.includes('DESA')) {
            const val = extractValue(line);
            if (val) document.getElementById('inp-desa').value = val;
        }
        else if (upperLine.includes('KECAMATAN') || upperLine.includes('KEC')) {
            const val = extractValue(line);
            if (val) document.getElementById('inp-kecamatan').value = val;
        }
        else if (upperLine.includes('AGAMA')) {
            const val = extractValue(line);
            if (val) document.getElementById('inp-agama').value = val;
        }
        else if (upperLine.includes('STATUS')) {
            const val = extractValue(line);
            if (val) document.getElementById('inp-kawin').value = val;
        }
    });

    // Alert user to check
    alert("Berhasil memindai! Mohon KOREKSI dan pastikan data (NIK, Nama, dll) sudah benar. Komputer bisa saja salah membaca.");
}

function extractValue(line) {
    const idx = line.indexOf(':');
    if (idx !== -1) {
        return line.substring(idx + 1).trim().replace(/[^a-zA-Z0-9 \\-\\/]/g, '');
    }
    // Kadang titik dua tidak terbaca
    const words = line.split(' ');
    if (words.length > 1) {
        return words.slice(1).join(' ').replace(/[^a-zA-Z0-9 \\-\\/]/g, '');
    }
    return "";
}

// === FORM SUBMIT ===
async function submitProfil() {
    // Validations
    const pin = document.getElementById('inp-pin').value;
    const errPin = document.getElementById('pin-error');
    if (pin.length !== 4 || pin.startsWith('0')) {
        errPin.style.display = 'block';
        return;
    } else {
        errPin.style.display = 'none';
    }

    const fields = [
        { id: 'inp-nama', name: 'Nama' },
        { id: 'inp-nohp', name: 'No HP' },
        { id: 'inp-nik', name: 'NIK' },
        { id: 'inp-tempat-lahir', name: 'Tempat Lahir' },
        { id: 'inp-tgl-lahir', name: 'Tgl Lahir' },
        { id: 'inp-jk', name: 'Jenis Kelamin' },
        { id: 'inp-alamat', name: 'Alamat' },
        { id: 'inp-rtrw', name: 'RT/RW' },
        { id: 'inp-desa', name: 'Kel/Desa' },
        { id: 'inp-kecamatan', name: 'Kecamatan' },
        { id: 'inp-agama', name: 'Agama' },
        { id: 'inp-kawin', name: 'Status Kawin' },
        { id: 'inp-nama-darurat', name: 'Nama Kontak Darurat' },
        { id: 'inp-hp-darurat', name: 'HP Kontak Darurat' }
    ];

    for (let f of fields) {
        if (!document.getElementById(f.id).value.trim()) {
            alert(\`Kolom \${f.name} wajib diisi!\`);
            return;
        }
    }

    const fotoBase64 = document.getElementById('inp-foto-base64').value;
    if (!fotoBase64) {
        alert("Anda wajib memindai KTP terlebih dahulu.");
        return;
    }

    const payload = {
        idKaryawan: idKaryawan,
        nama: document.getElementById('inp-nama').value.trim(),
        pin: pin,
        noHP: document.getElementById('inp-nohp').value.trim(),
        email: document.getElementById('inp-email').value.trim(),
        nik: document.getElementById('inp-nik').value.trim(),
        tempatLahir: document.getElementById('inp-tempat-lahir').value.trim(),
        tglLahir: document.getElementById('inp-tgl-lahir').value.trim(),
        jenisKelamin: document.getElementById('inp-jk').value,
        alamatLengkap: document.getElementById('inp-alamat').value.trim(),
        rtrw: document.getElementById('inp-rtrw').value.trim(),
        desa: document.getElementById('inp-desa').value.trim(),
        kecamatan: document.getElementById('inp-kecamatan').value.trim(),
        agama: document.getElementById('inp-agama').value.trim(),
        statusKawin: document.getElementById('inp-kawin').value.trim(),
        kewarganegaraan: document.getElementById('inp-kwn').value.trim(),
        namaKontakDarurat: document.getElementById('inp-nama-darurat').value.trim(),
        kontakDarurat: document.getElementById('inp-hp-darurat').value.trim(),
    };

    const btnSubmit = document.getElementById('btn-submit');
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Menyimpan & Mengupload...';

    try {
        // Upload Foto KTP
        const uploadRes = await apiRequest('uploadFotoKtp', {
            fotoBase64: fotoBase64,
            namaKaryawan: payload.nama
        });

        if (!uploadRes.success || !uploadRes.fotoUrl) {
            alert("Gagal mengupload KTP: " + uploadRes.error);
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Simpan & Kunci Profil';
            return;
        }

        payload.fotoKtpUrl = uploadRes.fotoUrl;

        // Submit Profile Data
        const submitRes = await apiRequest('submitKaryawanProfil', payload);
        if (submitRes.success) {
            alert("Sukses! Profil Anda sudah lengkap dan terkunci.");
            window.location.reload();
        } else {
            alert("Gagal menyimpan profil: " + submitRes.error);
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Simpan & Kunci Profil';
        }

    } catch (e) {
        alert("Gagal menghubungi server.");
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Simpan & Kunci Profil';
    }
}

function showError(title, desc) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('main-content').style.display = 'none';
    const locked = document.getElementById('locked-state');
    locked.style.display = 'block';
    document.getElementById('locked-title').textContent = title;
    document.getElementById('locked-desc').textContent = desc;
}

function apiRequest(action, data = {}) {
    return new Promise((resolve, reject) => {
        fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: action, data: data }),
        })
        .then(res => res.json())
        .then(res => resolve(res))
        .catch(err => reject(err));
    });
}
