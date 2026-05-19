// ==================== STATE ====================
let currentPage = 'dashboard';
let tokoData = [];
let karyawanData = [];
let shiftData = [];
let absensiData = [];
let notifData = [];
let jenisIzinData = [];
let currentLaporanMode = 'harian';
let editingTokoId = null;
let isLoading = false;

// ==================== API CORE (ANTI MACET) ====================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxDyDhOWjdbi1dO9HBbcSEZumOkBGlg2Z4UzJ-YqcirnX7u487kUUOYota52PV-5BlN/exec';

async function apiCall(action, payload = {}) {
  if (isLoading) return Promise.reject(new Error('Sedang memproses...'));
  isLoading = true;
  
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action, ...payload })
    });
    const data = await res.json();
    isLoading = false;
    if (data.success === false) throw new Error(data.error || 'Error tidak diketahui');
    return data;
  } catch (e) {
    isLoading = false;
    throw e;
  }
}

// ==================== AUDIO ====================
function playSound(type) {
  const audio = document.getElementById(type === 'success' ? 'soundSuccess' : type === 'error' ? 'soundError' : 'soundNotif');
  if (audio) { audio.currentTime = 0; audio.play().catch(()=>{}); }
}

// ==================== NAV & ROUTING ====================
function showPage(page) {
  currentPage = page;
  document.querySelectorAll('[id^="page-"]').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.remove('hidden');
  
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => { 
    if(el.getAttribute('onclick')?.includes(page)) el.classList.add('active'); 
  });

  const titles = {
    'dashboard': '📊 Dashboard', 
    'laporan': '📈 Laporan Absensi', 
    'notifikasi': '🔔 Notifikasi',
    'absensi': '📋 Data Absensi', 
    'setting-toko': '🏪 Setting Toko',
    'setting-karyawan': '👤 Setting Karyawan',
    'setting-jadwal': '📅 Setting Jadwal',     // TAMBAH
    'setting-izin': '📋 Setting Izin/Cuti',
    'setting-global': '⚙️ Setting Global'
  };
  const titleEl = document.getElementById('pageTitle');
  if(titleEl) titleEl.textContent = titles[page] || 'Dashboard';
  
  // Load data per halaman agar sinkron
  if (page === 'dashboard') loadDashboard();
  if (page === 'laporan') { 
  currentLaporanMode = 'harian'; 
  populateLaporanKaryawan(); 
  loadLaporan(); 
}
  if (page === 'notifikasi') { loadNotifPage(); }
  if (page === 'absensi') { loadAbsensiFull(); }
  if (page === 'setting-toko') loadTokoData();
  if (page === 'setting-karyawan') { 
  loadKaryawanData(); 
  loadTokoData(); 
  loadAllShiftData(); // Preload shift data
}
if (page === 'setting-jadwal') {           // TAMBAH
    populateJadwalTokoSelect();
    updateWeekDisplayJadwal();
    loadJadwalGrid();
}
  if (page === 'setting-izin') loadJenisIzinData();
  if (page === 'setting-global') loadGlobalSettings();
  
  if (window.innerWidth <= 768) document.getElementById('sidebar')?.classList.remove('open');
}

function toggleSidebar() { document.getElementById('sidebar')?.classList.toggle('open'); }

// ==================== DASHBOARD (SEQUENTIAL LOAD) ====================
async function loadDashboard() {
  showToast('⏳ Memuat dashboard...', 'info');
  try {
    // Sequential = lebih stabil di GAS daripada Promise.all
    const dash = await apiCall('getDashboardData', {});
    if (dash.success) {
      document.getElementById('statTotalKaryawan').textContent = dash.stats?.totalKaryawan || 0;
      document.getElementById('statHadir').textContent = dash.stats?.hadirHariIni || 0;
      document.getElementById('statPending').textContent = dash.stats?.pendingApproval || 0;
      document.getElementById('statTelat').textContent = dash.stats?.telatHariIni || 0;
    }
    
    const mon = await apiCall('getMonitoringToko', {});
    if (mon.success) renderTokoCards(mon.toko || []);
    
    const absen = await apiCall('getAbsensiHariIniLengkap', {});
    if (absen.success) { 
      absensiData = absen.data || []; 
      renderAbsensiTable(); 
      updateAbsensiFilters(); 
    }
    
    const notif = await apiCall('getPendingApprovals', {});
    if (notif.success) { 
      notifData = notif.data || []; 
      renderNotifList(); 
      updateNotifBadge(notifData.length); 
    }
    
    showToast('✅ Dashboard siap!', 'success');
  } catch (e) {
    console.error(e);
    showToast('❌ Gagal memuat: ' + e.message, 'error');
  }
}

function updateNotifBadge(count) {
  const el1 = document.getElementById('notifCount');
  const el2 = document.getElementById('topbarBadge');
  if(el1) el1.textContent = count;
  if(el2) el2.textContent = count;
  if (count > 0) playSound('notif');
}

// ==================== RENDER DASHBOARD ====================
function renderTokoCards(tokoList) {
  const grid = document.getElementById('tokoGrid');
  if (!grid) return;
  
  if (!tokoList || tokoList.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-secondary);">Belum ada data toko</div>';
    return;
  }
  
  grid.innerHTML = tokoList.map(t => {
    const karyawan = t.karyawan || [];
    const chips = karyawan.map(k => {
      const statusClass = k.status === 'hadir' ? 'hadir' : k.status === 'telat' ? 'telat' : k.status === 'izin' ? 'izin' : 'belum';
      const dotColor = k.status === 'hadir' ? 'var(--success)' : k.status === 'telat' ? 'var(--danger)' : k.status === 'izin' ? 'var(--primary)' : '#9aa0a6';
      return `<span class="karyawan-chip ${statusClass}"><span class="karyawan-dot" style="background:${dotColor}"></span>${k.nama}${k.menitTelat > 0 ? ' ('+k.menitTelat+'m)' : ''}</span>`;
    }).join('');
    
    const fotoUrl = t.fotoUrl ? getDirectImageUrl(t.fotoUrl) : '';
    const hasFoto = fotoUrl && fotoUrl.length > 10;
    
    return `
      <div class="toko-card">
        <div class="toko-img" style="
          background: ${hasFoto ? `url('${fotoUrl}')` : 'linear-gradient(135deg, var(--primary), #4285f4)'};
          background-size: cover;
          background-position: center;
          position: relative;
        ">
          ${hasFoto ? `<img src="${fotoUrl}" style="display:none;" onerror="this.parentElement.style.background='linear-gradient(135deg, var(--primary), #4285f4)'">` : ''}
          <div style="background:rgba(26,115,232,0.7);width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:700;position:relative;z-index:1;">
            ${t.namaToko}
          </div>
        </div>
        <div class="toko-body">
          <div class="toko-header">
            <span class="toko-name">${t.namaToko}</span>
            <span class="toko-badge">${t.totalOnline || 0}/${t.totalKaryawan || 0} Online</span>
          </div>
          <div class="toko-karyawan-list">${chips || '<span style="font-size:12px;color:var(--text-secondary);">Belum ada karyawan aktif</span>'}</div>
        </div>
      </div>`;
  }).join('');
}

function renderAbsensiTable(data = absensiData) {
  const tbody = document.getElementById('absensiTbody');
  if(!tbody) return;
  tbody.innerHTML = (data || []).map(a => {
    const statusBadge = a.status === 'Ontime' ? '<span class="td-badge green">🟢 Ontime</span>' : '<span class="td-badge red">🔴 Telat</span>';
    const lemburBadge = a.statusLembur === 'Approved' ? '<span class="td-badge green">Approved</span>' : a.statusLembur === 'Pending' ? '<span class="td-badge yellow">Pending</span>' : '<span class="td-badge gray">—</span>';
    const fotoMasuk = a.fotoMasuk ? `<img src="${a.fotoMasuk}" class="foto-thumb" onclick="window.open('${a.fotoMasuk}')">` : '—';
    return `
      <tr>
        <td><strong>${a.nama}</strong></td>
        <td><span class="td-badge blue">${a.toko}</span></td>
        <td><span class="td-badge blue">${a.shift}</span></td>
        <td>${a.jamMasuk}</td>
        <td>${a.jamPulang || '—'}</td>
        <td>${a.durasiKerja || '—'}</td>
        <td>${a.durasiLembur || '—'}</td>
        <td>${statusBadge}</td>
        <td>${a.menitTelat > 0 ? '<span style="color:var(--danger);font-weight:600;">'+a.menitTelat+'m</span>' : '—'}</td>
        <td>${lemburBadge}</td>
        <td>${a.tokoLembur !== '—' ? '<span class="td-badge blue">'+a.tokoLembur+'</span>' : '—'}</td>
        <td>${fotoMasuk}</td>
      </tr>`;
  }).join('');
  const footer = document.getElementById('absensiFooter');
  if(footer) footer.textContent = `Menampilkan ${data.length} data`;
}

function updateAbsensiFilters() {
  const tokoSet = new Set((absensiData || []).map(a => a.toko).filter(Boolean));
  const shiftSet = new Set((absensiData || []).map(a => a.shift).filter(Boolean));
  const tokoSel = document.getElementById('filterToko');
  const shiftSel = document.getElementById('filterShift');
  if(tokoSel) {
    const cur = tokoSel.value;
    tokoSel.innerHTML = '<option value="">Semua Toko</option>' + Array.from(tokoSet).map(t => `<option value="${t}">${t}</option>`).join('');
    tokoSel.value = cur;
  }
  if(shiftSel) {
    const cur = shiftSel.value;
    shiftSel.innerHTML = '<option value="">Semua Shift</option>' + Array.from(shiftSet).map(s => `<option value="${s}">${s}</option>`).join('');
    shiftSel.value = cur;
  }
}

function filterAbsensi() {
  const search = document.getElementById('searchAbsen')?.value.toLowerCase() || '';
  const toko = document.getElementById('filterToko')?.value || '';
  const shift = document.getElementById('filterShift')?.value || '';
  const filtered = (absensiData || []).filter(a => {
    return (a.nama?.toLowerCase() || '').includes(search) && 
           (!toko || a.toko === toko) && 
           (!shift || a.shift === shift);
  });
  renderAbsensiTable(filtered);
}

// ==================== NOTIFIKASI ====================
function renderNotifList(targetId = 'notifList') {
  const container = document.getElementById(targetId);
  if (!container) return;
  if (!notifData || notifData.length === 0) {
    container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-secondary);">Tidak ada notifikasi menunggu</div>';
    return;
  }
  
  container.innerHTML = notifData.map(n => {
    const isLembur = n.tipe === 'lembur';
    const typeClass = isLembur ? 'lembur' : 'izin';
    const typeLabel = isLembur ? 'Lembur' : 'Izin';
    const detailText = isLembur 
      ? (n.detail || 'Pengajuan lembur') + ' • ' + n.waktu
      : (n.detail || 'Pengajuan izin');
    
    return `
      <div class="notif-item">
        <div class="notif-info">
          <div class="notif-avatar">${(n.nama || '?').charAt(0)}</div>
          <div class="notif-text">
            <h4>${n.nama} <span class="notif-type ${typeClass}">${typeLabel}</span></h4>
            <p>${detailText}</p>
          </div>
        </div>
        <div class="notif-actions">
          <button class="btn-sm btn-approve" onclick="approveNotif('${n.id}', '${n.tipe}', 'Approved')">✅</button>
          <button class="btn-sm btn-reject" onclick="approveNotif('${n.id}', '${n.tipe}', 'Rejected')">❌</button>
        </div>
      </div>`;
  }).join('');
}

async function loadNotifPage() {
  try {
    // Populate dropdown target karyawan
    const targetSel = document.getElementById('notifTargetKaryawan');
    if (targetSel) {
      if (karyawanData.length === 0) {
        await loadKaryawanData();
      }
      targetSel.innerHTML = '<option value="ALL">📢 Kirim ke Semua Karyawan</option>';
      karyawanData.filter(k => k.Status === 'Aktif').forEach(k => {
        targetSel.innerHTML += `<option value="${k.ID_Karyawan}">${k.Nama} (${k.Jabatan})</option>`;
      });
    }

    const notif = await apiCall('getPendingApprovals', {});
    if (notif.success) {
      notifData = notif.data || [];
      renderNotifList('allNotifList');
    }
  } catch(e) { 
    console.error(e);
    showToast('Gagal load notifikasi', 'error'); 
  }
}

