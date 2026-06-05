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

        // Display existing Foto Profil if available
        if (res.fotoProfil) {
            const img = document.getElementById('img-profil-preview');
            img.src = res.fotoProfil;
            img.style.display = 'block';
        }

    } catch (e) {
        showError("Koneksi Gagal", "Gagal menghubungi server. Pastikan internet Anda aktif.");
    }
});

// === OCR via Google Drive (Server-Side) ===

async function previewAndOcrKtp(inputElement) {
    const el = inputElement || document.getElementById('inp-ktp-file');
    const file = el.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64data = e.target.result;

        // Show preview
        const preview = document.getElementById('foto-ktp-preview');
        preview.src = base64data;
        document.getElementById('ktp-preview-container').style.display = 'block';
        document.getElementById('inp-foto-base64').value = base64data;

        // Show loading
        const loader = document.getElementById('ocr-loading');
        loader.style.display = 'block';
        document.getElementById('ocr-status-text').textContent = "Mengirim foto ke server Google untuk dibaca (10-20 detik)...";

        try {
            // Send to server for OCR via Google Drive
            const res = await apiRequest('ocrKtp', { fotoBase64: base64data });

            if (res.success && res.text) {
                console.log("Server OCR Result:", res.text);
                
                // Show raw text for debugging
                if(document.getElementById('raw-ocr-text')) {
                    document.getElementById('raw-ocr-text').value = res.text;
                }
                
                parseKtpText(res.text);
                loader.style.display = 'none';
                alert("Berhasil memindai! Mohon KOREKSI dan pastikan data sudah benar.");
            } else {
                loader.style.display = 'none';
                alert("Gagal membaca KTP: " + (res.error || "Tidak diketahui") + ". Silakan ketik manual.");
            }
        } catch (err) {
            loader.style.display = 'none';
            alert("Gagal menghubungi server OCR. Silakan ketik manual.");
            console.error(err);
        }
    };
    reader.readAsDataURL(file);
}

function parseKtpText(text) {
    console.log("Parsing OCR text:", text);
    
    let upperText = text.toUpperCase();

    // 1. NIK - find 16-digit number
    const nikMatch = text.match(/\b\d{16}\b/);
    if (nikMatch) document.getElementById('inp-nik').value = nikMatch[0];

    // 2. Jenis Kelamin
    if (upperText.includes('LAKI-LAKI') || upperText.includes('LAKI - LAKI')) {
        document.getElementById('inp-jk').value = 'LAKI-LAKI';
    } else if (upperText.includes('PEREMPUAN')) {
        document.getElementById('inp-jk').value = 'PEREMPUAN';
    }

    // 3. Tanggal Lahir (DD-MM-YYYY)
    const dateMatch = text.match(/\d{2}[\-\/\.]\d{2}[\-\/\.]\d{4}/);
    if (dateMatch) {
        document.getElementById('inp-tgl-lahir').value = dateMatch[0].replace(/[\/\.]/g, '-');
    }

    // 4. RT/RW (000/000)
    const rtrwMatch = text.match(/\d{3}\s*\/\s*\d{3}/);
    if (rtrwMatch) {
        document.getElementById('inp-rtrw').value = rtrwMatch[0].replace(/\s/g, '');
    }

    // 5. Agama
    const agamaList = ['ISLAM', 'KRISTEN', 'KATHOLIK', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU'];
    for (let a of agamaList) {
        if (upperText.includes(a)) {
            document.getElementById('inp-agama').value = a === 'KATOLIK' ? 'KATHOLIK' : a;
            break;
        }
    }

    // 6. Status Perkawinan
    if (upperText.includes('BELUM KAWIN')) document.getElementById('inp-kawin').value = 'BELUM KAWIN';
    else if (upperText.includes('CERAI HIDUP')) document.getElementById('inp-kawin').value = 'CERAI HIDUP';
    else if (upperText.includes('CERAI MATI')) document.getElementById('inp-kawin').value = 'CERAI MATI';
    else if (upperText.includes('KAWIN')) document.getElementById('inp-kawin').value = 'KAWIN';

    // 7. Kewarganegaraan
    if (upperText.includes('WNI')) document.getElementById('inp-kwn').value = 'WNI';

    // Line-by-line parsing
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let upperLine = line.toUpperCase();
        let noSpace = upperLine.replace(/\s+/g, '');

        // Nama
        if ((noSpace.startsWith('NAMA') || noSpace.includes(':NAMA') || upperLine.match(/^Nama\b/i)) 
            && !noSpace.includes('PROVINSI') && !noSpace.includes('KOTA') && !noSpace.includes('KABUPATEN')) {
            let val = extractAfterColon(line);
            if (val && val.length > 1) {
                document.getElementById('inp-nama').value = val;
            }
        }
        // Tempat/Tgl Lahir
        else if (noSpace.includes('TEMPAT') || noSpace.includes('TGLLAHIR') || noSpace.includes('TGLLHR')) {
            let val = extractAfterColon(line);
            if (val) {
                // Remove date portion to get city name
                let city = val.replace(/\d{2}[\-\/\.]\d{2}[\-\/\.]\d{4}/, '').replace(/[,\.]/g, '').trim();
                if (city) document.getElementById('inp-tempat-lahir').value = city;
            }
        }
        // Alamat
        else if (noSpace.startsWith('ALAMAT') || upperLine.match(/^Alamat\b/i)) {
            let val = extractAfterColon(line);
            // Also grab following lines that are NOT keywords (multi-line address)
            let fullAddr = val || '';
            for (let j = i + 1; j < lines.length && j <= i + 2; j++) {
                let nextUpper = lines[j].toUpperCase().replace(/\s+/g, '');
                if (nextUpper.startsWith('RT') || nextUpper.startsWith('KEL') || nextUpper.startsWith('DESA') || nextUpper.startsWith('KEC') || nextUpper.includes('AGAMA')) break;
                fullAddr += ' ' + lines[j].trim();
            }
            if (fullAddr.trim()) document.getElementById('inp-alamat').value = fullAddr.trim();
        }
        // Kel/Desa
        else if (noSpace.startsWith('KEL') || noSpace.startsWith('DESA') || noSpace.includes('KELURAHAN')) {
            let val = extractAfterColon(line);
            if (val) document.getElementById('inp-desa').value = val;
        }
        // Kecamatan
        else if (noSpace.startsWith('KECAMATAN') || noSpace.startsWith('KEC')) {
            let val = extractAfterColon(line);
            if (val) document.getElementById('inp-kecamatan').value = val;
        }
    }
}

function extractAfterColon(line) {
    const idx = line.indexOf(':');
    if (idx !== -1) {
        return line.substring(idx + 1).trim();
    }
    // Try splitting by multiple spaces
    const parts = line.split(/\s{2,}/);
    if (parts.length > 1) {
        return parts.slice(1).join(' ').trim();
    }
    return '';
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
