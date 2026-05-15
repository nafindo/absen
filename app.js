
let state = {
  user: { id:'', name:'', role:'', tokoDefault:'', shiftDefault:'' },
  photoData: null, gps: { lat:null, lng:null, accuracy:null, jarak:null },
  absenStatus: 'belum_masuk', isLemburMode: false, jadwalOffset: 0, stream: null,
  modeJadwal: 'LOCKED', tokoList: [], shiftList: [], karyawanList: [],
  loginEnabled: true, currentUser: null
};

const pathGambar = "https://lh3.googleusercontent.com/d/";
const picoImages = {
  sukses: "1Tnf4KogLXDeGaXjzi7nT-6D0XDsLQJtI", gps_jauh: "1t3Ip_ioGD55TEWbkKPgtnYtDciidJuDZ",
  wajah_gagal: "1znuTlrMgr6b_qpWdrTwdW5FnPsbsd3cE", lembur_pending: "1q5q5rsFG0ZrhaGJyEulwU8MJjXAtFyKc",
  izin_sakit: "1wf65GL6UGY_qDfnGEhSYHxvYL5pRXJwf", izin_telat: "115BmzgFQ2uJHXk8khNGAhdYD0tRVrh1h",
  izin_pulang: "152ZtNSBruDX5KQOpo7fMv7SDws0u1VlF", izin_cuti: "1Tnxa9YDmJD0N0evyv7RGg9wRERDBm3zJ",
  error: "1Q5WxPZ2uulbNdZsggdCQ2HZhyJiFoJKV"
};
const picoBtnColors = {
  sukses:'#34a853', gps_jauh:'#ea4335', wajah_gagal:'#f9ab00', lembur_pending:'#1a73e8',
  izin_sakit:'#9aa0a6', izin_telat:'#fbbc04', izin_pulang:'#f9ab00', izin_cuti:'#00acc1', error:'#c53929'
};

function tampilPicoModal(tipe, pesan, callback=null) {
  const modal = document.getElementById('pico-modal');
  const img = document.getElementById('pico-modal-img');
  const text = document.getElementById('pico-modal-text');
  const btn = document.getElementById('pico-modal-btn');
  img.src = pathGambar + (picoImages[tipe] || picoImages.error);
  text.innerHTML = pesan;
  btn.style.backgroundColor = picoBtnColors[tipe] || '#1a73e8';
  btn.style.boxShadow = `0 4px 10px ${(picoBtnColors[tipe]||'#1a73e8')}4D`;
  btn.onclick = () => { closePicoModal(); if(callback) callback(); };
  modal.classList.add('active');
  playSound(tipe === 'sukses' ? 'success' : 'error');
}
function closePicoModal() { document.getElementById('pico-modal').classList.remove('active'); }

let stepIndex = 0, typingEffect, isTyping = false, bubbleTimer = null;

const tutorialSteps = [
  "<b>Semangat Pagi!</b><br>Ayo absen dulu sama PICO biar rezeki makin lancar!",
  "<b>Langkah 1:</b><br>Ambil foto selfie bening, biar PICO gampang ngenalin wajahmu!",
  "<b>Langkah 2:</b><br>Pilih Toko & Shift. Kalau mode LOCKED, data sudah auto-isi!",
  "<b>Langkah 3:</b><br>Pastikan GPS nyala & kamu sudah dekat toko ya!",
  "<b>Langkah 4:</b><br>Klik <b>'Mode Lembur'</b> setelah absen masuk untuk ajukan lembur.",
  "<b>Langkah 5:</b><br>Absen Pulang = foto lagi + GPS di lokasi toko. Pico tidak bisa bantu kalau sudah di rumah!",
  "<b>Gagal Wajah?</b><br>Jangan ketutup masker/topi, cari tempat terang, jangan membelakangi lampu!",
  "<b>Gagal Jarak?</b><br>GPS harus aktif Mode Akurasi Tinggi. Maksimal 50m dari titik toko!",
  "<b>Masalah Jaringan?</b><br>Ganti ke data seluler atau cari sinyal lebih stabil.",
  "<b>Pinguin Cell!</b><br>Kerja jujur itu hebat. Tetap semangat!"
];
const instruksiPencet = [
  "Tekan PICO untuk lanjut...","Pencet PICO kalau sudah paham...","Klik PICO lagi...",
  "Ayo tekan PICO...","Pencet PICO lanjut ke tips...","Lanjut? Klik PICO...",
  "Cek tips GPS, pencet PICO...","Pencet PICO lagi ya...","Hampir selesai, klik PICO...","Tekan PICO untuk ulangi..."
];

function picoAction() {
  const mascot = document.getElementById('pinguin-mascot');
  mascot.classList.add('pico-waving');
  setTimeout(() => mascot.classList.remove('pico-waving'), 800);
  tampilTutorial();
}

function closeBubble(e) {
  if(e) e.stopPropagation();
  const bubble = document.getElementById('chat-bubble');
  bubble.classList.remove('show');
  bubble.style.display = 'none';
  clearTimeout(bubbleTimer);
  isTyping = false;
  clearTimeout(typingEffect);
}

function tampilTutorial() {
  if (isTyping) {
    closeBubble();
    setTimeout(() => tampilTutorial(), 300);
    return;
  }
  const bubble = document.getElementById('chat-bubble');
  const textContainer = document.getElementById('tutorial-text');
  bubble.style.display = 'block'; bubble.classList.add('show');
  clearTimeout(typingEffect); textContainer.innerHTML = ""; isTyping = true;
  let fullText = tutorialSteps[stepIndex] + `<br><br><span style="font-size:13px;color:#5f6368;font-style:italic;">(${instruksiPencet[stepIndex]})</span>`;
  let charIndex = 0;
  function typeWriter() {
    if (charIndex < fullText.length) {
      if (fullText.charAt(charIndex) === '<') {
        let tagEnd = fullText.indexOf('>', charIndex);
        textContainer.innerHTML += fullText.substring(charIndex, tagEnd + 1);
        charIndex = tagEnd + 1;
      } else { textContainer.innerHTML += fullText.charAt(charIndex); charIndex++; }
      typingEffect = setTimeout(typeWriter, 30);
    } else { isTyping = false; }
  }
  typeWriter();
  stepIndex++; if (stepIndex >= tutorialSteps.length) stepIndex = 0;
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => { closeBubble(); }, 8000);
}