async function approveNotif(id, tipe, status) {
  try {
    const fn = tipe === 'lembur' ? 'approveLembur' : 'approveIzin';
    const payload = tipe === 'lembur' 
      ? { idLembur: id, status: status, approvedBy: 'Admin' }
      : { idIzin: id, status: status, approvedBy: 'Admin' };
    const result = await apiCall(fn, payload);
    showToast(result.message || 'Berhasil', 'success');
    playSound('success');
    loadDashboard();
    loadNotifPage();
  } catch (e) {
    showToast('Gagal: ' + e.message, 'error');
    playSound('error');
  }
}

async function sendManualNotification() {
  const idKaryawan = document.getElementById('notifTargetKaryawan').value;
  const title = document.getElementById('notifTitle').value.trim();
  const message = document.getElementById('notifBody').value.trim();
  const channelId = document.getElementById('notifChannel').value;

  if (!title || !message) {
    showToast('⚠️ Judul dan pesan wajib diisi!', 'warning');
    return;
  }

  showToast('⏳ Mengirim notifikasi...', 'info');
  try {
    const res = await apiCall('sendManualPushNotification', {
      idKaryawan,
      title,
      message,
      channelId
    });

    if (res.success) {
      showToast('🚀 ' + res.message, 'success');
      playSound('success');
      document.getElementById('notifTitle').value = '';
      document.getElementById('notifBody').value = '';
    } else {
      showToast('❌ Gagal: ' + (res.error || 'Unknown error'), 'error');
      playSound('error');
    }
  } catch (e) {
    showToast('❌ Error: ' + e.message, 'error');
    playSound('error');
  }
}

// ==================== LAPORAN ====================
// ==================== LAPORAN V2 ====================
function switchLaporan(mode) {
  currentLaporanMode = mode;
  document.querySelectorAll('.laporan-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  // Hide all inputs
  document.getElementById('laporanTanggal')?.classList.add('hidden');
  document.getElementById('laporanBulan')?.classList.add('hidden');
  document.getElementById('laporanTahun')?.classList.add('hidden');
  
  if (mode === 'harian') {
    document.getElementById('laporanTanggal')?.classList.remove('hidden');
  } else if (mode === 'mingguan') {
    // Otomatis minggu ini, tidak perlu input manual
  } else if (mode === 'bulanan') {
    document.getElementById('laporanBulan')?.classList.remove('hidden');
  } else if (mode === 'tahunan') {
    document.getElementById('laporanTahun')?.classList.remove('hidden');
  }
  
  loadLaporan();
}

async function loadLaporan() {
  try {
    const payload = { mode: currentLaporanMode };
    const karyawanId = document.getElementById('laporanKaryawan')?.value;
    const idToko = document.getElementById('laporanToko')?.value;
    const idShift = document.getElementById('laporanShift')?.value;
    
    if (karyawanId) payload.idKaryawan = karyawanId;
    if (idToko) payload.idToko = idToko;
    if (idShift) payload.idShift = idShift;
    
    if (currentLaporanMode === 'harian') {
      payload.tanggal = document.getElementById('laporanTanggal')?.value || new Date().toISOString().split('T')[0];
    } else if (currentLaporanMode === 'mingguan') {
      const now = new Date();
      const day = now.getDay();
      const diffToSenin = now.getDate() - day + (day === 0 ? -6 : 1);
      const senin = new Date(now); senin.setDate(diffToSenin);
      const minggu = new Date(senin); minggu.setDate(senin.getDate() + 6);
      payload.tanggalMulai = senin.toISOString().split('T')[0];
      payload.tanggalAkhir = minggu.toISOString().split('T')[0];
    } else if (currentLaporanMode === 'bulanan') {
      const bm = document.getElementById('laporanBulan')?.value || new Date().toISOString().slice(0,7);
      const [th, bl] = bm.split('-');
      payload.bulan = parseInt(bl);
      payload.tahun = parseInt(th);
    } else if (currentLaporanMode === 'tahunan') {
      payload.tahun = parseInt(document.getElementById('laporanTahun')?.value) || new Date().getFullYear();
    }
    
    // Load absensi
    const res = await apiCall('getLaporanAbsensi', payload);
    let laporanData = [];
    if (res.success) {
      laporanData = res.data || [];
      renderLaporanTable(laporanData);
      populateLaporanFilters(laporanData);
    }
    
    // Jika per karyawan, load izin & hitung statistik
    if (karyawanId && laporanData.length > 0) {
      const izinRes = await apiCall('getIzinPeriode', payload);
      const izinData = izinRes.success ? izinRes : { totalIzin: 0, detail: [] };
      hitungStatistikLaporan(laporanData, izinData, payload);
    } else {
      document.getElementById('laporanStatistik')?.classList.add('hidden');
    }
    
  } catch (e) {
    showToast('Gagal memuat laporan: ' + e.message, 'error');
    console.error(e);
  }
}
function renderLaporanTable(data) {
  const tbody = document.getElementById('laporanTbody');
  const footer = document.getElementById('laporanFooter');
  const table = document.getElementById('laporanTable');
  if(!tbody) return;
  
  table?.classList.add('compact');
  
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-secondary);">Tidak ada data absensi</td></tr>';
    if(footer) footer.textContent = 'Menampilkan 0 data';
    return;
  }
  
  tbody.innerHTML = data.map(a => {
    // Status badge
    const statusBadge = a.status === 'Ontime' 
      ? '<span class="td-badge green" style="font-size:11px;">🟢 Ontime</span>' 
      : '<span class="td-badge red" style="font-size:11px;">🔴 Telat ' + (a.menitTelat || 0) + 'm</span>';
    
    // Lembur info
    const lemburDurasi = a.durasiLembur && a.durasiLembur !== '—' ? a.durasiLembur : '—';
    const lemburStatus = a.statusLembur === 'Approved' 
      ? '<span class="td-badge green" style="font-size:10px;">✅ Approved</span>' 
      : a.statusLembur === 'Pending' 
        ? '<span class="td-badge yellow" style="font-size:10px;">⏳ Pending</span>' 
        : '<span class="td-badge gray" style="font-size:10px;">—</span>';
    
    // Foto group (3 foto dalam 1 kolom)
    let fotoHtml = '<div class="foto-group">';
    if (a.fotoMasuk) {
      fotoHtml += `<div style="text-align:center;"><img src="${a.fotoMasuk}" class="foto-thumb" onclick="window.open('${a.fotoMasuk}')"><div class="foto-label">Masuk</div></div>`;
    }
    if (a.fotoPulang) {
      fotoHtml += `<div style="text-align:center;"><img src="${a.fotoPulang}" class="foto-thumb" onclick="window.open('${a.fotoPulang}')"><div class="foto-label">Pulang</div></div>`;
    }
    if (a.fotoLembur) {
      fotoHtml += `<div style="text-align:center;"><img src="${a.fotoLembur}" class="foto-thumb lembur" onclick="window.open('${a.fotoLembur}')"><div class="foto-label">Lembur</div></div>`;
    }
    fotoHtml += '</div>';
    if (fotoHtml === '<div class="foto-group"></div>') fotoHtml = '<span style="font-size:11px;color:var(--text-secondary);">—</span>';
    
    return `
      <tr>
        <td style="white-space:nowrap;">
          <div class="info-block">
            <span style="font-weight:600;">${a.tanggal}</span>
            <small style="color:var(--text-secondary);">${new Date(a.tanggal).toLocaleDateString('id-ID',{weekday:'long'})}</small>
          </div>
        </td>
        <td>
          <div class="info-block">
            <div class="info-line"><strong>${a.nama}</strong></div>
            <div class="info-line"><small>🏪 ${a.toko}</small></div>
            <div class="info-line"><small>🕐 ${a.shift}</small></div>
          </div>
        </td>
        <td style="white-space:nowrap;">
          <div class="info-block">
            <div class="info-line"><span style="color:var(--success);">▶ ${a.jamMasuk}</span></div>
            <div class="info-line"><span style="color:var(--danger);">◀ ${a.jamPulang !== '—' ? a.jamPulang : '—'}</span></div>
            <div class="info-line"><small>⏱ ${a.durasiKerja !== '—' ? a.durasiKerja : '—'}</small></div>
          </div>
        </td>
        <td>
          <div class="info-block">
            <div class="info-line">${statusBadge}</div>
            <div class="info-line"><small>${a.menitTelat > 0 ? '⏱ ' + a.menitTelat + ' menit' : 'Tepat waktu'}</small></div>
          </div>
        </td>
        <td>
          <div class="info-block">
            <div class="info-line"><strong>${lemburDurasi}</strong></div>
            <div class="info-line">${lemburStatus}</div>
            <div class="info-line"><small>${a.tokoLembur !== '—' ? '🏪 ' + a.tokoLembur : ''}</small></div>
          </div>
        </td>
        <td>${fotoHtml}</td>
      </tr>`;
  }).join('');
  
  if(footer) footer.textContent = `Menampilkan ${data.length} data`;
}
/*function renderLaporanTableCompact(data) {
  const tbody = document.getElementById('laporanTbody');
  const footer = document.getElementById('laporanFooter');
  if(!tbody) return;
  
  tbody.innerHTML = (data || []).map(a => {
    const statusBadge = a.status === 'Ontime' ? '<span class="td-badge green">Ontime</span>' : '<span class="td-badge red">Telat</span>';
    const lemburBadge = a.statusLembur === 'Approved' ? '<span class="td-badge green">Approved</span>' : a.statusLembur === 'Pending' ? '<span class="td-badge yellow">Pending</span>' : '<span class="td-badge gray">—</span>';
    const fm = a.fotoMasuk ? `<img src="${a.fotoMasuk}" class="foto-thumb" onclick="window.open('${a.fotoMasuk}')">` : '—';
    const fp = a.fotoPulang ? `<img src="${a.fotoPulang}" class="foto-thumb" onclick="window.open('${a.fotoPulang}')">` : '—';
    const fl = a.fotoLembur ? `<img src="${a.fotoLembur}" class="foto-thumb" onclick="window.open('${a.fotoLembur}')">` : '—';
    return `
      <tr>
        <td>${a.tanggal}</td><td><strong>${a.nama}</strong></td>
        <td><span class="td-badge blue">${a.toko}</span></td>
        <td><span class="td-badge blue">${a.shift}</span></td>
        <td>${a.jamMasuk}</td><td>${fm}</td><td>${fp}</td><td>${fl}</td>
        <td>${a.jamPulang}</td><td>${a.durasiKerja}</td><td>${a.durasiLembur}</td>
        <td>${statusBadge}</td><td>${a.menitTelat || '—'}</td>
        <td>${lemburBadge}</td><td>${a.tokoLembur !== '—' ? '<span class="td-badge blue">'+a.tokoLembur+'</span>' : '—'}</td>
      </tr>`;
  }).join('');
  
  if(footer) footer.textContent = `Menampilkan ${data.length} data`;
}
*/
function populateLaporanFilters(data) {
  const tokoSet = new Set((data || []).map(a => a.toko).filter(Boolean));
  const shiftSet = new Set((data || []).map(a => a.shift).filter(Boolean));
  
  const tokoSel = document.getElementById('laporanToko');
  const shiftSel = document.getElementById('laporanShift');
  
  if(tokoSel) {
    const cur = tokoSel.value;
    tokoSel.innerHTML = '<option value="">🏪 Semua Toko</option>' + Array.from(tokoSet).map(t => `<option value="${t}">${t}</option>`).join('');
    tokoSel.value = cur;
  }
  if(shiftSel) {
    const cur = shiftSel.value;
    shiftSel.innerHTML = '<option value="">🕐 Semua Shift</option>' + Array.from(shiftSet).map(s => `<option value="${s}">${s}</option>`).join('');
    shiftSel.value = cur;
  }
}
// ==================== FORMAT WAKTU ====================
function formatJamToko(value) {
  if (!value) return '';
  
  // Sudah string HH:mm
  if (typeof value === 'string' && value.match(/^\d{1,2}:\d{2}$/)) {
    return value;
  }
  
  // Fix bug 1899-12-30 (epoch Sheets untuk time-only)
  if (value instanceof Date) {
    const epoch = new Date(1899, 11, 30);
    // Jika tanggal epoch, ambil jam:menit saja
    const jam = String(value.getHours()).padStart(2, '0');
    const menit = String(value.getMinutes()).padStart(2, '0');
    return `${jam}:${menit}`;
  }
  
  // String ISO (1899-12-30T17:00:00.000Z)
  if (typeof value === 'string' && value.includes('T')) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const jam = String(date.getHours()).padStart(2, '0');
      const menit = String(date.getMinutes()).padStart(2, '0');
      return `${jam}:${menit}`;
    }
  }
  
  return String(value);
}
/**
 * Format angka jam (desimal) menjadi "X jam Y menit"
 * Contoh: 8.5 → "8 jam 30 menit", 7.25 → "7 jam 15 menit"
 */
