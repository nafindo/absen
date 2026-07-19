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
        
        const emp = res.employeeData || {};
        
        document.getElementById('lbl-nama').textContent = emp.Nama || 'Karyawan';
        document.getElementById('inp-nama').value = emp.Nama || '';
        document.getElementById('inp-jabatan').value = emp.Jabatan || '';
        document.getElementById('inp-tgl-masuk').value = emp.Tanggal_Masuk || '';
        document.getElementById('inp-nohp').value = emp.No_HP || '';
        document.getElementById('inp-email').value = emp.Email || '';
        document.getElementById('inp-pin').value = emp.PIN || '';

        // Populate previous profile data if available
        if (emp.NIK) document.getElementById('inp-nik').value = emp.NIK;
        if (emp.Tempat_Lahir) document.getElementById('inp-tempat-lahir').value = emp.Tempat_Lahir;
        if (emp.Tanggal_Lahir) document.getElementById('inp-tgl-lahir').value = emp.Tanggal_Lahir;
        if (emp.Jenis_Kelamin) document.getElementById('inp-jk').value = emp.Jenis_Kelamin;
        if (emp.Alamat_Lengkap) document.getElementById('inp-alamat').value = emp.Alamat_Lengkap;
        if (emp.RT_RW) document.getElementById('inp-rtrw').value = emp.RT_RW;
        if (emp.Desa) document.getElementById('inp-desa').value = emp.Desa;
        if (emp.Kecamatan) document.getElementById('inp-kecamatan').value = emp.Kecamatan;
        if (emp.Agama) document.getElementById('inp-agama').value = emp.Agama;
        if (emp.Status_Kawin) document.getElementById('inp-kawin').value = emp.Status_Kawin;
        if (emp.Kewarganegaraan) document.getElementById('inp-kwn').value = emp.Kewarganegaraan;
        if (emp.Nama_Kontak_Darurat) document.getElementById('inp-nama-darurat').value = emp.Nama_Kontak_Darurat;
        if (emp.Kontak_Darurat) document.getElementById('inp-hp-darurat').value = emp.Kontak_Darurat;

        // Display existing Foto Profil if available
        if (emp.Foto_Profil) {
            const img = document.getElementById('img-profil-preview');
            img.src = emp.Foto_Profil;
            img.style.display = 'block';
            document.getElementById('inp-foto-profil-base64').value = emp.Foto_Profil;
        }

        // Display existing Foto KTP if available
        if (emp.Foto_KTP) {
            const img = document.getElementById('foto-ktp-preview');
            img.src = emp.Foto_KTP;
            document.getElementById('ktp-preview-container').style.display = 'block';
            document.getElementById('inp-foto-base64').value = emp.Foto_KTP;
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

    // Smart Name Parsing
    let namaParsed = "";
    
    // Method 1: Look for "NAMA" header and grab value after colon
    for (let line of lines) {
        let upperLine = line.toUpperCase();
        let noSpace = upperLine.replace(/\s+/g, '');
        if (noSpace.includes('NAMA') && !noSpace.includes('KONTUR') && !noSpace.includes('DARURAT') && !noSpace.includes('IBU') && !noSpace.includes('KAPULAGA')) {
            let val = extractAfterColon(line);
            if (val && val.length > 2 && !val.includes('PROVINSI') && !val.includes('KABUPATEN') && !val.includes('KOTA')) {
                namaParsed = val;
                break;
            }
        }
    }
    
    // Method 2: Look for line between NIK (16 digit) and Tempat/Tgl Lahir
    if (!namaParsed) {
        let nikLineIdx = -1;
        let tempatLahirLineIdx = -1;
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (line.match(/\b\d{16}\b/) || (line.includes(':') && line.replace(/[^0-9]/g, '').length >= 15)) {
                nikLineIdx = i;
            }
            if (line.toUpperCase().includes('TEMPAT') || line.toUpperCase().includes('LAHIR') || line.toUpperCase().includes('TGL')) {
                tempatLahirLineIdx = i;
            }
        }
        
        if (nikLineIdx !== -1 && tempatLahirLineIdx !== -1 && tempatLahirLineIdx > nikLineIdx + 1) {
            for (let idx = nikLineIdx + 1; idx < tempatLahirLineIdx; idx++) {
                let candidate = lines[idx].trim().replace(/^[:\s\-]+/g, '').trim();
                if (candidate.length > 2 && !candidate.toUpperCase().includes('PROVINSI') && !candidate.toUpperCase().includes('KABUPATEN') && !candidate.toUpperCase().includes('KOTA') && !candidate.toUpperCase().includes('NIK') && !candidate.toUpperCase().includes('NAMA')) {
                    namaParsed = candidate;
                    break;
                }
            }
        }
    }

    // Method 3: Line immediately after single-word "NAMA" line
    if (!namaParsed) {
        for (let i = 0; i < lines.length - 1; i++) {
            let cleanLine = lines[i].toUpperCase().replace(/[^A-Z]/g, '');
            if (cleanLine === 'NAMA') {
                let candidate = lines[i+1].trim().replace(/^[:\s\-]+/g, '').trim();
                if (candidate.length > 2 && !candidate.toUpperCase().includes('PROVINSI') && !candidate.toUpperCase().includes('KABUPATEN')) {
                    namaParsed = candidate;
                    break;
                }
            }
        }
    }

    if (namaParsed) {
        document.getElementById('inp-nama').value = namaParsed.toUpperCase();
    }

    // Regular field parsing from lines
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let upperLine = line.toUpperCase();
        let noSpace = upperLine.replace(/\s+/g, '');

        // Tempat/Tgl Lahir
        if (noSpace.includes('TEMPAT') || noSpace.includes('TGLLAHIR') || noSpace.includes('TGLLHR')) {
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
        { id: 'inp-nama', name: 'Nama Lengkap' },
        { id: 'inp-nohp', name: 'Nomor HP / WA' },
        { id: 'inp-email', name: 'Email' },
        { id: 'inp-nik', name: 'NIK' },
        { id: 'inp-tempat-lahir', name: 'Tempat Lahir' },
        { id: 'inp-tgl-lahir', name: 'Tgl Lahir' },
        { id: 'inp-jk', name: 'Jenis Kelamin' },
        { id: 'inp-alamat', name: 'Alamat Lengkap' },
        { id: 'inp-rtrw', name: 'RT/RW' },
        { id: 'inp-desa', name: 'Kel/Desa' },
        { id: 'inp-kecamatan', name: 'Kecamatan' },
        { id: 'inp-agama', name: 'Agama' },
        { id: 'inp-kawin', name: 'Status Perkawinan' },
        { id: 'inp-kwn', name: 'Kewarganegaraan' },
        { id: 'inp-nama-darurat', name: 'Nama Kontak Darurat' },
        { id: 'inp-hp-darurat', name: 'No. HP Darurat' }
    ];

    for (let f of fields) {
        if (!document.getElementById(f.id).value.trim()) {
            alert(`Kolom ${f.name} wajib diisi!`);
            return;
        }
    }

    const fotoProfil = document.getElementById('inp-foto-profil-base64').value;
    // Validasi Foto Profil dihilangkan sesuai permintaan (menjadi opsional)

    const fotoBase64 = document.getElementById('inp-foto-base64').value;
    if (!fotoBase64) {
        alert("Anda wajib mengambil atau memilih Foto KTP terlebih dahulu.");
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
            btnSubmit.textContent = 'Simpan';
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
            btnSubmit.textContent = 'Simpan';
        }

    } catch (e) {
        alert("Gagal menghubungi server.");
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Simpan';
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

function previewFotoProfil(inputElement) {
    const file = inputElement.files[0];
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