document.addEventListener('DOMContentLoaded', async () => {
  updateDate(); initGPS();
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('izinTglMulai').value = today;
  document.getElementById('izinTglSelesai').value = today;

  // Load global settings first
  await loadGlobalSettings();

  if (state.loginEnabled) {
    document.getElementById('loginOverlay').classList.remove('hidden');
    document.getElementById('namaSection').classList.add('hidden');
    // Kamera MATI saat login overlay tampil
    stopCamera();
  } else {
    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('namaSection').classList.remove('hidden');
    await loadKaryawanDropdown();
    await loadTokoData();
    checkAbsenStatus();
    // Kamera MATI di home, tunggu user tap tombol manual
    stopCamera();
    showCameraOverlay();
  }

  // Check in-app browser
  if (isInAppBrowser()) {
    const appName = getInAppName();
    document.getElementById('inappText').textContent = 'Anda membuka aplikasi dari dalam ' + appName + '. Browser bawaan ' + appName + ' tidak mengizinkan akses kamera. Tap tombol di bawah untuk membuka di Chrome/Samsung Browser.';
    document.getElementById('inappWarning').classList.add('show');
    document.getElementById('btnUseGallery').style.display = 'flex';
  }

  setTimeout(picoAction, 3000);
  checkMyApprovals();
});

function updateDate() {
  const now = new Date();
  const opt = { weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' };
  document.getElementById('currentDate').textContent = now.toLocaleDateString('id-ID', opt) + ' WIB';
}

function playSound(type) {
  const audio = document.getElementById(type === 'success' ? 'soundSuccess' : type === 'error' ? 'soundError' : 'soundNotif');
  if (audio) { audio.currentTime = 0; audio.play().catch(e => {}); }
}

async function checkMyApprovals() {
  if (!state.user.id) return;
  try {
    const res = await apiCall('getMyApprovals', { idKaryawan: state.user.id });
    if (res.success && Array.isArray(res.data)) {
      state.notifList = res.data;
      updateNotifBadge();
      updateNotifBubble();

      // Tampilkan toast untuk notifikasi terbaru jika ada yang belum dibaca
      const unread = res.data.filter(n => n.status !== 'Pending');
      if (unread.length > 0 && !state.notifShown) {
        const latest = unread[0];
        showToast(
          `Pengajuan ${latest.tipe} Anda ${latest.status === 'Approved' ? 'disetujui' : 'ditolak'}!`,
          latest.status === 'Approved' ? 'success' : 'error'
        );
        state.notifShown = true;
      }
    }
  } catch (e) { console.log('checkMyApprovals error:', e); }
}

function updateNotifBadge() {
  const badge = document.getElementById('notifBadge');
  const bell = document.getElementById('notifBell');
  const count = state.notifList ? state.notifList.filter(n => n.status !== 'Pending').length : 0;
  if (count > 0) {
    badge.textContent = count > 9 ? '9+' : count;
    badge.classList.remove('hidden');
    bell.classList.add('has-notif');
  } else {
    badge.classList.add('hidden');
    bell.classList.remove('has-notif');
  }
}

function updateNotifBubble() {
  const list = document.getElementById('notifBubbleList');
  if (!state.notifList || state.notifList.length === 0) {
    list.innerHTML = '<div class="notif-empty">Belum ada pemberitahuan</div>';
    return;
  }
  list.innerHTML = state.notifList.map(n => `
    <div class="notif-item ${n.status === 'Approved' ? 'approved' : n.status === 'Rejected' ? 'rejected' : ''}">
      <div class="notif-item-title">${n.tipe === 'lembur' ? '&#128161; Lembur' : '&#128203; Izin/Cuti'}</div>
      <div class="notif-item-text">Pengajuan Anda tanggal ${n.tanggal} telah <strong>${n.status === 'Approved' ? 'disetujui' : n.status === 'Rejected' ? 'ditolak' : 'diproses'}</strong></div>
      <div class="notif-item-date">${n.approvedAt || n.tanggal}</div>
    </div>
  `).join('');
}

function toggleNotifBubble(e) {
  e.stopPropagation();
  const bubble = document.getElementById('notifBubble');
  bubble.classList.toggle('show');
}

function closeNotifBubble(e) {
  e.stopPropagation();
  document.getElementById('notifBubble').classList.remove('show');
}

// Klik di luar notif bubble menutupnya
document.addEventListener('click', function(e) {
  const bubble = document.getElementById('notifBubble');
  const bell = document.getElementById('notifBell');
  if (bubble && bell && !bubble.contains(e.target) && !bell.contains(e.target)) {
    bubble.classList.remove('show');
  }
});

// ==================== KAMERA LEMBUR ====================
let lemburStream = null;
let lemburPhotoData = null;

async function startLemburCamera() {
  const video = document.getElementById('lemburVideo');
  const overlay = document.getElementById('lemburCameraOverlay');
  const captureBtn = document.getElementById('lemburCaptureBtn');

  try {
    if (lemburStream) {
      lemburStream.getTracks().forEach(t => t.stop());
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' }, audio: false
    });
    lemburStream = stream;
    video.srcObject = stream;
    await video.play();

    overlay.style.display = 'none';
    video.style.display = 'block';
    captureBtn.style.display = 'flex';
  } catch (err) {
    showToast('Gagal nyalakan kamera lembur: ' + err.message, 'error');
  }
}

