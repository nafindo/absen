const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxDyDhOWjdbi1dO9HBbcSEZumOkBGlg2Z4UzJ-YqcirnX7u487kUUOYota52PV-5BlN/exec';

let idKaryawan = '';

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






async function previewAndOcrKtp() {
    const file = document.getElementById('inp-ktp-file').files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64data = e.target.result;
        
        // Load original image
        const img = new Image();
        img.onload = async function() {
            // Compress image using Canvas to prevent Tesseract Out Of Memory crash on mobile
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

            // Update UI
            const preview = document.getElementById('foto-ktp-preview');
            preview.src = compressedBase64;
            document.getElementById('ktp-preview-container').style.display = 'block';
            document.getElementById('inp-foto-base64').value = compressedBase64;

            const loader = document.getElementById('ocr-loading');
            loader.style.display = 'block';
            
            try {
                if (!window.worker) {
                    document.getElementById('ocr-status-text').textContent = "Menyiapkan sistem OCR (mungkin butuh beberapa detik)...";
                    window.worker = await Tesseract.createWorker('ind');
                    document.getElementById('ocr-status-text').textContent = "Sedang membaca teks dari KTP...";
                }
                const { data: { text } } = await window.worker.recognize(compressedBase64);
                console.log("Raw OCR:", text);
                parseKtpText(text);
                loader.style.display = 'none';
                alert("Berhasil memindai! Mohon KOREKSI dan pastikan data (NIK, Nama, dll) sudah benar.");
            } catch (err) {
                loader.style.display = 'none';
                alert("Gagal membaca teks dari gambar. Anda bisa mengetik manual.");
                console.error(err);
            }
        };
        img.src = base64data;
    };
    reader.readAsDataURL(file);
}

function parseKtpText(text) {
    console.log("OCR Result:", text);
    
    // Fix common OCR mistakes for numbers before extracting NIK
    let cleanTextForNik = text.toUpperCase().replace(/I/g, '1').replace(/L/g, '1').replace(/O/g, '0').replace(/B/g, '8').replace(/S/g, '5').replace(/\?/g, '7').replace(/Z/g, '2');
    const nikMatch = cleanTextForNik.match(/\d{16}/);
    if (nikMatch) document.getElementById('inp-nik').value = nikMatch[0];

    // LAKI-LAKI or PEREMPUAN
    if (text.toUpperCase().includes('LAKI')) document.getElementById('inp-jk').value = 'LAKI-LAKI';
    if (text.toUpperCase().includes('PEREMPUAN')) document.getElementById('inp-jk').value = 'PEREMPUAN';

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);

    lines.forEach(line => {
        let upperLine = line.toUpperCase();
        let noSpace = upperLine.replace(/\s+/g, '');
        
        if ((noSpace.includes('NAMA') || noSpace.includes('NARNA') || noSpace.match(/^NAM[A-Z]*:/)) && !noSpace.includes('PROVINSI') && !noSpace.includes('KOTA')) {
            const val = extractValue(line);
            if(val) document.getElementById('inp-nama').value = val.replace(/GOL\.?\s*DARAH/i, '').replace(/[-:]/g, '').trim();
        }
        else if (noSpace.includes('TEMPAT') || noSpace.includes('TGLLHR') || noSpace.includes('LAHIR')) {
            const val = extractValue(line);
            if (val) {
                // Try to find the date DD-MM-YYYY or DD/MM/YYYY
                const dateMatch = val.match(/\d{2}[\-\/]\d{2}[\-\/]\d{4}/);
                if (dateMatch) {
                    document.getElementById('inp-tgl-lahir').value = dateMatch[0].replace(/\//g, '-');
                    let tempat = val.replace(dateMatch[0], '').replace(/[,\.:]/g, '').trim();
                    if(tempat) document.getElementById('inp-tempat-lahir').value = tempat;
                } else {
                    const parts = val.split(',');
                    if (parts.length > 1) {
                        document.getElementById('inp-tempat-lahir').value = parts[0].replace(/[,\.:]/g, '').trim();
                        document.getElementById('inp-tgl-lahir').value = parts[1].replace(/[^0-9-]/g, '').trim();
                    } else {
                        document.getElementById('inp-tempat-lahir').value = val.replace(/[,\.:]/g, '').trim();
                    }
                }
            }
        }
        else if (noSpace.includes('ALAMAT')) {
            const val = extractValue(line);
            if (val) document.getElementById('inp-alamat').value = val.replace(/[-:]/g, '').trim();
        }
        else if (noSpace.includes('RT/RW') || noSpace.includes('RT:') || noSpace.includes('RTRW')) {
            const val = extractValue(line);
            if (val) {
                // ensure format is like 001/002
                let cleanVal = val.replace(/[^0-9\/]/g, '');
                if(cleanVal) document.getElementById('inp-rtrw').value = cleanVal;
                else document.getElementById('inp-rtrw').value = val;
            }
        }
        else if (noSpace.includes('KEL') || noSpace.includes('DESA') || noSpace.includes('KELURAHAN')) {
            const val = extractValue(line);
            if (val) document.getElementById('inp-desa').value = val.replace(/[-:]/g, '').trim();
        }
        else if (noSpace.includes('KECAMATAN') || noSpace.includes('KEC')) {
            const val = extractValue(line);
            if (val) document.getElementById('inp-kecamatan').value = val.replace(/[-:]/g, '').trim();
        }
        else if (noSpace.includes('AGAMA') || noSpace.includes('AGAM')) {
            const val = extractValue(line);
            if (val) document.getElementById('inp-agama').value = val.replace(/[-:]/g, '').trim();
        }
        else if (noSpace.includes('STATUS') || noSpace.includes('KAWIN') || noSpace.includes('PERKAWINAN')) {
            const val = extractValue(line);
            if (val) document.getElementById('inp-kawin').value = val.replace(/[-:]/g, '').trim();
        }
    });
}