function formatJamMenit(jamDesimal) {
  if (!jamDesimal || jamDesimal <= 0) return '0 jam 0 menit';
  
  const jam = Math.floor(jamDesimal);
  const menit = Math.round((jamDesimal - jam) * 60);
  
  if (jam === 0) return menit + ' menit';
  if (menit === 0) return jam + ' jam';
  return jam + ' jam ' + menit + ' menit';
}

/**
 * Format angka hari (desimal) menjadi "X hari Y jam Z menit"
 * Contoh: 23.5 → "23 hari 4 jam 30 menit" (asumsi 9 jam/hari)
 *          1.5 → "1 hari 4 jam 30 menit"
 */
function formatHariJamMenit(hariDesimal) {
  if (!hariDesimal || hariDesimal <= 0) return '0 hari 0 jam 0 menit';
  
  const hari = Math.floor(hariDesimal);
  const sisaJamDesimal = (hariDesimal - hari) * 9; // Konversi sisa hari ke jam (9 jam/shift)
  const jam = Math.floor(sisaJamDesimal);
  const menit = Math.round((sisaJamDesimal - jam) * 60);
  
  let hasil = '';
  if (hari > 0) hasil += hari + ' hari ';
  if (jam > 0) hasil += jam + ' jam ';
  if (menit > 0) hasil += menit + ' menit';
  
  return hasil.trim() || '0 hari 0 jam 0 menit';
}

// Contoh test:
// formatJamMenit(8.5)      → "8 jam 30 menit"
// formatJamMenit(7)        → "7 jam"
// formatJamMenit(0.5)      → "30 menit"
// formatHariJamMenit(23.5) → "23 hari 4 jam 30 menit"
// formatHariJamMenit(1.2)  → "1 hari 1 jam 48 menit"
function hitungStatistikLaporan(absensiData, izinData, payload) {
  const statBox = document.getElementById('laporanStatistik');
  if (!statBox) {
    console.error('laporanStatistik tidak ditemukan');
    return;
  }
  statBox.classList.remove('hidden');
  
  // 1. Kehadiran
  const hadir = absensiData.length;
  
  // 2. Izin Approved
  const izin = izinData.totalIzin || 0;
  
  // 3. Telat
  const telatList = absensiData.filter(a => a.status === 'Telat');
  const telat = telatList.length;
  const totalMenitTelat = telatList.reduce((sum, a) => sum + (parseInt(a.menitTelat) || 0), 0);
  
  // 4. Total Jam Kerja (parse "Xj Ym")
  let jamKerja = 0;
  absensiData.forEach(a => {
    if (a.durasiKerja && a.durasiKerja !== '—') {
      const match = a.durasiKerja.match(/(\d+)j\s*(\d*)m?/);
      if (match) jamKerja += parseInt(match[1]) + (parseInt(match[2]) || 0) / 60;
    }
  });
  
  // 5. Total Jam Lembur (parse "Xj Ym")
  let jamLembur = 0;
  absensiData.forEach(a => {
    if (a.durasiLembur && a.durasiLembur !== '—') {
      const match = a.durasiLembur.match(/(\d+)j\s*(\d*)m?/);
      if (match) jamLembur += parseInt(match[1]) + (parseInt(match[2]) || 0) / 60;
    }
  });
  
  // ===== HELPER SET TEXT =====
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
    } else {
      console.warn('Elemen #' + id + ' tidak ditemukan');
    }
  }
  
  // Update 5 card utama — pakai format jam:menit
  setText('statHadir', hadir);
  setText('statIzin', izin);
  setText('statTelat', telat);
  setText('statTelatDetail', totalMenitTelat + ' menit');
  setText('statJamKerja', formatJamMenit(jamKerja));
  setText('statJamLembur', formatJamMenit(jamLembur));
  
  // KHUSUS BULANAN
  const detailBox = document.getElementById('bulananDetail');
  if (currentLaporanMode === 'bulanan' && payload.bulan && payload.tahun) {
    if (detailBox) detailBox.classList.remove('hidden');
    
    const hariSeharusnya = hitungHariKerjaBulan(payload.tahun, payload.bulan);
    const totalJam = jamKerja + jamLembur;
    const hariDariJam = totalJam / 9; // 9 jam/shift
    const selisihLebih = Math.max(0, hariDariJam - hariSeharusnya);
    
    const izinDihitung = Math.min(izin, 2);
    const hariDihitungGaji = hadir + izinDihitung;
    const bolos = Math.max(0, hariSeharusnya - hariDihitungGaji);
    
    let statusText = '';
    let statusKet = '';
    let statusColor = '';
    
    if (bolos === 0) {
      if (izin <= 2) {
        statusText = '✅ Gaji Penuh';
        statusKet = `Hadir ${hadir} hari + Izin ${izin} hari (dalam toleransi)`;
        statusColor = 'var(--success)';
      } else {
        statusText = '⚠️ Gaji Dipotong';
        statusKet = `Izin ${izin} hari, melebihi toleransi 2 hari`;
        statusColor = 'var(--warning)';
      }
    } else {
      statusText = '❌ Gaji Dipotong';
      statusKet = `${bolos.toFixed(1)} hari bolos (tidak dihitung upah)`;
      statusColor = 'var(--danger)';
    }
    
    // Update DOM bulanan — pakai format yang baru
    setText('blnHariSeharusnya', hariSeharusnya + ' hari');
    setText('blnTotalJam', formatJamMenit(totalJam));
    setText('blnHariKerja', formatHariJamMenit(hariDariJam));
    setText('blnSelisih', formatHariJamMenit(selisihLebih));
    setText('blnToleransi', '2 hari');
    
    const elStatus = document.getElementById('blnStatus');
    if (elStatus) {
      elStatus.textContent = statusText;
      elStatus.style.color = statusColor;
    } else {
      console.warn('Elemen #blnStatus tidak ditemukan');
    }
    
    setText('blnStatusKet', statusKet);
    
  } else {
    if (detailBox) detailBox.classList.add('hidden');
  }
}

// ============================================
// FUNGSI HARI KERJA — SESUAI SISTEM PERUSAHAAN
// ============================================

// PILIH SALAH SATU SESUAI KEBIJAKAN:

// A. DEFAULT: 5 hari kerja (Senin–Jumat)
/*
function hitungHariKerjaBulan(tahun, bulan) {
  const hariDalamBulan = new Date(tahun, bulan, 0).getDate();
  let hariKerja = 0;
  for (let d = 1; d <= hariDalamBulan; d++) {
    const hari = new Date(tahun, bulan - 1, d).getDay();
    if (hari !== 0 && hari !== 6) hariKerja++; // Senin=1 ... Jumat=5
  }
  return hariKerja;
}*/

// B. 6 HARI KERJA (Senin–Sabtu) — Uncomment jika perusahaan kerja Sabtu
/*
function hitungHariKerjaBulan(tahun, bulan) {
  const hariDalamBulan = new Date(tahun, bulan, 0).getDate();
  let hariKerja = 0;
  for (let d = 1; d <= hariDalamBulan; d++) {
    const hari = new Date(tahun, bulan - 1, d).getDay();
    if (hari !== 0) hariKerja++; // Cuma libur Minggu
  }
  return hariKerja;
}
*/

// C. 7 HARI KERJA (Tiap Hari) — Uncomment jika tidak ada libur

function hitungHariKerjaBulan(tahun, bulan) {
  return new Date(tahun, bulan, 0).getDate(); // Total hari dalam bulan
}


// D. FLAT 26 HARI — Uncomment jika perusahaan pakai sistem flat
/*
function hitungHariKerjaBulan(tahun, bulan) {
  return 26; // Tetap 26 hari kerja per bulan
}
*/

// Populate dropdown karyawan saat buka halaman laporan / init
async function populateLaporanKaryawan() {
  try {
    if (karyawanData.length === 0) await loadKaryawanData();
    const sel = document.getElementById('laporanKaryawan');
    if(!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">👤 Semua Karyawan</option>';
    (karyawanData || []).filter(k => k.Status === 'Aktif').forEach(k => {
      sel.innerHTML += `<option value="${k.ID_Karyawan}">${k.Nama}</option>`;
    });
    sel.value = cur;
  } catch(e) { console.error(e); }
}

async function loadAbsensiFull() {
  try {
    const res = await apiCall('getLaporanAbsensi', { mode: 'harian', tanggal: new Date().toISOString().split('T')[0] });
    if(res.success) {
      const tbody = document.getElementById('absensiFullTbody');
      if(tbody) tbody.innerHTML = (res.data || []).map(a => `
        <tr>
          <td>${a.tanggal}</td><td>${a.nama}</td><td>${a.toko}</td><td>${a.shift}</td>
          <td>${a.jamMasuk}</td><td>${a.jamPulang || '—'}</td><td>${a.durasiKerja || '—'}</td>
          <td><span class="td-badge ${a.status==='Ontime'?'green':'red'}">${a.status}</span></td>
          <td>${a.menitTelat || '—'}</td>
        </tr>
      `).join('');
    }
  } catch(e) { console.error(e); }
}

// ==================== TOKO CRUD ====================
// ==================== KOMPRES FOTO ====================
function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        // Hitung ukuran baru dengan aspect ratio tetap
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        
        // Buat canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert ke base64 JPEG dengan kompresi
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        // Info kompresi
        const originalSize = Math.round(file.size / 1024);
        const compressedSize = Math.round((compressedBase64.length * 0.75) / 1024); // base64 ~33% overhead
        
        console.log(`Foto dikompres: ${originalSize}KB → ${compressedSize}KB (${Math.round(width)}x${Math.round(height)})`);
        
        resolve({
          base64: compressedBase64,
          originalSize: originalSize,
          compressedSize: compressedSize,
          width: width,
          height: height
        });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==================== PREVIEW + KOMPRES FOTO TOKO ====================
async function previewTokoFoto(input) {
  const previewImg = document.getElementById('tokoFotoImg');
  const placeholder = document.getElementById('tokoFotoPlaceholder');
  const hiddenInput = document.getElementById('tokoFoto');
  const infoDiv = document.getElementById('tokoFotoInfo') || document.createElement('div');
  
  if (!input.files || !input.files[0]) return;
  
  const file = input.files[0];
  
  // Validasi tipe file
  if (!file.type.startsWith('image/')) {
    showToast('❌ File harus berupa gambar!', 'error');
    input.value = '';
    return;
  }
  
  // Validasi ukuran original (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    showToast('❌ Ukuran foto maksimal 10MB!', 'error');
    input.value = '';
    return;
  }
  
  try {
    showToast('⏳ Mengompres foto...', 'info');
    
    // Kompres foto
    const compressed = await compressImage(file, 800, 800, 0.7);
    
    // Tampilkan preview
    previewImg.src = compressed.base64;
    previewImg.style.display = 'block';
    placeholder.style.display = 'none';
    hiddenInput.value = compressed.base64;
    
    // Info kompresi
    infoDiv.id = 'tokoFotoInfo';
    infoDiv.style.cssText = 'font-size:11px;color:var(--text-secondary);margin-top:6px;';
    infoDiv.innerHTML = `📸 ${compressed.originalSize}KB → ${compressed.compressedSize}KB (${Math.round(compressed.width)}×${Math.round(compressed.height)})`;
    
    // Insert info setelah button upload
    const uploadBtn = input.nextElementSibling;
    if (uploadBtn && uploadBtn.parentNode) {
      const existingInfo = uploadBtn.parentNode.querySelector('#tokoFotoInfo');
      if (existingInfo) existingInfo.remove();
      uploadBtn.parentNode.insertBefore(infoDiv, uploadBtn.nextSibling);
    }
    
    showToast(`✅ Foto dikompres ${compressed.compressedSize}KB`, 'success');
    
  } catch (e) {
    console.error('Kompres foto gagal:', e);
    showToast('❌ Gagal mengompres foto', 'error');
    input.value = '';
  }
}