function captureLemburPhoto() {
  const video = document.getElementById('lemburVideo');
  const canvas = document.getElementById('lemburCanvas');
  const preview = document.getElementById('lemburPreview');
  const captureBtn = document.getElementById('lemburCaptureBtn');
  const retakeBtn = document.getElementById('lemburRetakeBtn');

  if (!video.videoWidth) { showToast('Kamera belum siap', 'error'); return; }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);

  lemburPhotoData = canvas.toDataURL('image/jpeg', 0.7);
  preview.src = lemburPhotoData;
  preview.style.display = 'block';
  video.style.display = 'none';
  captureBtn.style.display = 'none';
  retakeBtn.style.display = 'block';

  // Matikan kamera setelah foto
  if (lemburStream) {
    lemburStream.getTracks().forEach(t => t.stop());
    lemburStream = null;
  }

  showToast('Foto lembur berhasil diambil', 'success');
  playSound('success');
}

function retakeLemburPhoto() {
  const video = document.getElementById('lemburVideo');
  const preview = document.getElementById('lemburPreview');
  const captureBtn = document.getElementById('lemburCaptureBtn');
  const retakeBtn = document.getElementById('lemburRetakeBtn');
  const overlay = document.getElementById('lemburCameraOverlay');

  preview.style.display = 'none';
  video.style.display = 'none';
  captureBtn.style.display = 'none';
  retakeBtn.style.display = 'none';
  overlay.style.display = 'flex';
  lemburPhotoData = null;
}

// Update submitLembur untuk pakai foto lembur
function submitLembur() {
  if (!state.user.id) { showToast('Login atau pilih nama dulu!', 'error'); return; }
  const tokoId = document.getElementById('lemburToko').value;
  const toko = state.tokoList.find(t => t.ID_Toko === tokoId);
  try {
    apiCall('ajukanLembur', {
      idKaryawan: state.user.id, nama: state.user.name,
      idToko: tokoId, namaToko: toko ? toko.Nama_Toko : '',
      alasan: document.getElementById('lemburAlasanType').value,
      fotoBase64: lemburPhotoData || ''
    }).then(() => {
      closeModal('modalLembur');
      tampilPicoModal('lembur_pending', 'Pengajuan lembur terkirim!<br>Tunggu approve dari Bos ya!');
      // Reset lembur camera
      retakeLemburPhoto();
    });
  } catch (e) { showToast('Gagal ajukan lembur', 'error'); }
}

async function initCamera() {
  // Check secure context
  if (!window.isSecureContext) {
    showCameraError('Aplikasi harus diakses via HTTPS agar kamera bisa digunakan.');
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showCameraError('Browser tidak mendukung akses kamera. Gunakan Chrome/Safari terbaru.');
    return;
  }
  // Try auto-start first, if blocked show manual button
  try {
    await startCameraStream();
    hideCameraOverlay();
  } catch (err) {
    console.log('Auto-start camera blocked:', err);
    // Show manual start buttons (overlay + external fallback)
    showCameraOverlay();
  }
}

async function loadGlobalSettings() {
  try {
    const res = await apiCall('getSettingGlobal');
    if (res.success && res.settings) {
      // LOGIN_ENABLED: default TRUE (harus login). FALSE = mode tanpa login (dropdown nama)
      const loginSetting = res.settings.LOGIN_ENABLED;
      state.loginEnabled = loginSetting !== 'FALSE' && loginSetting !== false && loginSetting !== 'false' && loginSetting !== 0;
      state.modeJadwal = res.settings.KUNCI_JADWAL_KARYAWAN || 'LOCKED';
    }
  } catch (e) {
    console.log('loadGlobalSettings error:', e);
    // Default: login enabled, jadwal locked
    state.loginEnabled = true;
    state.modeJadwal = 'LOCKED';
  }
}

async function loadKaryawanDropdown() {
  try {
    const res = await apiCall('getKaryawanList');
    if (res.success && Array.isArray(res.data)) {
      state.karyawanList = res.data.filter(k => k.Status === 'Aktif');
      const sel = document.getElementById('selectNama');
      sel.innerHTML = '<option value="">Pilih Nama...</option>';
      state.karyawanList.forEach(k => {
        // Foto_URL = kolom K (index 10) di MASTER_KARYAWAN
        const fotoUrl = k.Foto_URL || k.Foto_Profil || k.fotoUrl || '';
        sel.innerHTML += `<option value="${k.ID_Karyawan}" data-toko="${k.Toko_Default || ''}" data-shift="${k.Shift_Default || ''}" data-role="${k.Jabatan || 'Staff'}" data-foto="${fotoUrl}">${k.Nama}</option>`;
      });
    }
  } catch (e) { console.log('loadKaryawanDropdown error:', e); }
}

function onNamaChange() {
  const sel = document.getElementById('selectNama');
  const opt = sel.options[sel.selectedIndex];
  const id = sel.value;
  if (!id) return;
  const name = opt.text;
  const role = opt.getAttribute('data-role') || 'Staff';
  const tokoId = opt.getAttribute('data-toko') || '';
  const shiftId = opt.getAttribute('data-shift') || '';
  const fotoUrl = opt.getAttribute('data-foto') || '';

  state.user = { id, name, role, tokoDefault: tokoId, shiftDefault: shiftId };
  state.currentUser = state.user;

  document.getElementById('userName').textContent = name;
  document.getElementById('userRole').textContent = role + (tokoId ? ' - ' + (state.tokoList.find(t=>t.ID_Toko===tokoId)?.Nama_Toko || '') : '');
  setAvatar(name, fotoUrl);

  // Auto-select toko & shift if available
  if (tokoId) {
    document.getElementById('selectToko').value = tokoId;
    onTokoChange().then(() => {
      if (shiftId) {
        document.getElementById('selectShift').value = shiftId;
        updateShiftInfo();
      }
    });
  }
  checkAbsenStatus();
  // Kamera tetap MATI setelah pilih nama. User tap tombol manual.
  stopCamera();
  showCameraOverlay();
}