function extractValue(line) {
    // 1. Try colon
    let parts = line.split(':');
    if (parts.length > 1) {
        return parts.slice(1).join(':').trim().replace(/[^a-zA-Z0-9 \-\/\.,]/g, '');
    }
    // 2. Try multiple spaces (Tesseract often uses multiple spaces for gaps)
    parts = line.split(/\s{2,}/);
    if (parts.length > 1) {
        return parts.slice(1).join(' ').trim().replace(/[^a-zA-Z0-9 \-\/\.,]/g, '');
    }
    // 3. Fallback: split by single space, discard the first word (the key)
    parts = line.split(' ');
    if (parts.length > 1) {
        return parts.slice(1).join(' ').trim().replace(/[^a-zA-Z0-9 \-\/\.,]/g, '');
    }
    return "";
}

function extractValueTemp() {
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
            alert(`Kolom ${f.name} wajib diisi!`);
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
        fotoProfilBase64: document.getElementById('inp-foto-profil-base64').value,
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
        // Upload Foto Profil
        if (payload.fotoProfilBase64) {
            btnSubmit.textContent = 'Mengupload Foto Profil...';
            const uploadProf = await apiRequest('uploadFotoProfil', {
                fotoBase64: payload.fotoProfilBase64,
                idKaryawan: idKaryawan
            });
            if (uploadProf.success && uploadProf.fotoUrl) {
                payload.fotoProfilUrl = uploadProf.fotoUrl;
            }
        }
        delete payload.fotoProfilBase64;

        // Upload Foto KTP
        btnSubmit.textContent = 'Mengupload KTP...';
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
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: action, ...data }),
        })
        .then(res => res.json())
        .then(res => resolve(res))
        .catch(err => reject(err));
    });
}

function previewFotoProfil() {
    const file = document.getElementById('inp-foto-profil-file').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('img-profil-preview');
            img.src = e.target.result;
            img.style.display = 'block';
            document.getElementById('inp-foto-profil-base64').value = e.target.result;
        }
        reader.readAsDataURL(file);
    }
}