// ==================== GPS AUTO-FILL FORM ====================
function ambilLokasiGPS() {
  const preview = document.getElementById('gpsPreview');
  const latInput = document.getElementById('tokoLat');
  const lngInput = document.getElementById('tokoLng');
  
  if(preview) preview.innerHTML = '🔄 Mendeteksi lokasi...';
  
  if (!navigator.geolocation) {
    if(preview) preview.innerHTML = '❌ GPS tidak didukung browser ini';
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      
      latInput.value = lat;
      lngInput.value = lng;
      
      if(preview) {
        preview.innerHTML = `✅ Lokasi didapat!<br>
        <strong>Lat:</strong> ${lat} | <strong>Lng:</strong> ${lng}<br>
        <span style="font-size:11px;">Akurasi: ${Math.round(pos.coords.accuracy)} meter</span>`;
      }
      playSound('success');
      showToast('📍 Lokasi GPS berhasil diisi!', 'success');
    },
    (err) => { 
      let msg = 'Gagal mendapatkan lokasi';
      switch(err.code) {
        case 1: msg = '❌ Izin lokasi ditolak. Mohon izinkan akses GPS.'; break;
        case 2: msg = '❌ Posisi tidak tersedia.'; break;
        case 3: msg = '❌ Timeout. Coba lagi.'; break;
      }
      if(preview) preview.innerHTML = msg; 
      playSound('error');
      showToast(msg, 'error');
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}
function openModalToko(id = null) {
  editingTokoId = id;
  const title = document.getElementById('tokoModalTitle');
  if(title) title.textContent = id ? '🏪 Edit Toko' : '🏪 Tambah Toko Baru';
  
  // Reset
  const resetFields = ['tokoNama','tokoAlamat','tokoLat','tokoLng','tokoRadius','tokoJamBuka','tokoJamTutup','tokoFoto'];
  resetFields.forEach(fid => {
    const el = document.getElementById(fid);
    if(el) el.value = '';
  });
  
  const previewImg = document.getElementById('tokoFotoImg');
  const placeholder = document.getElementById('tokoFotoPlaceholder');
  const fileInput = document.getElementById('tokoFotoFile');
  const gpsPreview = document.getElementById('gpsPreview');
  
  if(previewImg) { previewImg.src = ''; previewImg.style.display = 'none'; }
  if(placeholder) placeholder.style.display = 'block';
  if(fileInput) fileInput.value = '';
  if(gpsPreview) gpsPreview.innerHTML = '';
  
  if (id) {
    const t = tokoData.find(x => x.ID_Toko === id);
    if(t) {
      console.log('Edit toko:', t);
      
      document.getElementById('tokoNama').value = t.Nama_Toko || '';
      document.getElementById('tokoAlamat').value = t.Alamat || '';
      document.getElementById('tokoLat').value = t.Lat || '';
      document.getElementById('tokoLng').value = t.Long || '';
      document.getElementById('tokoRadius').value = t.Radius_M || 50;
      document.getElementById('tokoJamBuka').value = formatJamToko(t.Jam_Buka) || '08:00';
      document.getElementById('tokoJamTutup').value = formatJamToko(t.Jam_Tutup) || '22:00';
      
      // Set foto dengan thumbnail URL
      const fotoUrl = t.Foto_Toko_URL || '';
      if(fotoUrl) {
        const thumbUrl = getDirectImageUrl(fotoUrl);
        previewImg.src = thumbUrl;
        previewImg.style.display = 'block';
        placeholder.style.display = 'none';
        document.getElementById('tokoFoto').value = fotoUrl;
      }
      
      if(t.Lat && t.Long) {
        gpsPreview.innerHTML = `📍 Lokasi: ${t.Lat}, ${t.Long}`;
      }
    }
  } else {
    document.getElementById('tokoRadius').value = 50;
    document.getElementById('tokoJamBuka').value = '08:00';
    document.getElementById('tokoJamTutup').value = '22:00';
  }
  
  openModal('modalToko');
}

async function saveToko() {
  const nama = document.getElementById('tokoNama')?.value?.trim();
  if (!nama) {
    showToast('❌ Nama toko wajib diisi!', 'error');
    playSound('error');
    return;
  }
  
  const fotoBase64 = document.getElementById('tokoFoto')?.value || '';
  let fotoUrl = '';
  
  // Jika ada foto baru (base64), upload ke Drive via Apps Script
  if (fotoBase64 && fotoBase64.startsWith('data:image')) {
    try {
      showToast('⏳ Mengupload foto ke Drive...', 'info');
      const res = await apiCall('uploadFotoToko', { 
        fotoBase64: fotoBase64, 
        namaToko: nama 
      });
      if (res.success && res.fotoUrl) {
        fotoUrl = res.fotoUrl;
        showToast('✅ Foto berhasil diupload!', 'success');
      } else {
        throw new Error(res.error || 'Gagal upload foto');
      }
    } catch (e) {
      console.error('Gagal upload foto:', e);
      showToast('⚠️ Gagal upload foto, toko tetap disimpan tanpa foto', 'warning');
      fotoUrl = '';
    }
  } else if (fotoBase64 && fotoBase64.startsWith('http')) {
    // Foto sudah URL (mode edit, tidak ganti foto)
    fotoUrl = fotoBase64;
  }
  
  const payload = {
    nama: nama,
    alamat: document.getElementById('tokoAlamat')?.value || '',
    lat: document.getElementById('tokoLat')?.value || '',
    lng: document.getElementById('tokoLng')?.value || '',
    radius: document.getElementById('tokoRadius')?.value || 50,
    jamBuka: document.getElementById('tokoJamBuka')?.value || '08:00',
    jamTutup: document.getElementById('tokoJamTutup')?.value || '22:00',
    fotoUrl: fotoUrl
  };
  
  try {
    if (editingTokoId) {
      await apiCall('updateToko', { idToko: editingTokoId, ...payload });
      showToast('🏪 Toko diupdate!', 'success'); 
      playSound('success');
    } else {
      await apiCall('saveToko', payload);
      showToast('🏪 Toko ditambahkan!', 'success'); 
      playSound('success');
    }
    closeModal('modalToko');
    loadTokoData();
  } catch (e) { 
    showToast('❌ Gagal: ' + e.message, 'error'); 
    playSound('error'); 
  }
}

async function toggleTokoStatus(id, newStatus) {
  const konfirmasi = newStatus === 'Nonaktif' 
    ? '🚫 Nonaktifkan toko ini?\n\nKaryawan tidak bisa absen di toko ini.' 
    : '✅ Aktifkan kembali toko ini?';
    
  if (!confirm(konfirmasi)) return;
  
  try {
    await apiCall('updateToko', { idToko: id, status: newStatus });
    showToast(newStatus === 'Aktif' ? '✅ Toko diaktifkan' : '🚫 Toko dinonaktifkan', 'success');
    playSound('success');
    loadTokoData();
  } catch (e) {
    showToast('❌ Gagal: ' + e.message, 'error');
    playSound('error');
  }
}

async function deleteTokoPermanent(id) {
  if (!confirm('⚠️ Yakin HAPUS PERMANEN toko ini?\n\nSemua data shift, jadwal, dan absensi terkait toko ini akan rusak.\nTindakan ini TIDAK BISA dibatalkan!')) return;
  
  try {
    await apiCall('deleteTokoPermanent', { idToko: id });
    showToast('🗑️ Toko dihapus permanen', 'success');
    playSound('success');
    loadTokoData();
  } catch(e) { 
    showToast('❌ Gagal hapus: ' + e.message, 'error'); 
    playSound('error');
  }
}

function editToko(id) { openModalToko(id); }

async function loadTokoData() {
  try {
    const res = await apiCall('getTokoList');
    if (res.success) { 
      tokoData = res.data || []; 
      renderTokoList(); 
      populateTokoSelects(); 
    }
  } catch (e) { console.error(e); }
}

function renderTokoList() {
  const grid = document.getElementById('tokoList');
  if(!grid) return;
  
  if (!tokoData || tokoData.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-secondary);">Belum ada data toko</div>';
    return;
  }
  
  grid.innerHTML = tokoData.map(t => {
    const isAktif = t.Status === 'Aktif';
    const fotoUrl = t.Foto_Toko_URL ? getDirectImageUrl(t.Foto_Toko_URL) : '';
    const hasFoto = fotoUrl && fotoUrl.length > 10;
    
    return `
    <div class="setting-card">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
        <div class="setting-icon" style="
          width:60px; 
          height:60px; 
          border-radius:12px; 
          overflow:hidden;
          background:${hasFoto ? '#f0f0f0' : 'var(--primary-light)'}; 
          display:flex;
          align-items:center;
          justify-content:center;
          flex-shrink:0;
        ">
          ${hasFoto 
            ? `<img src="${fotoUrl}" 
                style="width:100%;height:100%;object-fit:cover;" 
                loading="lazy"
                onerror="this.onerror=null;this.src='';this.style.display='none';this.parentElement.innerHTML='🏪';this.parentElement.style.background='var(--primary-light)';"
                onload="this.style.opacity=1;"
              >` 
            : '🏪'}
        </div>
        <span class="td-badge ${isAktif ? 'green' : 'gray'}">${t.Status}</span>
      </div>
      <div class="setting-title">${t.Nama_Toko}</div>
      <div class="setting-desc">
        ${t.Alamat ? '📍 ' + t.Alamat + '<br>' : ''}
        🌐 ${t.Lat || '-'}, ${t.Long || '-'} • 🎯 ${t.Radius_M || 50}m<br>
        🕐 ${formatJamToko(t.Jam_Buka) || '08:00'} - ${formatJamToko(t.Jam_Tutup) || '22:00'}
      </div>
      <div style="margin-top:12px;display:flex;gap:8px;">
        <button class="btn-sm btn-edit" onclick="editToko('${t.ID_Toko}')">✏️ Edit</button>
        <button class="btn-sm ${isAktif ? 'btn-reject' : 'btn-approve'}" 
                onclick="toggleTokoStatus('${t.ID_Toko}', '${isAktif ? 'Nonaktif' : 'Aktif'}')"
                title="${isAktif ? 'Nonaktifkan' : 'Aktifkan'}">
          ${isAktif ? '🚫' : '✅'}
        </button>
        <button class="btn-sm btn-reject" style="background:#fce8e6;color:var(--danger);" 
                onclick="deleteTokoPermanent('${t.ID_Toko}')">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

// Helper untuk fix URL di frontend juga
// ==== FUNCTION ANDA — JANGAN DIGANTI ====
function getDirectImageUrl(url) {
  if (!url) return '';
  if (url.includes('drive.google.com/uc?id=')) {
    return url + (url.includes('?') ? '&' : '?') + 'export=view';
  }
  return url;
}

// ==== FUNCTION BARU — KHUSUS THUMBNAIL ====
function getThumbUrl(url) {
  if (!url || typeof url !== 'string') return '';
  
  try {
    // Sudah thumbnail URL
    if (url.includes('drive.google.com/thumbnail')) return url;
    
    // Extract file ID dari berbagai format
    let fileId = '';
    
    // Format: https://drive.google.com/uc?id=FILE_ID&export=view
    const ucMatch = url.match(/[?&]id=([a-zA-Z0-9_-]{25,})/);
    if (ucMatch) fileId = ucMatch[1];
    
    // Format: https://drive.google.com/file/d/FILE_ID/view
    if (!fileId) {
      const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]{25,})/);
      if (fileMatch) fileId = fileMatch[1];
    }
    
    // Format: https://drive.google.com/open?id=FILE_ID
    if (!fileId) {
      const openMatch = url.match(/\/open\?id=([a-zA-Z0-9_-]{25,})/);
      if (openMatch) fileId = openMatch[1];
    }
    
    // Jika berhasil extract ID
    if (fileId && fileId.length >= 25) {
      return 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w400';
    }
    
    // Fallback: return URL asli
    return url;
    
  } catch (e) {
    console.log('getThumbUrl error:', e);
    return url;
  }
}

function populateTokoSelects() {
  const selects = ['filterToko', 'shiftTokoSelect', 'laporanToko', 'karToko'];
  selects.forEach(selId => {
    const sel = document.getElementById(selId);
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">Pilih Toko</option>';
    (tokoData || []).filter(t => t.Status === 'Aktif').forEach(t => {
      sel.innerHTML += `<option value="${t.ID_Toko}">${t.Nama_Toko}</option>`;
    });
    sel.value = current;
  });
  
  // Tambahkan event listener khusus untuk shift
  const shiftSel = document.getElementById('shiftTokoSelect');
  if (shiftSel) {
    shiftSel.onchange = loadShiftByToko;
  }
}


// ==================== KARYAWAN CRUD ====================
// ==================== FOTO PICKER — SATU AREA KLIK ====================
function openKarFotoPicker() {
  // Mobile: tanya dulu galeri atau kamera
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    const pilih = confirm('📷 Ambil foto dari kamera?\n\nOK = Kamera\nCancel = Galeri');
    const input = document.getElementById('karFotoInput');
    if (pilih) {
      input.setAttribute('capture', 'environment');
    } else {
      input.removeAttribute('capture');
    }
    input.click();
  } else {
    // Desktop: langsung file picker
    document.getElementById('karFotoInput').removeAttribute('capture');
    document.getElementById('karFotoInput').click();
  }
}

// ==================== PREVIEW FOTO KARYAWAN ====================
async function previewKarFoto(input) {
  const previewBox = document.getElementById('karFotoPreview');
  const img = document.getElementById('karFotoImg');
  const placeholder = document.getElementById('karFotoPlaceholder');
  const hiddenInput = document.getElementById('karFotoBase64');
  const hint = document.getElementById('karFotoHint');
  
  if (!input.files || !input.files[0]) return;
  
  const file = input.files[0];
  
  if (!file.type.startsWith('image/')) {
    showToast('❌ File harus gambar!', 'error');
    input.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('❌ Maksimal 5MB!', 'error');
    input.value = '';
    return;
  }
  
  try {
    const compressed = await compressImage(file, 600, 800, 0.8);
    img.src = compressed.base64;
    img.style.display = 'block';
    img.onload = () => {
      previewBox.classList.add('has-foto');
      placeholder.style.display = 'none';
    };
    hiddenInput.value = compressed.base64;
    if (hint) hint.textContent = 'Klik foto untuk mengganti';
    
    showToast(`✅ Foto siap (${compressed.compressedSize}KB)`, 'success');
  } catch (e) {
    showToast('❌ Gagal proses foto', 'error');
    input.value = '';
  }
}

// ==================== HANDLE FOTO ERROR ====================
function handleFotoError(img) {
  img.style.display = 'none';
  const preview = document.getElementById('karFotoPreview');
  const placeholder = document.getElementById('karFotoPlaceholder');
  if (preview) preview.classList.remove('has-foto');
  if (placeholder) placeholder.style.display = 'block';
}


// ==================== SET FOTO EXISTING — FINAL ====================
function setFotoExisting(url) {
  if (!url) return;
  
  const previewBox = document.getElementById('karFotoPreview');
  const img = document.getElementById('karFotoImg');
  const placeholder = document.getElementById('karFotoPlaceholder');
  
  img.src = getThumbUrl(url);
  img.style.display = 'block';
  
  previewBox.classList.add('has-foto');
  placeholder.style.display = 'none';
  
  document.getElementById('karFotoUrlLama').value = url;
  document.getElementById('karFotoHint').textContent = 'Klik foto untuk mengganti';
}

function openKarCamera() {
  const input = document.getElementById('karFotoInput');
  input.setAttribute('capture', 'environment');
  input.click();
  setTimeout(() => input.removeAttribute('capture'), 1000);
}



// ==================== EDIT KARYAWAN ====================
let editingKarId = null;

// ==================== POPULATE SHIFT SELECT ====================
function populateShiftSelect() {
  const sel = document.getElementById('karShift');
  if (!sel) return;
  
  const current = sel.value;
  sel.innerHTML = '<option value="">Pilih Shift</option>';
  
  // Ambil shift dari semua toko yang aktif
  (shiftData || []).filter(s => s.Status === 'Aktif').forEach(s => {
    sel.innerHTML += `<option value="${s.ID_Shift}">${s.Nama_Shift} (${s.Nama_Toko || 'Umum'})</option>`;
  });
  
  sel.value = current;
}

// ==================== OPEN MODAL KARYAWAN — FINAL FIX ====================
async function openModalKaryawan(id = null) {
  editingKarId = id;
  const title = document.getElementById('karModalTitle');
  if(title) title.textContent = id ? '✏️ Edit Karyawan' : '👤 Tambah Karyawan';
  
  // Force reload semua data
  await loadTokoData();
  await loadAllShiftData();
  await loadKaryawanData();
  
  populateTokoSelects();
  populateShiftSelect();
  
  // Reset form
  ['karNama','karPIN','karJabatan','karHP','karEmail','karTglMasuk','karFotoBase64','karFotoUrlLama']
    .forEach(fid => { const el = document.getElementById(fid); if(el) el.value = ''; });
  
  document.getElementById('karToko').value = '';
  document.getElementById('karShift').value = '';
  
  // Reset foto
  setFotoExisting(null);
  
  // Isi data jika EDIT
  if (id) {
    const k = karyawanData.find(x => x.ID_Karyawan === id);
    
    if(k) {
      document.getElementById('karNama').value = k.Nama || '';
      document.getElementById('karPIN').value = k.PIN || '';
      document.getElementById('karJabatan').value = k.Jabatan || '';
      document.getElementById('karHP').value = k.No_HP || '';
      document.getElementById('karEmail').value = k.Email || '';
      document.getElementById('karTglMasuk').value = k.Tanggal_Masuk ? formatDateInput(k.Tanggal_Masuk) : '';
      document.getElementById('karToko').value = k.Toko_Default || '';
      document.getElementById('karShift').value = k.Shift_Default || '';
      
      // CEK SEMUA KEMUNGKINAN NAMA FIELD FOTO
      const fotoUrl = k.Foto_URL ||                    // Coba Foto_URL (underscore)
                      k['Foto_URL'] ||                 // Bracket notation
                      k.Foto ||                        // Coba Foto
                      k['Foto Profil'] ||             // Coba dengan spasi
                      k.Foto_Profil ||                // Coba underscore
                      k.fotoUrl ||                    // Coba camelCase
                      k.foto_url ||                   // Coba lowercase
                      '';                              // Default kosong
      
      if (fotoUrl) {
        setFotoExisting(fotoUrl);
      }
    }
  }
  
  openModal('modalKaryawan');
}

// ==================== SAVE KARYAWAN ====================
async function saveKaryawan() {
  const nama = document.getElementById('karNama')?.value?.trim();
  if (!nama) {
    showToast('❌ Nama wajib diisi!', 'error');
    return;
  }
  
  const fotoBase64 = document.getElementById('karFotoBase64')?.value || '';
  const fotoUrlLama = document.getElementById('karFotoUrlLama')?.value || '';
  let fotoUrl = fotoUrlLama;
  
  if (fotoBase64 && fotoBase64.startsWith('data:image')) {
    try {
      showToast('⏳ Upload foto...', 'info');
      const res = await apiCall('uploadFotoProfil', { 
        fotoBase64: fotoBase64, 
        idKaryawan: editingKarId || 'new'
      });
      if (res.success && res.fotoUrl) fotoUrl = res.fotoUrl;
    } catch (e) {
      showToast('⚠️ Foto gagal upload', 'warning');
    }
  }
  
  const payload = {
    nama, pin: document.getElementById('karPIN')?.value || '0000',
    jabatan: document.getElementById('karJabatan')?.value || '',
    noHP: document.getElementById('karHP')?.value || '',
    email: document.getElementById('karEmail')?.value || '',
    tglMasuk: document.getElementById('karTglMasuk')?.value || formatDate(new Date()),
    tokoDefault: document.getElementById('karToko')?.value || '',
    shiftDefault: document.getElementById('karShift')?.value || '',
    fotoUrl
  };
  
  try {
    if (editingKarId) {
      await apiCall('updateKaryawan', { idKaryawan: editingKarId, ...payload });
      showToast('✅ Karyawan diupdate!', 'success');
    } else {
      await apiCall('saveKaryawan', payload);
      showToast('👤 Karyawan ditambahkan!', 'success');
    }
    playSound('success');
    closeModal('modalKaryawan');
    loadKaryawanData();
    editingKarId = null;
  } catch (e) { 
    showToast('❌ Gagal: ' + e.message, 'error'); 
    playSound('error'); 
  }
}
// ==================== LOAD ALL SHIFT DATA ====================
async function loadAllShiftData() {
  try {
    const res = await apiCall('getAllShifts');
    if (res.success) {
      shiftData = res.data || [];
      console.log('Shift data loaded:', shiftData.length, 'records');
      return shiftData;
    }
  } catch (e) {
    console.error('loadAllShiftData error:', e);
    // Fallback: load per toko
    shiftData = [];
    const aktifToko = (tokoData || []).filter(t => t.Status === 'Aktif');
    for (const toko of aktifToko) {
      try {
        const res = await apiCall('getShiftByToko', { idToko: toko.ID_Toko });
        if (res.success && res.data) {
          shiftData = shiftData.concat(res.data);
        }
      } catch (err) { /* skip */ }
    }
    return shiftData;
  }
}
// Debug function
function debugShiftData() {
  console.log('=== DEBUG SHIFT ===');
  console.log('tokoData:', tokoData);
  console.log('shiftData:', shiftData);
  console.log('jdToko value:', document.getElementById('jdToko')?.value);
  console.log('jdShift options:', document.getElementById('jdShift')?.innerHTML);
}

// ==================== FORMAT DATE INPUT ====================
function formatDateInput(value) {
  if (!value) return '';
  
  // Sudah string YYYY-MM-DD
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return value;
  }
  
  // Fix epoch 1899-12-30 (Google Sheets Date object)
  if (value instanceof Date) {
    // Cek apakah tanggalnya 1899-12-30 (epoch Sheets untuk time-only)
    const epoch = new Date(1899, 11, 30); // Dec 30, 1899
    if (value.getTime() === epoch.getTime()) {
      return ''; // Return kosong karena ini time-only, bukan tanggal
    }
    // Normal date
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  
  // String ISO format (2026-05-14T17:00:00.000Z)
  if (typeof value === 'string' && value.includes('T')) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const y = date.getFullYear();
      // Fix: jika tahun 1899, return kosong (time-only)
      if (y < 1900) return '';
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  
  // Format DD/MM/YYYY atau DD-MM-YYYY
  if (typeof value === 'string') {
    const parts = value.split(/[\/\-\.]/);
    if (parts.length === 3) {
      // Coba deteksi format
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        return `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`;
      } else {
        // DD-MM-YYYY
        return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
      }
    }
  }
  
  return '';
}

// Ganti fungsi saveKaryawan yang lama:



async function loadKaryawanData() {
  try {
    const res = await apiCall('getKaryawanList');
    if (res.success) { 
      karyawanData = res.data || []; 
      renderKaryawanTable(); 
      populateKarSelect(); 
    }
  } catch (e) { console.error(e); }
}

function renderKaryawanTable() {
  const grid = document.getElementById('karyawanGrid');
  if(!grid) return;
  
  if (!karyawanData || karyawanData.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-secondary);">Belum ada data karyawan</div>';
    return;
  }
  
  grid.innerHTML = karyawanData.map(k => {
    const isAktif = k.Status === 'Aktif';
    
    // ===== FIX: Cek SEMUA kemungkinan nama field foto =====
    const rawFoto = k.Foto_URL ||                    
                    k['Foto_URL'] ||                 
                    k.Foto ||                        
                    k['Foto Profil'] ||             
                    k.Foto_Profil ||                
                    k.fotoUrl ||                    
                    k.foto_url ||                   
                    '';                              
    
    const fotoUrl = rawFoto ? getThumbUrl(rawFoto) : '';
    const hasFoto = fotoUrl && fotoUrl.length > 10;
    
    // ===== FIX: Ambil nama toko dari tokoData =====
    const tokoObj = tokoData.find(t => t.ID_Toko === k.Toko_Default);
    const namaToko = tokoObj ? tokoObj.Nama_Toko : (k.Toko_Default || '—');
    
    return `
    <div class="kar-card">
      <div class="kar-foto-wrap">
        ${hasFoto 
          ? `<img src="${fotoUrl}" 
              loading="lazy"
              onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\\'no-foto\\'>👤</div>';"
            >` 
          : '<div class="no-foto">👤</div>'}
      </div>
      <div class="kar-body">
        <div class="kar-header">
          <div class="kar-nama">${k.Nama}</div>
          <span class="kar-badge ${isAktif ? '' : 'nonaktif'}">${k.Status}</span>
        </div>
        <div class="kar-info">
          <div class="info-row">🆔 <strong>${k.ID_Karyawan}</strong></div>
          <div class="info-row">💼 ${k.Jabatan || '—'}</div>
          <div class="info-row">🏪 ${namaToko || '—'}</div>
          <div class="info-row">📱 ${k.No_HP || '—'}</div>
          <div class="info-row">📧 ${k.Email || '—'}</div>
          <div class="info-row">📅 Masuk: ${k.Tanggal_Masuk || '—'}</div>
        </div>
        <div class="kar-actions">
          <button class="btn-sm btn-edit" onclick="openModalKaryawan('${k.ID_Karyawan}')">✏️ Edit</button>
          <button class="btn-sm ${isAktif ? 'btn-reject' : 'btn-approve'}" 
                  onclick="toggleKaryawanStatus('${k.ID_Karyawan}', '${isAktif ? 'Nonaktif' : 'Aktif'}')">
            ${isAktif ? '🚫' : '✅'}
          </button>
          <button class="btn-sm btn-reject" style="background:#fce8e6;color:var(--danger);" 
                  onclick="deleteKaryawan('${k.ID_Karyawan}')">🗑️</button>
        </div>
      </div>
    </div>`;
  }).join('');
}
async function toggleKaryawanStatus(id, newStatus) {
  const konfirmasi = newStatus === 'Nonaktif' 
    ? '🚫 Nonaktifkan karyawan ini?\n\nKaryawan tidak bisa login dan absen.' 
    : '✅ Aktifkan kembali karyawan ini?';
    
  if (!confirm(konfirmasi)) return;
  
  try {
    await apiCall('updateKaryawan', { idKaryawan: id, status: newStatus });
    showToast(newStatus === 'Aktif' ? '✅ Karyawan diaktifkan' : '🚫 Karyawan dinonaktifkan', 'success');
    playSound('success');
    loadKaryawanData();
  } catch (e) {
    showToast('❌ Gagal: ' + e.message, 'error');
    playSound('error');
  }
}
function populateKarSelect() {
  const sel = document.getElementById('jadwalKarSelect');
  if(!sel) return;
  sel.innerHTML = '<option>Pilih Karyawan...</option>';
  (karyawanData || []).filter(k => k.Status === 'Aktif').forEach(k => {
    sel.innerHTML += `<option value="${k.ID_Karyawan}">${k.Nama} — ${k.Jabatan}</option>`;
  });
}

function editKaryawan(id) { showToast('Edit karyawan: ' + id, 'info'); }
async function deleteKaryawan(id) { 
  if(!confirm('Hapus karyawan?')) return;
  try {
    await apiCall('deleteKaryawan', { idKaryawan: id });
    showToast('Karyawan dinonaktifkan', 'info');
    loadKaryawanData();
  } catch(e) { showToast('Gagal', 'error'); }
}

// ==================== JENIS IZIN ====================
async function saveJenisIzin() {
  try {
    await apiCall('saveJenisIzin', {
      nama: document.getElementById('izinNama')?.value,
      kode: document.getElementById('izinKode')?.value,
      kuotaTahun: document.getElementById('izinKotaTahun')?.value,
      kuotaBulan: document.getElementById('izinKotaBulan')?.value,
      maxHari: document.getElementById('izinMax')?.value,
      gender: document.getElementById('izinGender')?.value,
      potongCuti: document.getElementById('izinPotong')?.value,
      syaratHari: document.getElementById('izinSyarat')?.value
    });
    showToast('📋 Jenis izin ditambahkan!', 'success'); playSound('success');
    closeModal('modalJenisIzin');
    loadJenisIzinData();
  } catch (e) { showToast('Gagal: ' + e.message, 'error'); }
}

async function loadJenisIzinData() {
  try {
    const res = await apiCall('getJenisIzinList');
    if (res.success) { jenisIzinData = res.data || []; renderJenisIzinTable(); }
  } catch (e) { console.error(e); }
}

function renderJenisIzinTable() {
  const tbody = document.getElementById('jenisIzinTbody');
  if(!tbody) return;
  tbody.innerHTML = (jenisIzinData || []).map(i => `
    <tr>
      <td><strong>${i.Nama_Jenis}</strong></td>
      <td><span class="td-badge blue">${i.Kode}</span></td>
      <td>${i.Kuota_Per_Tahun || '—'}</td>
      <td>${i.Kuota_Per_Bulan || '—'}</td>
      <td>${i.Maks_Hari_Sekali_Ajuan}</td>
      <td>${i.Gender_Khusus}</td>
      <td><span class="td-badge green">${i.Status}</span></td>
      <td>
        <button class="btn-sm btn-edit" onclick="editJenisIzin('${i.ID_Jenis}')">✏️</button>
        <button class="btn-sm btn-reject" onclick="deleteJenisIzin('${i.ID_Jenis}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function editJenisIzin(id) { showToast('Edit izin: ' + id, 'info'); }
async function deleteJenisIzin(id) { 
  if(!confirm('Hapus jenis izin?')) return;
  try {
    await apiCall('deleteJenisIzin', { idJenis: id });
    showToast('Jenis izin dinonaktifkan', 'info');
    loadJenisIzinData();
  } catch(e) { showToast('Gagal', 'error'); }
}

// ==================== GLOBAL SETTINGS ====================
async function loadGlobalSettings() {
  try {
    const res = await apiCall('getSettingGlobal');
    if (res.success && res.settings) {
      const s = res.settings;
      const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };
      setVal('setNamaApp', s.NAMA_APP || 'Absensi Karyawan Pro');
      setVal('setLogo', s.LOGO_URL || '');
      setVal('setFolder', s.FOLDER_DRIVE_ID || '');
      setVal('setToleransi', s.TOLERANSI_KETERLAMBATAN_MENIT || '15');
      setVal('setKunci', s.KUNCI_JADWAL_KARYAWAN || 'LOCKED');
      setVal('setFace', s.FACE_DETECTION_MODE || 'BLINK');
      setVal('setGPS', s.GPS_VALIDATION || 'STRICT');
      const color = s.THEME_COLOR_PRIMARY || '#1a73e8';
      setVal('setColor', color);
      applyThemeColor(color);
    }
  } catch (e) { console.error('Gagal load setting', e); }
}

async function saveGlobalSetting() {
  const settings = [
    { parameter: 'NAMA_APP', value: document.getElementById('setNamaApp')?.value || '' },
    { parameter: 'LOGO_URL', value: document.getElementById('setLogo')?.value || '' },
    { parameter: 'FOLDER_DRIVE_ID', value: document.getElementById('setFolder')?.value || '' },
    { parameter: 'TOLERANSI_KETERLAMBATAN_MENIT', value: document.getElementById('setToleransi')?.value || '15' },
    { parameter: 'KUNCI_JADWAL_KARYAWAN', value: document.getElementById('setKunci')?.value || 'LOCKED' },
    { parameter: 'FACE_DETECTION_MODE', value: document.getElementById('setFace')?.value || 'BLINK' },
    { parameter: 'GPS_VALIDATION', value: document.getElementById('setGPS')?.value || 'STRICT' },
    { parameter: 'THEME_COLOR_PRIMARY', value: document.getElementById('setColor')?.value || '#1a73e8' }
  ];
  try {
    for (const s of settings) await apiCall('updateSettingGlobal', s);
    showToast('⚙️ Setting tersimpan!', 'success'); playSound('success');
    applyThemeColor(document.getElementById('setColor')?.value || '#1a73e8');
  } catch (e) { showToast('Gagal simpan setting', 'error'); }
}

function applyThemeColor(color) {
  if(!color) return;
  document.documentElement.style.setProperty('--primary', color);
  document.documentElement.style.setProperty('--primary-light', color + '20');
}

// ==================== SHIFT ====================
// ==================== SHIFT ====================
let editingShiftId = null;

async function loadShiftByToko() {
  const idToko = document.getElementById('shiftTokoSelect')?.value;
  
  // Reset form & tombol
  cancelShiftForm();
  
  if(!idToko) {
    shiftData = [];
    renderShiftTable();
    return;
  }
  
  try {
    const res = await apiCall('getShiftByToko', { idToko });
    if(res.success) { 
      shiftData = res.data || []; 
      renderShiftTable(); 
    }
  } catch(e) { 
    console.error(e); 
    showToast('Gagal memuat shift', 'error'); 
  }
}

function renderShiftTable() {
  const tbody = document.getElementById('shiftTbody');
  if(!tbody) return;
  
  if (!shiftData || shiftData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-secondary);">Belum ada shift untuk toko ini. Klik "Tambah Shift" untuk membuat.</td></tr>';
    return;
  }
  
  tbody.innerHTML = shiftData.map(s => {
    const isAktif = s.Status === 'Aktif';
    return `
    <tr>
      <td><strong>${s.Nama_Shift}</strong></td>
      <td>${formatJamToko(s.Jam_Masuk)}</td>
      <td>${formatJamToko(s.Jam_Pulang)}</td>
      <td>${s.Toleransi_Masuk_Menit || 15} menit</td>
      <td><span class="td-badge ${isAktif ? 'green' : 'gray'}">${s.Status}</span></td>
      <td>
        <button class="btn-sm btn-edit" onclick="showShiftForm('${s.ID_Shift}')">✏️</button>
        <button class="btn-sm ${isAktif ? 'btn-reject' : 'btn-approve'}" 
                onclick="toggleShiftStatus('${s.ID_Shift}', '${isAktif ? 'Nonaktif' : 'Aktif'}')"
                title="${isAktif ? 'Nonaktifkan' : 'Aktifkan'}">
          ${isAktif ? '🚫' : '✅'}
        </button>
        <button class="btn-sm btn-reject" style="background:#fce8e6;color:var(--danger);" 
                onclick="deleteShiftPermanent('${s.ID_Shift}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

function showShiftForm(idShift = null) {
  const idToko = document.getElementById('shiftTokoSelect')?.value;
  if (!idToko) {
    showToast('❌ Pilih toko terlebih dahulu!', 'error');
    return;
  }
  
  const formBox = document.getElementById('shiftFormBox');
  const addBtnWrap = document.getElementById('shiftAddBtnWrap');
  const title = document.getElementById('shiftFormTitle');
  const nama = document.getElementById('sfNama');
  const masuk = document.getElementById('sfMasuk');
  const pulang = document.getElementById('sfPulang');
  const toleransi = document.getElementById('sfToleransi');
  const idEdit = document.getElementById('sfIdEdit');
  
  editingShiftId = idShift;
  
  if (idShift) {
    // Mode Edit
    const s = shiftData.find(x => x.ID_Shift === idShift);
    if (!s) return;
    title.textContent = '✏️ Edit Shift';
    nama.value = s.Nama_Shift || '';
    masuk.value = formatJamToko(s.Jam_Masuk) || '08:00';
    pulang.value = formatJamToko(s.Jam_Pulang) || '17:00';
    toleransi.value = s.Toleransi_Masuk_Menit || 15;
    idEdit.value = idShift;
  } else {
    // Mode Tambah
    title.textContent = '➕ Tambah Shift Baru';
    nama.value = '';
    masuk.value = '08:00';
    pulang.value = '17:00';
    toleransi.value = 15;
    idEdit.value = '';
  }
  
  formBox.style.display = 'block';
  addBtnWrap.style.display = 'none';
  formBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  // Focus ke nama
  setTimeout(() => nama.focus(), 100);
}

function cancelShiftForm() {
  document.getElementById('shiftFormBox').style.display = 'none';
  document.getElementById('shiftAddBtnWrap').style.display = 'block';
  editingShiftId = null;
}

async function saveShiftForm() {
  const idToko = document.getElementById('shiftTokoSelect')?.value;
  const namaToko = tokoData.find(t => t.ID_Toko === idToko)?.Nama_Toko || '';
  
  const nama = document.getElementById('sfNama')?.value?.trim();
  const masuk = document.getElementById('sfMasuk')?.value;
  const pulang = document.getElementById('sfPulang')?.value;
  const toleransi = parseInt(document.getElementById('sfToleransi')?.value) || 15;
  
  if (!nama || !masuk || !pulang) {
    showToast('❌ Nama shift, jam masuk & jam pulang wajib diisi!', 'error');
    playSound('error');
    return;
  }
  
  try {
    if (editingShiftId) {
      // Update
      await apiCall('updateShift', {
        idShift: editingShiftId,
        namaShift: nama,
        jamMasuk: masuk,
        jamPulang: pulang,
        toleransi: toleransi
      });
      showToast('✅ Shift berhasil diupdate!', 'success');
    } else {
      // Tambah baru
      await apiCall('saveShift', {
        idToko: idToko,
        namaToko: namaToko,
        namaShift: nama,
        jamMasuk: masuk,
        jamPulang: pulang,
        toleransi: toleransi
      });
      showToast('✅ Shift berhasil ditambahkan!', 'success');
    }
    
    playSound('success');
    cancelShiftForm();
    loadShiftByToko();
    
  } catch (e) {
    showToast('❌ Gagal: ' + e.message, 'error');
    playSound('error');
  }
}

async function toggleShiftStatus(id, newStatus) {
  const konfirmasi = newStatus === 'Nonaktif' 
    ? 'Nonaktifkan shift ini?' 
    : 'Aktifkan kembali shift ini?';
    
  if (!confirm(konfirmasi)) return;
  
  try {
    await apiCall('updateShift', { idShift: id, status: newStatus });
    showToast(newStatus === 'Aktif' ? '✅ Shift diaktifkan' : '🚫 Shift dinonaktifkan', 'success');
    playSound('success');
    loadShiftByToko();
  } catch (e) {
    showToast('❌ Gagal: ' + e.message, 'error');
    playSound('error');
  }
}

async function deleteShiftPermanent(id) {
  if (!confirm('⚠️ Yakin HAPUS PERMANEN shift ini?\n\nSemua data historis absensi yang pakai shift ini akan rusak.\nTindakan ini TIDAK BISA dibatalkan!')) return;
  
  try {
    await apiCall('deleteShiftPermanent', { idShift: id });
    showToast('🗑️ Shift dihapus permanen', 'success');
    playSound('success');
    loadShiftByToko();
  } catch(e) { 
    showToast('❌ Gagal hapus: ' + e.message, 'error'); 
    playSound('error');
  }
}

// ==================== JADWAL ====================
/*function addJadwalRow() {
  const tbody = document.getElementById('jadwalTbodyAdmin');
  if(!tbody) return;
  const tr = document.createElement('tr');
  tr.innerHTML = `<td><select class="form-input"><option>Toko A</option></select></td><td><select class="form-input"><option>Pagi</option></select></td><td><input type="text" class="form-input" value="Senin-Jumat" style="width:180px;"></td><td><input type="date" class="form-input" value="2026-01-01"></td><td><input type="date" class="form-input" value="2099-12-31"></td><td><span class="td-badge green">Aktif</span></td><td><button class="btn-sm btn-reject" onclick="this.closest('tr').remove()">🗑️</button></td>`;
  tbody.appendChild(tr);
}*/

// ==================== GPS ====================
function ambilLokasiGPS() {
  const preview = document.getElementById('gpsPreview');
  if(preview) preview.innerHTML = '🔄 Mendeteksi lokasi...';
  if (!navigator.geolocation) {
    if(preview) preview.innerHTML = '❌ GPS tidak didukung';
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      document.getElementById('tokoLat').value = pos.coords.latitude.toFixed(6);
      document.getElementById('tokoLng').value = pos.coords.longitude.toFixed(6);
      if(preview) preview.innerHTML = `✅ Lokasi didapat! Akurasi: ${Math.round(pos.coords.accuracy)}m`;
      playSound('success');
    },
    (err) => { if(preview) preview.innerHTML = '❌ Gagal: ' + err.message; playSound('error'); },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

// ==================== MODAL & TOAST ====================
function openModal(id) { const el = document.getElementById(id); if(el) el.classList.add('active'); }
function closeModal(id) { const el = document.getElementById(id); if(el) el.classList.remove('active'); }
function closeModalOnOverlay(e, id) { if (e.target.id === id) closeModal(id); }

function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  if(!toast) return;
  toast.textContent = msg;
  toast.className = `toast toast-${type} show`;
  setTimeout(() => toast.classList.remove('show'), 4000);
}

function exportExcel() { showToast('📥 Export Excel sedang diproses...', 'info'); }
function exportPDF() { showToast('📄 Export PDF sedang diproses...', 'info'); }

// ==================== EXPORT ====================

// ============================================================
// GANTI FUNGSI exportPDF() — TAMBAH RINGKASAN DI ATAS TABEL
// ============================================================
function exportPDF() {
  const tableId = getCurrentTableId();
  const namaKar = getSelectedKaryawanName();
  const title = getExportTitle(namaKar);

  const table = document.getElementById(tableId);
  if (!table) { showToast('❌ Tabel tidak ditemukan', 'error'); return; }

  const clone = table.cloneNode(true);
  clone.querySelectorAll('img').forEach(img => {
    const span = document.createElement('span');
    span.textContent = '[Foto]';
    img.parentNode.replaceChild(span, img);
  });

  const summaryHTML = buildPrintSummary();

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="UTF-8">
      <style>
        @page { size: A4 portrait; margin: 12mm; }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { margin: 0; padding: 0; }
        }
        body {
          font-family: Arial, "Helvetica Neue", sans-serif;
          font-size: 9px;
          color: #202124;
          line-height: 1.3;
          padding: 8px;
        }
        h2 {
          text-align: center;
          margin: 0 0 2px 0;
          font-size: 14px;
        }
        .sub {
          text-align: center;
          font-size: 9px;
          color: #5f6368;
          margin-bottom: 8px;
        }

        /* Ringkasan Kompak */
        .summary-wrap {
          margin-bottom: 6px;
          page-break-inside: avoid;
        }
        .summary-title {
          font-size: 10px;
          font-weight: 700;
          margin-bottom: 4px;
          color: #202124;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 4px;
          margin-bottom: 6px;
        }
        .summary-box {
          border: 1px solid #dadce0;
          border-radius: 6px;
          padding: 4px 3px;
          text-align: center;
          line-height: 1.2;
        }
        .summary-box .label {
          font-size: 7px;
          color: #5f6368;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 1px;
        }
        .summary-box .value {
          font-size: 13px;
          font-weight: 700;
        }
        .summary-box .unit {
          font-size: 7px;
          color: #5f6368;
        }
        .bg-green { background: #e6f4ea !important; }
        .bg-blue  { background: #e8f0fe !important; }
        .bg-red   { background: #fce8e6 !important; }
        .bg-yellow{ background: #fef3c7 !important; }
        .bg-gray  { background: #f1f3f4 !important; }

        /* Upah Kompak */
        .upah-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
          margin-top: 4px;
        }
        .upah-box {
          border: 1px solid #dadce0;
          border-radius: 6px;
          padding: 4px 5px;
          background: #f8f9fa;
          line-height: 1.2;
        }
        .upah-box .label {
          font-size: 7px;
          color: #5f6368;
          margin-bottom: 1px;
        }
        .upah-box .value {
          font-size: 11px;
          font-weight: 700;
        }

        /* Tabel Kompak */
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8px;
          margin-top: 4px;
          page-break-inside: auto;
        }
        tr { page-break-inside: avoid; }
        th, td {
          border: 1px solid #333;
          padding: 3px 4px;
          text-align: left;
          vertical-align: top;
        }
        th {
          background: #1a73e8 !important;
          color: white !important;
          font-size: 8px;
        }
        tr:nth-child(even) { background: #f8f9fa !important; }
        .green { background: #e6f4ea !important; color: #065f46 !important; }
        .red   { background: #fce8e6 !important; color: #9e1a0a !important; }
        .yellow{ background: #fef3c7 !important; color: #92400e !important; }
        .blue  { background: #e8f0fe !important; color: #1a73e8 !important; }
        .gray  { background: #f1f3f4 !important; color: #5f6368 !important; }

        .footer {
          margin-top: 6px;
          font-size: 8px;
          text-align: center;
          color: #666;
          border-top: 1px solid #dadce0;
          padding-top: 4px;
        }
        .note {
          font-size: 8px;
          color: #5f6368;
          background: #e8f0fe;
          padding: 4px 5px;
          border-radius: 4px;
          margin-top: 4px;
          line-height: 1.3;
        }
      </style>
    </head>
    <body>
      <h2>${title}</h2>
      <div class="sub">
        Export: ${new Date().toLocaleString('id-ID')}
        ${namaKar ? ' | Karyawan: <strong>' + namaKar + '</strong>' : ''}
      </div>
      ${summaryHTML}
      ${clone.outerHTML}
      <div class="footer">Generated by Absensi Pro</div>
    </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => { printWindow.print(); }, 500);

  showToast('📄 Export PDF berhasil!', 'success');
  playSound('success');
}

// ============================================================
// GANTI FUNGSI exportExcel() — TAMBAH BARIS RINGKASAN DI ATAS CSV
// ============================================================
function exportExcel() {
  const tableId = getCurrentTableId();
  const namaKar = getSelectedKaryawanName();
  const filename = getExportFilename('csv', namaKar);

  const table = document.getElementById(tableId);
  if (!table) { showToast('❌ Tabel tidak ditemukan', 'error'); return; }

  let csv = [];

  // Header judul & karyawan
  csv.push(['"' + (getExportTitle(namaKar).replace(/"/g, '""')) + '"']);
  csv.push(['"Export: ' + new Date().toLocaleString('id-ID') + (namaKar ? ' | Karyawan: ' + namaKar : '') + '"']);
  csv.push(['""']); // baris kosong

  // Ringkasan (jika mode bulanan & karyawan dipilih)
  if (currentPage === 'laporan' && currentLaporanMode === 'bulanan' && namaKar) {
    const r = getSummaryValues();
    csv.push(['"📊 RINGKASAN BULANAN"']);
    csv.push(['"Hadir","Izin Approved","Telat","Total Jam Kerja","Total Jam Lembur"']);
    csv.push(['"' + r.hadir + '","' + r.izin + '","' + r.telat + '","' + r.jamKerja + '","' + r.jamLembur + '"']);
    csv.push(['""']);
    csv.push(['"📊 PERHITUNGAN UPAH"']);
    csv.push(['"Hari Kerja Seharusnya","Akumulasi Jam (Kerja+Lembur)","Jumlah Hari Kerja (÷9 jam)","Selisih Lebih (Lembur)","Toleransi Izin","Status Gaji"']);
    csv.push(['"' + r.hariSeharusnya + '","' + r.totalJam + '","' + r.hariKerja + '","' + r.selisih + '","' + r.toleransi + '","' + r.statusGaji + '"']);
    csv.push(['""']);
  }

  // Isi tabel
  const rows = table.querySelectorAll('tr');
  rows.forEach(row => {
    let cols = row.querySelectorAll('td, th');
    let rowData = [];
    cols.forEach(col => {
      let text = col.textContent.trim().replace(/"/g, '""');
      if (col.querySelector('img')) { const img = col.querySelector('img'); text = img.src || 'Foto'; }
      rowData.push('"' + text + '"');
    });
    csv.push(rowData.join(','));
  });

  const csvContent = '﻿' + csv.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('📥 Export Excel berhasil!', 'success');
  playSound('success');
}

// ============================================================
// TAMBAHKAN FUNGSI HELPER BARU INI (di bawah fungsi export)
// ============================================================
function getSelectedKaryawanName() {
  const sel = document.getElementById('laporanKaryawan');
  if (!sel || !sel.value) return '';
  const opt = sel.options[sel.selectedIndex];
  return opt ? opt.text.replace('👤 ', '').trim() : '';
}

function getExportFilename(ext, namaKar) {
  const date = new Date().toISOString().slice(0, 10);
  const page = currentPage === 'laporan' ? 'Laporan' : 'Absensi';
  const mode = currentLaporanMode.charAt(0).toUpperCase() + currentLaporanMode.slice(1);
  const kar = namaKar ? '_' + namaKar.replace(/\s+/g, '_') : '';
  return `${page}_${mode}${kar}_${date}.${ext}`;
}

function getExportTitle(namaKar) {
  if (currentPage === 'laporan') {
    const mode = currentLaporanMode.charAt(0).toUpperCase() + currentLaporanMode.slice(1);
    const kar = namaKar ? ' — ' + namaKar : '';
    return `Laporan Absensi ${mode}${kar}`;
  }
  return `Data Absensi — ${new Date().toLocaleDateString('id-ID')}`;
}

function getCurrentTableId() {
  if (currentPage === 'dashboard') return 'absensiTable';
  if (currentPage === 'laporan') return 'laporanTable';
  if (currentPage === 'absensi') return 'absensiFullTable';
  return 'absensiTable';
}

// Baca nilai ringkasan dari DOM (sudah dihitung saat load laporan)
// ============================================================
// GANTI getSummaryValues() dan buildPrintSummary() saja
// ============================================================

function getSummaryValues() {
  const get = (id) => {
    const el = document.getElementById(id);
    return el ? el.textContent.trim() : '';
  };

  // Ringkasan 5 card (ambil dari stat* yang sudah ada di HTML & diisi oleh hitungStatistikLaporan)
  const hadir    = get('statHadir')    || '0';
  const izin     = get('statIzin')     || '0';
  const telat    = get('statTelat')    || '0';
  const jamKerja = get('statJamKerja') || '0 jam 0 menit';
  const jamLembur= get('statJamLembur')|| '0 jam 0 menit';

  // Perhitungan Upah (ambil dari bln* yang diisi oleh hitungStatistikLaporan)
  return {
    hadir:        hadir,
    izin:         izin,
    telat:        telat,
    jamKerja:     jamKerja,
    jamLembur:    jamLembur,
    hariSeharusnya: get('blnHariSeharusnya')   || '-',
    totalJam:       get('blnTotalJam')          || '-',
    hariKerja:      get('blnHariKerja')         || '-',
    selisih:        get('blnSelisih')           || '-',
    toleransi:      get('blnToleransi')         || '2 hari',
    statusGaji:     get('blnStatus')            || '-',
    statusKet:      get('blnStatusKet')         || ''
  };
}

function buildPrintSummary() {
  if (!(currentPage === 'laporan' && currentLaporanMode === 'bulanan')) return '';
  const namaKar = getSelectedKaryawanName();
  if (!namaKar) return '';

  const r = getSummaryValues();

  return `
    <div class="summary-wrap">
      <div class="summary-title">📊 Ringkasan Bulanan — ${namaKar}</div>
      <div class="summary-grid">
        <div class="summary-box bg-green">
          <div class="label">Hadir</div>
          <div class="value">${r.hadir}</div>
          <div class="unit">hari</div>
        </div>
        <div class="summary-box bg-blue">
          <div class="label">Izin</div>
          <div class="value">${r.izin}</div>
          <div class="unit">hari</div>
        </div>
        <div class="summary-box bg-red">
          <div class="label">Telat</div>
          <div class="value">${r.telat}</div>
          <div class="unit">kali</div>
        </div>
        <div class="summary-box bg-blue">
          <div class="label">Jam Kerja</div>
          <div class="value" style="font-size:11px;">${r.jamKerja}</div>
        </div>
        <div class="summary-box bg-yellow">
          <div class="label">Jam Lembur</div>
          <div class="value" style="font-size:11px;">${r.jamLembur}</div>
        </div>
      </div>

      <div class="summary-title">📊 Perhitungan Upah</div>
      <div class="upah-grid">
        <div class="upah-box">
          <div class="label">Hari Kerja Seharusnya</div>
          <div class="value">${r.hariSeharusnya}</div>
        </div>
        <div class="upah-box">
          <div class="label">Akumulasi Jam</div>
          <div class="value">${r.totalJam}</div>
        </div>
        <div class="upah-box">
          <div class="label">Hari Kerja Aktual (÷9)</div>
          <div class="value" style="color:#1a73e8;">${r.hariKerja}</div>
        </div>
        <div class="upah-box">
          <div class="label">Selisih Lebih</div>
          <div class="value" style="color:#92400e;">${r.selisih}</div>
        </div>
        <div class="upah-box">
          <div class="label">Toleransi Izin</div>
          <div class="value" style="color:#065f46;">${r.toleransi}</div>
        </div>
        <div class="upah-box">
          <div class="label">Status Gaji</div>
          <div class="value">${r.statusGaji}</div>
        </div>
      </div>
      <div class="note">
        <strong>Rumus:</strong> (Jam Kerja + Jam Lembur) ÷ 9 jam/shift = Hari Kerja Aktual.
        <strong>Ketentuan:</strong> Izin ≤2 hari/bulan = gaji penuh. Izin >2 hari atau bolos = tidak dihitung upah.
      </div>
    </div>
  `;
}
// ==================== SETTING JADWAL — MAIN PAGE ====================
let jadwalWeekOffset = 0;
let jadwalDataGrid = [];

function prevWeekJadwal() {
  jadwalWeekOffset--;
  updateWeekDisplayJadwal();
  loadJadwalGrid();
  showToast('📅 Memuat minggu sebelumnya...', 'info');
}

function nextWeekJadwal() {
  jadwalWeekOffset++;
  updateWeekDisplayJadwal();
  loadJadwalGrid();
  showToast('📅 Memuat minggu berikutnya...', 'info');
}

function updateWeekDisplayJadwal() {
  const now = new Date();
  now.setDate(now.getDate() + (jadwalWeekOffset * 7));
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const senin = new Date(now); senin.setDate(diff);
  const minggu = new Date(senin); minggu.setDate(senin.getDate() + 6);
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  const el = document.getElementById('jadwalWeekDisplay');
  if(el) el.textContent = senin.toLocaleDateString('id-ID', opts) + ' – ' + minggu.toLocaleDateString('id-ID', opts);
}

async function loadJadwalGrid() {
  const idToko = document.getElementById('jadwalSelectToko')?.value;
  if (!idToko) {
    document.getElementById('scheduleGrid').innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-secondary);grid-column:1/-1;">Pilih toko untuk melihat jadwal</div>';
    return;
  }
  
  showToast('⏳ Memuat jadwal...', 'info');
  
  try {
    // Ambil karyawan aktif + jadwal mereka untuk minggu ini
    const karRes = await apiCall('getKaryawanList');
    const karyawan = (karRes.data || []).filter(k => k.Status === 'Aktif');
    
    // Ambil jadwal untuk periode ini
    const now = new Date();
    now.setDate(now.getDate() + (jadwalWeekOffset * 7));
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const senin = new Date(now); senin.setDate(diff);
    const minggu = new Date(senin); minggu.setDate(senin.getDate() + 6);
    
    const jadwalRes = await apiCall('getLaporanAbsensi', {
      mode: 'mingguan',
      tanggalMulai: senin.toISOString().split('T')[0],
      tanggalAkhir: minggu.toISOString().split('T')[0],
      idToko: idToko
    });
    
    renderScheduleGrid(karyawan, jadwalRes.data || [], senin, minggu);
    
  } catch (e) {
    showToast('❌ Gagal memuat jadwal: ' + e.message, 'error');
  }
}

function renderScheduleGrid(karyawanList, absensiData, senin, minggu) {
  const grid = document.getElementById('scheduleGrid');
  if(!grid) return;
  
  const hariList = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
  const hariNames = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu'];
  
  let html = '';
  
  // Header
  html += '<div class="grid-header">Karyawan</div>';
  for(let i=0; i<7; i++) {
    const tgl = new Date(senin); tgl.setDate(senin.getDate() + i);
    const d = tgl.getDate();
    const m = tgl.toLocaleDateString('id-ID', {month:'short'});
    html += `<div class="grid-header"><div class="day-name">${hariNames[i]}</div><div class="day-date">${d} ${m}</div></div>`;
  }
  
  // Rows per karyawan
  karyawanList.forEach(k => {
    html += '<div class="grid-row">';
    
    // Kolom karyawan
    const fotoUrl = k.Foto_URL ? getThumbUrl(k.Foto_URL) : '';
    const hasFoto = fotoUrl && fotoUrl.length > 10;
    html += `
      <div class="grid-cell">
        <div class="kar-info">
          <div class="kar-avatar">${hasFoto ? `<img src="${fotoUrl}" onerror="this.style.display='none';this.parentElement.textContent='${k.Nama.charAt(0)}'">` : k.Nama.charAt(0)}</div>
          <div>
            <div class="kar-name">${k.Nama}</div>
            <div class="kar-role">${k.Jabatan || 'Staff'}</div>
          </div>
        </div>
      </div>`;
    
    // 7 hari
    for(let i=0; i<7; i++) {
      const tgl = new Date(senin); tgl.setDate(senin.getDate() + i);
      const tglStr = tgl.toISOString().split('T')[0];
      const namaHari = hariList[i];
      
      // Cek jadwal di JADWAL_KARYAWAN sheet
      // Cek juga absensi
      const absen = absensiData.find(a => a.idKaryawan === k.ID_Karyawan && a.tanggal === tglStr);
      
      // Cek izin
      // Untuk sementara, tampilkan dari data jadwal yang sudah ada
      // atau placeholder jika belum ada
      
      // Cek jadwal aktif untuk hari ini
      const jadwalAktif = jadwalDataGrid.find(j => 
        j.ID_Karyawan === k.ID_Karyawan && 
        j.Hari_Berjalan?.includes(namaHari) &&
        new Date(j.Tanggal_Mulai) <= tgl &&
        new Date(j.Tanggal_Selesai) >= tgl
      );
      
      if (jadwalAktif) {
        const shift = shiftData.find(s => s.ID_Shift === jadwalAktif.ID_Shift);
        const shiftClass = shift ? (shift.Nama_Shift.toLowerCase().includes('pagi') ? 'pagi' : 
                          shift.Nama_Shift.toLowerCase().includes('siang') ? 'siang' : 
                          shift.Nama_Shift.toLowerCase().includes('malam') ? 'malam' : 'pagi') : 'pagi';
        
        html += `
          <div class="grid-cell" onclick="editJadwalCell('${k.ID_Karyawan}', '${tglStr}', '${namaHari}')">
            <div class="shift-block ${shiftClass}">
              <div class="shift-name">${shift?.Nama_Shift || 'Shift'}</div>
              <div class="shift-time">${formatJamToko(shift?.Jam_Masuk)} – ${formatJamToko(shift?.Jam_Pulang)}</div>
            </div>
          </div>`;
      } else {
        html += `
          <div class="grid-cell" onclick="editJadwalCell('${k.ID_Karyawan}', '${tglStr}', '${namaHari}')">
            <div class="cell-empty">+</div>
          </div>`;
      }
    }
    
    html += '</div>';
  });
  
  grid.innerHTML = html;
}

async function editJadwalCell(idKaryawan, tanggal, hari) {
  // Buka modal form jadwal untuk cell ini
  // Atau langsung quick-assign
  showToast(`Edit jadwal: ${idKaryawan} | ${hari}, ${tanggal}`, 'info');
  // Implementasi: buka modal form seperti sebelumnya
}

// Populate toko select saat buka page
function populateJadwalTokoSelect() {
  const sel = document.getElementById('jadwalSelectToko');
  if(!sel) return;
  sel.innerHTML = '<option value="">Pilih Toko...</option>';
  (tokoData || []).filter(t => t.Status === 'Aktif').forEach(t => {
    sel.innerHTML += `<option value="${t.ID_Toko}">${t.Nama_Toko}</option>`;
  });
}
// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  const bulanIni = today.slice(0,7);
  const tahunIni = new Date().getFullYear();
  
  const lapTanggal = document.getElementById('laporanTanggal');
  if(lapTanggal) lapTanggal.value = today;
  
  const lapBulan = document.getElementById('laporanBulan');
  if(lapBulan) lapBulan.value = bulanIni;
  
  const lapTahun = document.getElementById('laporanTahun');
  if(lapTahun) lapTahun.value = tahunIni;
  
  showPage('dashboard');
  
  // ==================== PUSHER REAL-TIME NOTIFICATIONS ====================
  try {
    if (typeof Pusher !== 'undefined') {
      const pusher = new Pusher('e912ab0d6c703b0d5c07', { cluster: 'ap1' });
      const channel = pusher.subscribe('pinguin-chat');

      channel.bind('absen-alert', function(data) {
          showToast('📍 ' + (data.pesan || 'Ada absen baru'), 'info');
          playSound('notif');
          if (currentPage === 'dashboard') loadDashboard();
          if (currentPage === 'absensi') loadAbsensiFull();
      });

      channel.bind('izin-alert', function(data) {
          showToast('📋 ' + (data.pesan || 'Pengajuan izin baru'), 'info');
          playSound('notif');
          if (currentPage === 'dashboard') loadDashboard();
          if (currentPage === 'notifikasi') loadNotifPage();
      });

      channel.bind('lembur-alert', function(data) {
          showToast('🔥 ' + (data.pesan || 'Pengajuan lembur baru'), 'info');
          playSound('notif');
          if (currentPage === 'dashboard') loadDashboard();
          if (currentPage === 'notifikasi') loadNotifPage();
      });

      channel.bind('swap-shift-alert', function(data) {
          showToast('🔄 ' + (data.pesan || 'Pengajuan tukar shift'), 'info');
          playSound('notif');
          if (currentPage === 'dashboard') loadDashboard();
      });
      
      console.log('Pusher admin notifications connected!');
    }
  } catch(e) {
    console.error("Pusher init error in admin: ", e);
  }
});