async function doLogin() {
  const rawId = document.getElementById('loginId').value;
  const rawPass = document.getElementById('loginPassword').value;
  // Trim spasi di awal/akhir & hapus karakter aneh
  const id = rawId.trim().replace(/\s+/g, '');
  const pass = rawPass.trim();
  const errBox = document.getElementById('loginError');
  const btn = document.getElementById('btnLogin');

  if (!id || !pass) {
    errBox.textContent = 'ID dan PIN wajib diisi!';
    errBox.classList.add('show');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Memverifikasi...';
  errBox.classList.remove('show');

  // Code.gs expects 'pin', not 'password'
  const payload = { idKaryawan: id, pin: pass };
  console.log('[LOGIN] Payload dikirim:', payload);

  try {
    const res = await apiCall('login', payload);
    console.log('[LOGIN] Response dari backend:', res);

    if (res.success && res.user) {
      // PERBAIKAN: Mapping disinkronkan tepat dengan response Code.gs
      state.user = {
        id: res.user.id,
        name: res.user.nama,
        role: res.user.jabatan,
        tokoDefault: res.user.tokoDefault,
        shiftDefault: res.user.shiftDefault
      };
      state.currentUser = state.user;

      document.getElementById('userName').textContent = state.user.name;
      document.getElementById('userRole').textContent = state.user.role; 
      setAvatar(state.user.name, res.user.fotoUrl || '');
      document.getElementById('loginOverlay').classList.add('hidden');
      errBox.classList.remove('show');

      await loadTokoData();
      if (state.user.tokoDefault) {
        document.getElementById('selectToko').value = state.user.tokoDefault;
        await onTokoChange();
        if (state.user.shiftDefault) {
          document.getElementById('selectShift').value = state.user.shiftDefault;
          updateShiftInfo();
        }
      }
      checkAbsenStatus();
      stopCamera();
      showCameraOverlay();
      showToast('Selamat datang, ' + state.user.name + '!', 'success');
      playSound('success');
    } else {
      // Tampilkan detail error dari backend untuk debug
      let errMsg = res.error || 'ID atau Password salah!';
      if (res.message) errMsg += ' | ' + res.message;
      errBox.innerHTML = '<b>Login gagal:</b> ' + errMsg + '<br><span style="font-size:12px;opacity:0.8;">Cek Console (F12) untuk detail payload & response.</span>';
      errBox.classList.add('show');
      playSound('error');
    }
  } catch (e) {
    console.error('[LOGIN] Error:', e);
    errBox.innerHTML = '<b>Gagal login:</b> ' + e.message + '<br><span style="font-size:12px;opacity:0.8;">Pastikan internet stabil & backend Apps Script online.</span>';
    errBox.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span style="font-size:20px;">&#128274;</span> Masuk';
  }
}

function updateShiftInfo() {
  const shiftId = document.getElementById('selectShift').value;
  const shift = state.shiftList.find(s => s.ID_Shift === shiftId);
  if (shift) {
    document.getElementById('jamMasukInfo').style.display = 'block';
    document.getElementById('infoJamMasuk').textContent = 'Jam Masuk: ' + shift.Jam_Masuk;
    document.getElementById('infoJamPulang').textContent = 'Jam Pulang: ' + shift.Jam_Pulang;
  } else {
    document.getElementById('jamMasukInfo').style.display = 'none';
  }
}

function isInAppBrowser() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return /FBAN|FBAV|Instagram|WhatsApp|TikTok|Line|WeChat|Snapchat|Twitter|LinkedIn/i.test(ua);
}

function getInAppName() {
  const ua = navigator.userAgent;
  if (/FBAN|FBAV/i.test(ua)) return 'Facebook';
  if (/Instagram/i.test(ua)) return 'Instagram';
  if (/WhatsApp/i.test(ua)) return 'WhatsApp';
  if (/TikTok/i.test(ua)) return 'TikTok';
  if (/Line/i.test(ua)) return 'LINE';
  if (/WeChat/i.test(ua)) return 'WeChat';
  if (/Twitter/i.test(ua)) return 'Twitter/X';
  if (/LinkedIn/i.test(ua)) return 'LinkedIn';
  return 'Aplikasi ini';
}

function openInExternalBrowser(e) {
  e.preventDefault();
  const url = window.location.href;
  // Try intent for Android
  if (/Android/i.test(navigator.userAgent)) {
    window.location.href = 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end';
    setTimeout(() => {
      window.location.href = 'googlechrome://navigate?url=' + encodeURIComponent(url);
    }, 500);
  } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    window.location.href = 'googlechrome://' + url.replace(/^https?:\/\//, '');
    setTimeout(() => { window.location.href = url; }, 800);
  } else {
    window.open(url, '_system');
  }
}

function setAvatar(name, fotoUrl) {
  const textEl = document.getElementById('userAvatarText');
  const imgEl = document.getElementById('userAvatarImg');
  if (fotoUrl && fotoUrl.trim() !== '') {
    imgEl.src = fotoUrl;
    imgEl.style.display = 'block';
    textEl.style.display = 'none';
  } else {
    textEl.textContent = name.charAt(0).toUpperCase();
    textEl.style.display = 'block';
    imgEl.style.display = 'none';
  }
}

function detectBrowser() {
  const ua = navigator.userAgent;
  if (/CriOS\/|Chrome\//.test(ua) && /iPhone|iPad|iPod/.test(ua)) return 'chrome-ios';
  if (/Safari\//.test(ua) && /iPhone|iPad|iPod/.test(ua)) return 'safari-ios';
  if (/SamsungBrowser\//.test(ua)) return 'samsung';
  if (/Edg\//.test(ua)) return 'edge';
  if (/Chrome\//.test(ua)) return 'chrome-android';
  if (/Firefox\//.test(ua)) return 'firefox';
  return 'chrome-android';
}

const browserSteps = {
  'chrome-android': [
    { t: 'Buka <strong>⋮ (titik tiga)</strong> di pojok kanan atas Chrome.' },
    { t: 'Pilih <strong>Pengaturan (Settings)</strong>.' },
    { t: 'Ketuk <strong>Privasi dan keamanan</strong> → <strong>Izin situs</strong>.' },
    { t: 'Ketuk <strong>Kamera</strong>, cari situs ini, lalu pilih <strong>Izinkan</strong>.' },
    { t: 'Kembali ke halaman ini dan tekan <strong>Coba Nyalakan Kamera</strong>.' }
  ],
  'chrome-ios': [
    { t: 'Buka <strong>Pengaturan iPhone</strong> (Settings).' },
    { t: 'Gulir ke bawah, cari dan ketuk <strong>Chrome</strong>.' },
    { t: 'Pastikan <strong>Kamera</strong> dalam posisi <strong>NYALA (Hijau)</strong>.' },
    { t: 'Kembali ke Chrome, refresh halaman, lalu coba lagi.' }
  ],
  'safari-ios': [
    { t: 'Buka <strong>Pengaturan iPhone</strong> (Settings).' },
    { t: 'Gulir ke bawah, cari dan ketuk <strong>Safari</strong>.' },
    { t: 'Ketuk <strong>Kamera</strong> di bawah bagian <strong>Izin</strong>.' },
    { t: 'Pilih <strong>Izinkan</strong> atau <strong>Tanya</strong>.' },
    { t: 'Kembali ke Safari, refresh halaman, lalu coba lagi.' }
  ],
  'samsung': [
    { t: 'Buka <strong>⋮ (titik tiga)</strong> di pojok kanan bawah.' },
    { t: 'Pilih <strong>Pengaturan</strong> → <strong>Situs dan unduhan</strong> → <strong>Izin situs</strong>.' },
    { t: 'Ketuk <strong>Kamera</strong>, cari situs ini, pilih <strong>Izinkan</strong>.' },
    { t: 'Kembali ke halaman ini dan tekan <strong>Coba Nyalakan Kamera</strong>.' }
  ],
  'firefox': [
    { t: 'Ketuk <strong>⋮ (titik tiga)</strong> di pojok kanan atas.' },
    { t: 'Pilih <strong>Pengaturan</strong> → <strong>Privasi & Keamanan</strong> → <strong>Izin</strong>.' },
    { t: 'Ketuk <strong>Kamera</strong>, cari situs ini, ubah ke <strong>Izinkan</strong>.' },
    { t: 'Kembali ke halaman ini dan tekan <strong>Coba Nyalakan Kamera</strong>.' }
  ],
  'edge': [
    { t: 'Ketuk <strong>⋯ (titik tiga)</strong> di pojok kanan bawah.' },
    { t: 'Pilih <strong>Pengaturan</strong> → <strong>Privasi dan keamanan</strong> → <strong>Izin situs</strong>.' },
    { t: 'Ketuk <strong>Kamera</strong>, cari situs ini, pilih <strong>Izinkan</strong>.' },
    { t: 'Kembali ke halaman ini dan tekan <strong>Coba Nyalakan Kamera</strong>.' }
  ]
};

function showPermHelp() {
  const browser = detectBrowser();
  const steps = browserSteps[browser] || browserSteps['chrome-android'];
  const tagNames = {
    'chrome-android':'Chrome Android', 'chrome-ios':'Chrome iOS',
    'safari-ios':'Safari iOS', 'samsung':'Samsung Internet',
    'firefox':'Firefox', 'edge':'Microsoft Edge'
  };
  document.getElementById('browserTag').textContent = tagNames[browser] || 'Browser';
  document.getElementById('permSteps').innerHTML = steps.map((s,i) => `
    <div class="perm-help-step">
      <div class="perm-step-num">${i+1}</div>
      <div class="perm-step-text">${s.t}</div>
    </div>
  `).join('');
  document.getElementById('permHelpModal').classList.add('active');
}

function closePermHelp() {
  document.getElementById('permHelpModal').classList.remove('active');
}

function retryCameraAfterHelp() {
  closePermHelp();
  startCameraManual();
}

async function startCameraManual() {
  const btn = document.getElementById('btnStartCamera');
  const btnExt = document.getElementById('btnStartCameraExternal');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Menyalakan...'; }
  if (btnExt) { btnExt.disabled = true; btnExt.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div> Menyalakan...'; }
  try {
    await startCameraStream();
    hideCameraOverlay();
  } catch (err) {
    if (btn) { btn.disabled = false; btn.innerHTML = '&#128247; Coba Lagi'; }
    if (btnExt) { btnExt.disabled = false; btnExt.innerHTML = '<span style="font-size:22px;">&#128247;</span> Nyalakan Kamera Selfie'; }
    if (err.name === 'NotAllowedError') {
      showCameraError('Izin kamera ditolak. Lihat panduan di bawah.');
      showPermHelp(); // Auto-show guide
    } else if (err.name === 'NotFoundError') {
      showCameraError('Kamera tidak ditemukan di perangkat ini.');
    } else if (err.name === 'NotReadableError') {
      showCameraError('Kamera sedang digunakan aplikasi lain. Tutup aplikasi lain yang pakai kamera.');
    } else {
      showCameraError('Gagal menyalakan kamera: ' + err.message);
    }
  }
}

function stopCamera() {
  if (state.stream) {
    state.stream.getTracks().forEach(t => t.stop());
    state.stream = null;
  }
  const video = document.getElementById('video');
  if (video) {
    video.srcObject = null;
    video.pause();
  }
  document.getElementById('faceStatus').textContent = 'Kamera mati';
  document.getElementById('faceGuide').classList.remove('active');
}

async function startCameraStream() {
  const video = document.getElementById('video');
  // Stop existing stream first
  stopCamera();
  const constraints = {
    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false
  };
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    // Fallback: simpler constraints
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' }, audio: false
    });
  }
  state.stream = stream;
  video.srcObject = stream;
  // Wait for video to actually play
  await new Promise((resolve, reject) => {
    video.onloadedmetadata = () => {
      video.play().then(resolve).catch(reject);
    };
    video.onerror = reject;
    setTimeout(() => reject(new Error('Kamera timeout')), 10000);
  });
  document.getElementById('faceStatus').textContent = 'Siap ambil foto';
  document.getElementById('faceGuide').classList.add('active');
  document.getElementById('faceGuide').style.borderColor = '';
}

function showCameraOverlay() {
  document.getElementById('cameraStartOverlay').classList.remove('hidden');
  document.getElementById('cameraErrorBox').classList.add('hidden');
  const btnExt = document.getElementById('btnStartCameraExternal');
  if (btnExt) btnExt.style.display = 'flex';
}
function hideCameraOverlay() {
  document.getElementById('cameraStartOverlay').classList.add('hidden');
  const btnExt = document.getElementById('btnStartCameraExternal');
  if (btnExt) btnExt.style.display = 'none';
  // Tampilkan tombol "Matikan Kamera" (opsional, tapi user minta mati setelah foto)
  // Kamera akan mati otomatis setelah capture, jadi tidak perlu tombol mati manual
}
function showCameraError(msg) {
  const box = document.getElementById('cameraErrorBox');
  box.innerHTML = msg + ' <a href="#" onclick="showPermHelp();return false;" style="color:#8ab4f8;text-decoration:underline;font-weight:800;">Lihat Panduan</a>';
  box.classList.remove('hidden');
}

function capturePhoto() {
  if (document.getElementById('captureBtn').classList.contains('disabled')) return;
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const preview = document.getElementById('previewImg');
  if (!video.videoWidth || !video.videoHeight || video.readyState < 2) {
    showToast('Kamera belum siap, tap tombol Nyalakan Kamera dulu...', 'error');
    return;
  }
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.translate(canvas.width, 0); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0);
  state.photoData = canvas.toDataURL('image/jpeg', 0.7);
  preview.src = state.photoData; preview.style.display = 'block';
  video.style.display = 'none'; document.getElementById('retakeBtn').style.display = 'block';
  document.getElementById('captureBtn').classList.add('disabled');
  // MATIKAN kamera setelah dapat foto (privacy)
  stopCamera();
  showToast('Foto berhasil diambil', 'success'); playSound('success');
}

function retakePhoto() {
  document.getElementById('previewImg').style.display = 'none';
  document.getElementById('video').style.display = 'block';
  document.getElementById('retakeBtn').style.display = 'none';
  document.getElementById('captureBtn').classList.remove('disabled');
  state.photoData = null;
  // Kamera tetap mati, user harus tap tombol manual lagi untuk nyalakan
  stopCamera();
  showCameraOverlay();
}

function initGPS() {
  const statusEl = document.getElementById('gpsStatus');
  const gpsText = document.getElementById('gpsText');
  if (!navigator.geolocation) {
    statusEl.className = 'gps-alert bad';
    gpsText.textContent = 'GPS tidak didukung perangkat ini';
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.gps.lat = pos.coords.latitude; state.gps.lng = pos.coords.longitude; state.gps.accuracy = pos.coords.accuracy;
      const toko = state.tokoList.find(t => t.ID_Toko === document.getElementById('selectToko').value);
      if (toko && toko.Lat && toko.Long) {
        const jarak = hitungJarak(state.gps.lat, state.gps.lng, parseFloat(toko.Lat), parseFloat(toko.Long));
        state.gps.jarak = Math.round(jarak);
        const radius = parseFloat(toko.Radius_M) || 50;
        if (jarak <= radius) {
          statusEl.className = 'gps-alert ok';
          gpsText.textContent = `${Math.round(jarak)}m dari toko - Valid`;
        } else {
          statusEl.className = 'gps-alert bad';
          gpsText.textContent = `${Math.round(jarak)}m - Terlalu jauh (max ${radius}m)`;
        }
      } else {
        statusEl.className = 'gps-alert ok';
        gpsText.textContent = `GPS aktif (${Math.round(pos.coords.accuracy)}m akurasi)`;
      }
    },
    (err) => {
      statusEl.className = 'gps-alert bad';
      let msg = 'Gagal mendapatkan lokasi';
      if (err.code === 1) msg = 'Izin GPS ditolak. Aktifkan izin lokasi.';
      else if (err.code === 2) msg = 'Lokasi tidak tersedia.';
      else if (err.code === 3) msg = 'Timeout mendapatkan lokasi.';
      gpsText.textContent = msg;
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

function hitungJarak(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function loadTokoData() {
  try {
    const res = await apiCall('getTokoList');
    if (res.success && Array.isArray(res.data)) {
      state.tokoList = res.data.filter(t => t.Status === 'Aktif');
      const sel = document.getElementById('selectToko');
      sel.innerHTML = '<option value="">Pilih Toko...</option>';
      state.tokoList.forEach(t => { sel.innerHTML += `<option value="${t.ID_Toko}">${t.Nama_Toko}</option>`; });
      const selLembur = document.getElementById('lemburToko');
      selLembur.innerHTML = '';
      state.tokoList.forEach(t => { selLembur.innerHTML += `<option value="${t.ID_Toko}">${t.Nama_Toko}</option>`; });
      if (state.user.tokoDefault) { sel.value = state.user.tokoDefault; await onTokoChange(); }
    } else {
      console.log('getTokoList returned no data:', res);
    }
  } catch (e) { console.log('loadTokoData error:', e); }
}

async function onTokoChange() {
  const tokoId = document.getElementById('selectToko').value;
  const shiftSel = document.getElementById('selectShift');
  if (!tokoId) {
    shiftSel.innerHTML = '<option value="">Pilih Shift...</option>';
    document.getElementById('jamMasukInfo').style.display = 'none';
    return;
  }
  try {
    const res = await apiCall('getShiftByToko', { idToko: tokoId });
    if (res.success && Array.isArray(res.data)) {
      state.shiftList = res.data;
      shiftSel.innerHTML = '<option value="">Pilih Shift...</option>';
      res.data.forEach(s => {
        shiftSel.innerHTML += `<option value="${s.ID_Shift}">${s.Nama_Shift} (${s.Jam_Masuk || '--:--'} - ${s.Jam_Pulang || '--:--'})</option>`;
      });
      // Auto-select default shift if exists
      if (state.user.shiftDefault) {
        const exists = res.data.some(s => s.ID_Shift === state.user.shiftDefault);
        if (exists) shiftSel.value = state.user.shiftDefault;
      }
      updateShiftInfo();
    } else {
      shiftSel.innerHTML = '<option value="">Pilih Shift...</option>';
      console.log('getShiftByToko returned no data:', res);
    }
    initGPS();
  } catch (e) { console.log('onTokoChange error:', e); }
}

function checkAbsenStatus() {
  state.absenStatus = 'belum_masuk';
  updateButtonVisibility();
}

function updateButtonVisibility() {
  const bm = document.getElementById('btnMasuk');
  const bp = document.getElementById('btnPulang');
  const bl = document.getElementById('btnLembur');
  if (state.absenStatus === 'belum_masuk') {
    bm.classList.remove('hidden'); bp.classList.add('hidden'); bl.classList.add('hidden');
  } else if (state.absenStatus === 'sudah_masuk') {
    bm.classList.add('hidden'); bp.classList.remove('hidden'); bl.classList.remove('hidden');
  } else {
    bm.classList.add('hidden'); bp.classList.add('hidden'); bl.classList.add('hidden');
  }
}

async function absenMasuk() {
  if (!state.photoData) { tampilPicoModal('wajah_gagal', 'Ambil foto selfie dulu ya!'); return; }
  if (!state.user.id) { showToast('Login atau pilih nama dulu!', 'error'); playSound('error'); return; }
  if (!document.getElementById('selectToko').value) { showToast('Pilih toko dulu!', 'error'); playSound('error'); return; }
  if (!document.getElementById('selectShift').value) { showToast('Pilih shift dulu!', 'error'); playSound('error'); return; }

  const toko = state.tokoList.find(t => t.ID_Toko === document.getElementById('selectToko').value);
  if (toko && state.gps.jarak !== null) {
    const radius = parseFloat(toko.Radius_M) || 50;
    if (state.gps.jarak > radius) { tampilPicoModal('gps_jauh', `Anda ${state.gps.jarak}m dari toko. Maksimal ${radius}m.<br>Silakan mendekat!`); return; }
  }

  // PERBAIKAN: Menangkap teks nama shift dari dropdown untuk dikirim ke backend
  const shiftSelect = document.getElementById('selectShift');
  const shiftName = shiftSelect.options[shiftSelect.selectedIndex].text.split(' (')[0];

  const btn = document.getElementById('btnMasuk');
  btn.disabled = true; btn.innerHTML = '<div class="spinner"></div> Memproses...';
  try {
    const res = await apiCall('absenMasuk', {
      idKaryawan: state.user.id, nama: state.user.name,
      idToko: document.getElementById('selectToko').value, namaToko: toko ? toko.Nama_Toko : '',
      idShift: document.getElementById('selectShift').value,
      namaShift: shiftName, // <--- TAMBAHAN AGAR SINKRON
      fotoBase64: state.photoData, lat: state.gps.lat, lng: state.gps.lng
    });
    if (res.success) {
      state.absenStatus = 'sudah_masuk'; updateButtonVisibility();
      tampilPicoModal('sukses', `<b>Absen Masuk Berhasil!</b><br>Jam: ${res.jamMasuk}<br>Status: ${res.statusMasuk}`);
      retakePhoto();
    } else { tampilPicoModal('error', res.error || 'Gagal absen masuk'); }
  } catch (e) { tampilPicoModal('error', 'Gagal absen: ' + e.message); }
  finally { btn.disabled = false; btn.innerHTML = '<span style="font-size:22px;">●</span> ABSEN MASUK'; }
}

async function absenPulang() {
  if (!state.photoData) { tampilPicoModal('wajah_gagal', 'Ambil foto selfie dulu ya!'); return; }
  if (!state.user.id) { showToast('Login atau pilih nama dulu!', 'error'); playSound('error'); return; }
  const btn = document.getElementById('btnPulang');
  btn.disabled = true; btn.innerHTML = '<div class="spinner"></div> Memproses...';
  try {
    const res = await apiCall('absenPulang', {
      idKaryawan: state.user.id, nama: state.user.name,
      fotoBase64: state.photoData, lat: state.gps.lat, lng: state.gps.lng
    });
    if (res.success) {
      state.absenStatus = 'sudah_pulang'; updateButtonVisibility();
      tampilPicoModal('izin_pulang', `<b>Absen Pulang Berhasil!</b><br>Durasi: ${res.durasiKerja}<br>Hati-hati di jalan!`);
      retakePhoto();
    } else { tampilPicoModal('error', res.error || 'Gagal absen pulang'); }
  } catch (e) { tampilPicoModal('error', 'Gagal: ' + e.message); }
  finally { btn.disabled = false; btn.innerHTML = '<span style="font-size:22px;">&#9679;</span> ABSEN PULANG'; }
}

function toggleLemburMode() { openModal('modalLembur'); }

async function submitLembur() {
  if (!state.user.id) { showToast('Login atau pilih nama dulu!', 'error'); return; }
  const tokoId = document.getElementById('lemburToko').value;
  const toko = state.tokoList.find(t => t.ID_Toko === tokoId);
  try {
    await apiCall('ajukanLembur', {
      idKaryawan: state.user.id, nama: state.user.name,
      idToko: tokoId, namaToko: toko ? toko.Nama_Toko : '',
      jamMulai: document.getElementById('lemburJamMulai').value,
      alasan: document.getElementById('lemburAlasanType').value,
      fotoBase64: state.photoData || ''
    });
    closeModal('modalLembur');
    tampilPicoModal('lembur_pending', 'Pengajuan lembur terkirim!<br>Tunggu approve dari Bos ya!');
  } catch (e) { showToast('Gagal ajukan lembur', 'error'); }
}

function selectIzin(el, type) {
  document.querySelectorAll('.izin-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

async function submitIzin() {
  if (!state.user.id) { showToast('Login atau pilih nama dulu!', 'error'); return; }
  const tglMulai = document.getElementById('izinTglMulai').value;
  const tglSelesai = document.getElementById('izinTglSelesai').value;
  const alasan = document.getElementById('izinAlasan').value;
  if (!tglMulai || !tglSelesai) { showToast('Pilih tanggal dulu!', 'error'); return; }
  if (!alasan.trim()) { showToast('Isi alasan dulu!', 'error'); return; }

  // PERBAIKAN: Mengambil jenis izin dinamis dari chip yang sedang diklik user
  const activeChip = document.querySelector('.izin-chip.active');
  const namaJenis = activeChip ? activeChip.textContent.trim() : 'Izin';
  const idJenis = 'JI_' + namaJenis.toUpperCase(); 

  try {
    await apiCall('ajukanIzin', {
      idKaryawan: state.user.id, nama: state.user.name,
      idJenisIzin: idJenis, namaJenis: namaJenis, // <--- TIDAK LAGI HARDCODE
      tglMulai, tglSelesai, alasan, lampiranBase64: ''
    });
    closeModal('modalIzin');
    tampilPicoModal('izin_cuti', 'Pengajuan izin terkirim!<br>Menunggu approve admin');
  } catch (e) { showToast('Gagal ajukan izin', 'error'); }
}

function toggleLemburAlasan() {
  const val = document.getElementById('lemburAlasanType').value;
  document.getElementById('lemburAlasanManual').classList.toggle('hidden', val !== 'lainnya');
}

function navJadwal(dir) { state.jadwalOffset += dir; renderJadwal(); }

async function renderJadwal() {
  if (!state.user.id) { showToast('Login atau pilih nama dulu!', 'error'); return; }
  try {
    const now = new Date(); now.setDate(now.getDate() + state.jadwalOffset * 7);
    const res = await apiCall('getJadwalMingguan', { idKaryawan: state.user.id, tanggalReferensi: now.toISOString() });
    if (res.success) {
      const tbody = document.getElementById('jadwalTbody');
      tbody.innerHTML = res.minggu.map(j => `
        <tr class="${j.libur ? 'libur' : ''} ${j.namaHari === new Date().toLocaleDateString('id-ID',{weekday:'long'}) && state.jadwalOffset===0 ? 'today' : ''}">
          <td><div class="hari">${j.namaHari}</div><div class="tanggal">${j.tanggal}</div></td>
          <td>${j.toko !== '-' ? '<span class="badge badge-blue">'+j.toko+'</span>' : '-'}</td>
          <td>${j.shift !== '-' ? '<span class="badge badge-green">'+j.shift+'</span>' : '-'}</td>
          <td>${j.jamMasuk !== '-' ? j.jamMasuk + ' - ' + j.jamPulang : '-'}</td>
        </tr>
      `).join('');
      const senin = new Date(now); senin.setDate(now.getDate() - now.getDay() + 1);
      const minggu = new Date(senin); minggu.setDate(senin.getDate() + 6);
      document.getElementById('jadwalPeriode').textContent = senin.toLocaleDateString('id-ID',{day:'numeric',month:'short'}) + ' - ' + minggu.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
    }
  } catch (e) { console.log('renderJadwal error:', e); }
}

async function renderRaport() {
  if (!state.user.id) { showToast('Login atau pilih nama dulu!', 'error'); return; }
  try {
    const now = new Date();
    const res = await apiCall('getRaportBulanan', { idKaryawan: state.user.id, bulan: now.getMonth()+1, tahun: now.getFullYear() });
    if (res.success) {
      document.getElementById('statHadir').textContent = res.totalHadir;
      document.getElementById('statTelat').textContent = res.totalTelat;
      document.getElementById('statJam').textContent = res.totalJamKerja + 'j';
      document.getElementById('raportPreview').textContent = res.totalHadir + ' hadir, ' + res.totalTelat + ' telat';
      const tbody = document.getElementById('raportTbody');
      tbody.innerHTML = res.detailHarian.map(d => `
        <tr>
          <td>${d.tanggal}</td><td>${d.toko}</td><td>${d.shift}</td>
          <td>${d.status==='Ontime' ? '<span style="color:var(--success);font-weight:700;">Ontime</span>' : '<span style="color:var(--danger);font-weight:700;">Telat '+(d.menitTelat||0)+'m</span>'}</td>
        </tr>
      `).join('');
    }
  } catch (e) { console.log('renderRaport error:', e); }
}

function downloadRaport() { showToast('Download raport dimulai...', 'info'); }

function openModal(id) {
  document.getElementById(id).classList.add('active');
  document.body.style.overflow = 'hidden';
  if (id === 'modalRaport') renderRaport();
  if (id === 'modalJadwal') renderJadwal();
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  document.body.style.overflow = '';
}

function closeModalOnOverlay(e, id) { if (e.target.id === id) closeModal(id); }

function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  event.currentTarget.classList.add('active');
}

function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast toast-${type} show`;
  setTimeout(() => toast.classList.remove('show'), 4000);
}



// ============================================
// KONFIGURASI BACKEND (Google Apps Script)
// ============================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbySMzB3SsqaMqJITxhXu1eWorAB_I5BboEcqNcncwLfSo4Iu_vDvGu50rth3IM6g2I/exec';

// ============================================
// FUNGSI API CALL (Fetch untuk GitHub Pages)
// ============================================
async function apiCall(action, payload = {}) {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action, ...payload })
    });

    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ': ' + response.statusText);
    }

    const text = await response.text();

    // Handle JSONP or plain JSON response
    let data;
    try {
      // Try to extract JSON from JSONP wrapper if present
      const jsonMatch = text.match(/^[^{]*(\{.*\})[^}]*$/);
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[1]);
      } else {
        data = JSON.parse(text);
      }
    } catch (e) {
      console.error('Parse error:', text);
      throw new Error('Gagal parse response dari server');
    }

    if (!data) {
      throw new Error("Server mengembalikan null");
    }

    return data;
  } catch (error) {
    console.error('[API ERROR]', action, error);
    throw error;
  }
}

function logout() {
  if (confirm('Yakin ingin logout?')) {
    stopCamera();
    showToast('Logout berhasil', 'info');
    setTimeout(() => location.reload(), 500);
  }
}

document.addEventListener('touchstart', function(){}, { passive: true });
