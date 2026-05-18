// ==================== STATE ====================
        let state = {
            user: null, photoData: null, gps: { lat: null, lng: null, accuracy: null, jarak: null },
            absenStatus: 'belum_masuk', absenTokoId: '', lemburTokoId: '', isLemburMode: false, jadwalOffset: 0, stream: null,
            tokoList: [], shiftList: [], karyawanList: [], notifList: [], notifShown: false,
            lemburStream: null, lemburPhotoData: null, audioUnlocked: false
        };

        const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxDyDhOWjdbi1dO9HBbcSEZumOkBGlg2Z4UzJ-YqcirnX7u487kUUOYota52PV-5BlN/exec';
        const LS_KEY = 'absensi_user_v2';
        const pathGambar = "https://lh3.googleusercontent.com/d/";
        const picoImages = {
            sukses: "1Tnf4KogLXDeGaXjzi7nT-6D0XDsLQJtI", gps_jauh: "1t3Ip_ioGD55TEWbkKPgtnYtDciidJuDZ",
            wajah_gagal: "1znuTlrMgr6b_qpWdrTwdW5FnPsbsd3cE", lembur_pending: "1q5q5rsFG0ZrhaGJyEulwU8MJjXAtFyKc",
            izin_sakit: "1wf65GL6UGY_qDfnGEhSYHxvYL5pRXJwf", izin_telat: "115BmzgFQ2uJHXk8khNGAhdYD0tRVrh1h",
            izin_pulang: "152ZtNSBruDX5KQOpo7fMv7SDws0u1VlF", izin_cuti: "1Tnxa9YDmJD0N0evyv7RGg9wRERDBm3zJ",
            error: "1Q5WxPZ2uulbNdZsggdCQ2HZhyJiFoJKV"
        };
        const picoBtnColors = {
            sukses: '#34C759', gps_jauh: '#FF3B30', wajah_gagal: '#FF9500', lembur_pending: '#0D8ABC',
            izin_sakit: '#8B95A5', izin_telat: '#FF9500', izin_pulang: '#FF9500', izin_cuti: '#00ACC1', error: '#C62828'
        };

        // ==================== LOCAL STORAGE LOGIN ====================
        function saveLogin(userData) {
            const data = { ...userData, loggedAt: Date.now() };
            localStorage.setItem(LS_KEY, JSON.stringify(data));
        }
        function loadLogin() {
            try {
                const raw = localStorage.getItem(LS_KEY);
                if (!raw) return null;
                const data = JSON.parse(raw);
                // Valid 30 hari
                const days30 = 30 * 24 * 60 * 60 * 1000;
                if (Date.now() - data.loggedAt > days30) {
                    localStorage.removeItem(LS_KEY);
                    return null;
                }
                return data;
            } catch (e) { return null; }
        }
        function clearLogin() {
            localStorage.removeItem(LS_KEY);
        }
        function parseDateSafe(dateVal) {
            if (!dateVal) return null;
            if (dateVal instanceof Date) {
                return isNaN(dateVal.getTime()) ? null : dateVal;
            }
            
            const str = String(dateVal).trim();
            if (!str || str === '-' || str === '—') return null;
            
            let d = new Date(str);
            if (!isNaN(d.getTime())) return d;
            
            const parts = str.split(/[\/\-\.]/);
            if (parts.length === 3) {
                if (parts[0].length === 4) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const day = parseInt(parts[2], 10);
                    d = new Date(year, month, day);
                    if (!isNaN(d.getTime())) return d;
                } else {
                    const day = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const year = parseInt(parts[2], 10);
                    d = new Date(year, month, day);
                    if (!isNaN(d.getTime())) return d;
                }
            }
            return null;
        }

        function resolveFotoUrl(url) {
            if (!url || !url.trim()) return '';
            
            // Konversi otomatis URL Google Drive ke thumbnail CDN publik beresolusi tinggi (bebas cookies & login Gmail)
            if (url.includes('drive.google.com')) {
                let driveId = '';
                const reg1 = /id=([^&]+)/;
                const reg2 = /\/file\/d\/([^/]+)/;
                const reg3 = /\/d\/([^/]+)/;
                
                let match = url.match(reg1) || url.match(reg2) || url.match(reg3);
                if (match && match[1]) {
                    driveId = match[1];
                    return `https://drive.google.com/thumbnail?sz=w1000&id=${driveId}`;
                }
            }
            
            if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) return url;
            return pathGambar + url;
        }

        function getPublicViewUrl(url, tipe = 'image') {
            if (!url || !url.trim()) return '';
            if (url.includes('drive.google.com')) {
                let driveId = '';
                const reg1 = /id=([^&]+)/;
                const reg2 = /\/file\/d\/([^/]+)/;
                const reg3 = /\/d\/([^/]+)/;
                
                let match = url.match(reg1) || url.match(reg2) || url.match(reg3);
                if (match && match[1]) {
                    driveId = match[1];
                    if (tipe === 'image') {
                        return `https://drive.google.com/thumbnail?sz=w1600&id=${driveId}`;
                    } else {
                        return `https://drive.google.com/file/d/${driveId}/view?usp=drivesdk`;
                    }
                }
            }
            return url;
        }

        // ==================== AUDIO UNLOCK ====================
        function unlockAudio() {
            if (state.audioUnlocked) return;
            ['soundSuccess', 'soundError', 'soundNotif', 'soundChatSent', 'soundTagAlert'].forEach(id => {
                const a = document.getElementById(id);
                if (a) { a.play().catch(() => { }); a.pause(); a.currentTime = 0; }
            });
            state.audioUnlocked = true;
        }

        function playSound(type) {
            if (!state.audioUnlocked) return;
            const audio = document.getElementById(
                type === 'success' ? 'soundSuccess' : 
                type === 'error' ? 'soundError' : 
                type === 'chatsent' ? 'soundChatSent' : 
                type === 'tagalert' ? 'soundTagAlert' : 
                'soundNotif'
            );
            if (audio) { audio.currentTime = 0; audio.play().catch(() => { }); }
        }

        // ==================== INIT ====================
        document.addEventListener('DOMContentLoaded', async () => {
            // Trigger Snow effects
            createSnowEffect('splashScreen');
            createSnowEffect('loginScreen');

            updateDate();
            initGPS();
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('izinTglMulai').value = today;

            // Initialize real-time Pusher WebSockets
            initPusher();
            initChatScrollListener();
            
            // ⚡ Muat cache lokal dan sinkronisasi server (1 kali saja saat buka aplikasi)
            loadCachedChatMessages();
            loadChatMessages();

            // Cek localStorage login
            const saved = loadLogin();
            if (saved && saved.id) {
                // Auto login dari localStorage
                state.user = { id: saved.id, name: saved.name, role: saved.role, tokoDefault: saved.tokoDefault, shiftDefault: saved.shiftDefault };
                state.currentUser = state.user;
                unlockAudio();
                showApp();
                
                // Daftarkan ke Webpushr agar bisa menerima notifikasi push latar belakang
                try { registerWebpushrUser(saved.id); } catch(e) { }
                try { checkNotificationStatus(); } catch(e) { }
                setupUserUI(saved.fotoUrl || '');
                
                // LANGSUNG HIDE SPLASH SCREEN (INSTANT LOAD!)
                hideSplashScreen();

                // Panggil API secara asinkron di background (Non-blocking!)
                testBackendConnection();
                loadKaryawanDropdown();
                
                loadTokoData().then(async () => {
                    if (state.user.tokoDefault) {
                        document.getElementById('selectToko').value = state.user.tokoDefault;
                        await onTokoChange();
                        if (state.user.shiftDefault) {
                            document.getElementById('selectShift').value = state.user.shiftDefault;
                            updateShiftInfo();
                        }
                    }
                });
                checkAbsenStatus();
                updateMonthlyRecap();
                stopCamera();
                showCameraOverlay();
                checkMyApprovals();
                startChatPolling(); // Mulai polling chat latar belakang otomatis untuk mendeteksi pesan masuk!
            } else {
                // Jika belum login, tampilkan splash screen sampai daftar karyawan selesai dimuat
                testBackendConnection();
                await loadKaryawanDropdown();
                hideSplashScreen();
            }
            
            // Mention Autocomplete Listeners
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                chatInput.addEventListener('input', () => {
                    const text = chatInput.value;
                    const caretPos = chatInput.selectionStart;
                    const textBeforeCaret = text.substring(0, caretPos);
                    const match = textBeforeCaret.match(/@([a-zA-Z0-9_]*)$/);
                    
                    const autocomplete = document.getElementById('chatMentionAutocomplete');
                    if (match && state.karyawanList && Array.isArray(state.karyawanList)) {
                        const query = match[1].toLowerCase();
                        // Filter matching employees (exclude self)
                        const filtered = state.karyawanList.filter(k => {
                            return (k.Nama || '').toLowerCase().includes(query) && 
                                   (!state.user || (k.Nama !== state.user.name));
                        });
                        
                        if (filtered.length > 0) {
                            autocomplete.innerHTML = filtered.map(k => {
                                const avatarColor = getHashCodeColor(k.Nama || 'Karyawan');
                                const initial = k.Nama ? k.Nama.charAt(0).toUpperCase() : '?';
                                const rawFotoUrl = k.Foto_URL || k.Foto_Profil || '';
                                const resolvedFoto = resolveFotoUrl(rawFotoUrl);
                                
                                let avatarHtml = '';
                                if (resolvedFoto) {
                                    avatarHtml = `<img src="${resolvedFoto}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; box-shadow: 0 2px 4px rgba(0,0,0,0.06); flex-shrink: 0;" alt="${k.Nama}">`;
                                } else {
                                    avatarHtml = `<div style="width: 32px; height: 32px; border-radius: 50%; background: ${avatarColor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.06); flex-shrink: 0; text-shadow: 0 1px 2px rgba(0,0,0,0.15);">${initial}</div>`;
                                }
                                
                                return `
                                <div class="mention-item" onclick="selectChatMention('${k.Nama.replace(/'/g, "\\'")}')" style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 12px; cursor: pointer; transition: background 0.2s; font-weight: 700; color: #334155; font-size: 13.5px; margin-bottom: 2px;" onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='none'">
                                    ${avatarHtml}
                                    <div style="display: flex; flex-direction: column;">
                                        <span style="font-size: 13px; color: #0f172a;">${k.Nama}</span>
                                        <span style="font-size: 9.5px; color: #64748b; font-weight: 600; margin-top: 1px;">@${k.Nama.replace(/\s+/g, '')}</span>
                                    </div>
                                </div>`;
                            }).join('');
                            autocomplete.style.display = 'block';
                        } else {
                            autocomplete.style.display = 'none';
                        }
                    } else {
                        autocomplete.style.display = 'none';
                    }
                });
                
                chatInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        document.getElementById('chatMentionAutocomplete').style.display = 'none';
                    }
                });
            }
            
            // Hide autocomplete when clicking outside
            document.addEventListener('click', (e) => {
                const autocomplete = document.getElementById('chatMentionAutocomplete');
                const chatInput = document.getElementById('chatInput');
                if (autocomplete && chatInput && !autocomplete.contains(e.target) && e.target !== chatInput) {
                    autocomplete.style.display = 'none';
                }
            });

            // Polling notifikasi live setiap 30 detik untuk live updates tanpa refresh!
            setInterval(checkMyApprovals, 30000);
        });

        async function testBackendConnection() {
            try {
                const res = await apiCall('testConnection');
                if (res.success) {
                    console.log('[CONN] ✅ Backend connected:', res.message, res.timestamp);
                    showToast('Terhubung ke server', 'success');
                } else {
                    console.warn('[CONN] ⚠️ Backend error:', res.error);
                    showToast('Server error: ' + res.error, 'error');
                }
            } catch (e) {
                console.error('[CONN] ❌ Connection failed:', e.message);
                showToast('Koneksi gagal: ' + e.message, 'error');
            }
        }

        function showApp() {
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('appContent').style.display = 'block';
        }

        const appStartTime = Date.now();

        function hideSplashScreen() {
            const splash = document.getElementById('splashScreen');
            if (splash) {
                const elapsed = Date.now() - appStartTime;
                const minDuration = 1000; // minimum duration 1 second
                const remaining = minDuration - elapsed;
                
                setTimeout(() => {
                    splash.style.opacity = '0';
                    splash.style.visibility = 'hidden';
                    setTimeout(() => {
                        try { splash.remove(); } catch(e) {}
                    }, 400);
                }, Math.max(0, remaining));
            }
        }

        // ==================== SNOW EFFECT ====================
        function createSnowEffect(containerId) {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            // Create snow-container wrapper
            const snowContainer = document.createElement('div');
            snowContainer.className = 'snow-container';
            container.appendChild(snowContainer);
            
            const snowflakeChars = ['❄', '❅', '❆', '•', '✧'];
            const maxSnowflakes = 45;
            
            for (let i = 0; i < maxSnowflakes; i++) {
                const flake = document.createElement('div');
                flake.className = 'snowflake';
                flake.textContent = snowflakeChars[Math.floor(Math.random() * snowflakeChars.length)];
                
                // Randomize positions, scale, delays, and speeds
                const left = Math.random() * 100;
                const size = 0.5 + Math.random() * 1.5;
                const delay = Math.random() * 8;
                const duration = 5 + Math.random() * 10;
                const opacity = 0.3 + Math.random() * 0.7;
                
                flake.style.left = `${left}%`;
                flake.style.fontSize = `${size}em`;
                flake.style.animationDelay = `${delay}s`;
                flake.style.animationDuration = `${duration}s`;
                flake.style.opacity = opacity;
                
                snowContainer.appendChild(flake);
            }
        }

        function setupUserUI(fotoUrl) {
            document.getElementById('headerName').textContent = state.user.name;
            document.getElementById('headerRole').textContent = (state.user.role || 'Staff');
            setHeaderAvatar(state.user.name, fotoUrl);
        }

        function setHeaderAvatar(name, fotoUrl) {
            const textEl = document.getElementById('headerAvatarText');
            const imgEl = document.getElementById('headerAvatarImg');
            const resolved = resolveFotoUrl(fotoUrl);
            if (resolved) {
                imgEl.src = resolved; imgEl.style.display = 'block'; textEl.style.display = 'none';
            } else {
                textEl.textContent = (name || 'U').charAt(0).toUpperCase();
                textEl.style.display = 'flex'; imgEl.style.display = 'none';
            }
        }

        // ==================== LOGIN ====================
        async function doLogin() {
            const sel = document.getElementById('loginSelect');
            const id = sel.value;
            const errBox = document.getElementById('loginError');
            const btn = document.getElementById('btnLogin');

            if (!id) {
                errBox.textContent = 'Pilih nama karyawan terlebih dahulu!';
                errBox.classList.add('show'); return;
            }

            const opt = sel.options[sel.selectedIndex];
            const name = opt.text;
            const role = opt.getAttribute('data-role') || 'Staff';
            const tokoId = opt.getAttribute('data-toko') || '';
            const shiftId = opt.getAttribute('data-shift') || '';
            const fotoUrl = opt.getAttribute('data-foto') || '';

            btn.disabled = true;
            btn.innerHTML = '<div class="spinner"></div> Memuat...';
            errBox.classList.remove('show');

            // Simulasi verifikasi ke backend (tanpa password)
            try {
                // Optional: verify ke backend
                const res = await apiCall('getKaryawanById', { idKaryawan: id });
                if (!res.success) {
                    // Fallback: tetap lanjut pakai data dari dropdown
                }
            } catch (e) { }

            state.user = { id, name, role, tokoDefault: tokoId, shiftDefault: shiftId };
            state.currentUser = state.user;

            // Simpan ke localStorage
            saveLogin({ id, name, role, tokoDefault: tokoId, shiftDefault: shiftId, fotoUrl });

            // Daftarkan ke Webpushr agar bisa menerima notifikasi push latar belakang
            try { registerWebpushrUser(id); } catch(e) { }
            try { checkNotificationStatus(); } catch(e) { }

            // Unlock audio context (user gesture)
            unlockAudio();

            showApp();
            setupUserUI(fotoUrl);

            await loadTokoData();
            if (tokoId) {
                document.getElementById('selectToko').value = tokoId;
                await onTokoChange();
                if (shiftId) {
                    document.getElementById('selectShift').value = shiftId;
                    updateShiftInfo();
                }
            }
            await checkAbsenStatus();
            await updateMonthlyRecap();
            updateTokoCardInfo();
            stopCamera();
            showCameraOverlay();
            checkMyApprovals();
            startChatPolling(); // Mulai polling chat latar belakang otomatis setelah sukses login!
            tampilPicoModal('sukses', '<b>Selamat datang, Kak ' + name + '!</b><br>PICO sangat senang melihatmu kembali hari ini! Semangat bekerja dan jaga kesehatan ya! 🥰🐧');

            btn.disabled = false;
            btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg> Masuk`;
        }

        // ==================== KARYAWAN DROPDOWN ====================
        async function loadKaryawanDropdown() {
            try {
                const res = await apiCall('getKaryawanList');
                if (res.success && Array.isArray(res.data)) {
                    state.karyawanList = res.data.filter(k => k.Status === 'Aktif');
                    const sel = document.getElementById('loginSelect');
                    sel.innerHTML = '<option value="">Pilih Nama...</option>';
                    state.karyawanList.forEach(k => {
                        const fotoUrl = k.Foto_URL || k.Foto_Profil || k.fotoUrl || '';
                        sel.innerHTML += `<option value="${k.ID_Karyawan}" data-toko="${k.Toko_Default || ''}" data-shift="${k.Shift_Default || ''}" data-role="${k.Jabatan || 'Staff'}" data-foto="${fotoUrl}">${k.Nama}</option>`;
                    });
                }
            } catch (e) { console.log('loadKaryawanDropdown error:', e); }
        }

        // ==================== TAB SWITCHING ====================
        function switchTab(tab) {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.querySelector('.nav-fab').style.background = '';
            
            const labelAbsensi = document.getElementById('labelAbsensi');
            if (labelAbsensi) labelAbsensi.style.color = 'var(--text-secondary)';

            if (tab === 'beranda') {
                document.getElementById('tabBeranda').classList.add('active');
                document.getElementById('navBeranda').classList.add('active');
                stopCamera();
            } else if (tab === 'absensi') {
                document.getElementById('tabAbsensi').classList.add('active');
                document.getElementById('navAbsensi').style.background = 'linear-gradient(135deg, #0A6B8E, #065473)';
                if (labelAbsensi) labelAbsensi.style.color = 'var(--primary)';
                // Auto-start camera after tab switch animation
                setTimeout(() => autoStartCamera(), 350);
            } else if (tab === 'data') {
                document.getElementById('tabData').classList.add('active');
                document.getElementById('navData').classList.add('active');
                stopCamera();
            }
        }

        function toggleAbsensiTab() {
            const tabAbsensi = document.getElementById('tabAbsensi');
            if (tabAbsensi.classList.contains('active')) {
                // Already on absensi tab -> go back to beranda (close)
                switchTab('beranda');
                showToast('Kembali ke Beranda', 'info');
            } else {
                // Open absensi tab -> auto start camera
                switchTab('absensi');
            }
        }

        // ==================== CAMERA ====================
        function showCameraOverlay() {
            document.getElementById('cameraOverlay').classList.remove('hidden');
        }
        function hideCameraOverlay() {
            document.getElementById('cameraOverlay').classList.add('hidden');
        }
        function showCameraError(msg) {
            const box = document.getElementById('cameraErrorBox');
            box.innerHTML = msg + ' <a href="#" onclick="showPermHelp();return false;" style="color:#8ab4f8;text-decoration:underline;font-weight:800;">Lihat Panduan</a>';
            box.classList.remove('hidden');
        }

        // Auto-start camera when tab opens - no manual button needed
        async function autoStartCamera() {
            // Small delay to let previous stream fully release
            await new Promise(r => setTimeout(r, 400));
            try {
                await startCameraStream();
                hideCameraOverlay();
            } catch (err) {
                if (err.name === 'NotAllowedError') { showCameraError('Izin kamera ditolak.'); showPermHelp(); }
                else if (err.name === 'NotFoundError') showCameraError('Kamera tidak ditemukan.');
                else if (err.name === 'NotReadableError') {
                    // Retry once after a longer delay for mobile browsers
                    showCameraError('Kamera sedang dipakai, mencoba ulang...');
                    await new Promise(r => setTimeout(r, 1500));
                    try {
                        await startCameraStream();
                        hideCameraOverlay();
                        document.getElementById('cameraErrorBox').classList.add('hidden');
                    } catch (err2) {
                        showCameraError('Kamera sedang dipakai aplikasi lain.');
                    }
                }
                else showCameraError('Gagal: ' + err.message);
            }
        }

        function stopCamera() {
            if (state.stream) {
                state.stream.getTracks().forEach(t => { t.stop(); });
                state.stream = null;
            }
            const video = document.getElementById('video');
            if (video) {
                video.srcObject = null;
                video.pause();
                video.load(); // Force release
            }
            // Don't show "Kamera mati" text since we removed faceLabel
            document.getElementById('faceFrame').classList.remove('active');
        }

        async function startCameraStream() {
            const video = document.getElementById('video');
            stopCamera();

            // Ensure video element is fully reset
            video.style.display = 'block';
            video.removeAttribute('src');

            const constraints = {
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false
            };
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
            }
            state.stream = stream;
            video.srcObject = stream;

            // Wait for video to be ready with better promise handling
            await new Promise((resolve, reject) => {
                const onLoaded = () => {
                    video.play().then(() => {
                        resolve();
                    }).catch(reject);
                };
                video.onloadedmetadata = onLoaded;
                video.onloadeddata = onLoaded;
                video.onerror = reject;
                setTimeout(() => reject(new Error('Timeout')), 10000);
            });

            document.getElementById('faceFrame').classList.add('active');
        }

        function capturePhoto() {
            if (document.getElementById('captureBtn').classList.contains('disabled')) return;
            const video = document.getElementById('video');
            const canvas = document.getElementById('canvas');
            const preview = document.getElementById('previewImg');
            if (!video.videoWidth || video.readyState < 2) {
                showToast('Kamera belum siap', 'error'); return;
            }
            // Kompres ukuran foto selfie
            let w = video.videoWidth;
            let h = video.videoHeight;
            const maxDimension = 640;
            if (w > maxDimension || h > maxDimension) {
                if (w > h) {
                    h = Math.round(h * maxDimension / w);
                    w = maxDimension;
                } else {
                    w = Math.round(w * maxDimension / h);
                    h = maxDimension;
                }
            }
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.translate(canvas.width, 0); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0);
            state.photoData = canvas.toDataURL('image/jpeg', 0.6);
            preview.src = state.photoData; preview.style.display = 'block';
            video.style.display = 'none'; document.getElementById('retakeBtn').style.display = 'block';
            document.getElementById('captureBtn').classList.add('disabled');
            stopCamera();
            showToast('Foto berhasil diambil', 'success'); playSound('success');
        }

        function retakePhoto() {
            document.getElementById('previewImg').style.display = 'none';
            document.getElementById('video').style.display = 'block';
            document.getElementById('retakeBtn').style.display = 'none';
            document.getElementById('captureBtn').classList.remove('disabled');
            state.photoData = null;
            stopCamera();
            // Auto-restart camera after retake
            setTimeout(() => autoStartCamera(), 300);
        }

        // ==================== GPS ====================
        function initGPS() {
            const badge = document.getElementById('gpsBadge');
            const text = document.getElementById('gpsText');
            if (!navigator.geolocation) {
                badge.className = 'gps-badge bad'; text.textContent = 'GPS tidak didukung'; return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    state.gps.lat = pos.coords.latitude; state.gps.lng = pos.coords.longitude; state.gps.accuracy = pos.coords.accuracy;
                    const toko = state.tokoList.find(t => t.ID_Toko === document.getElementById('selectToko').value);
                    if (toko && toko.Lat && toko.Long) {
                        const jarak = hitungJarak(state.gps.lat, state.gps.lng, parseFloat(toko.Lat), parseFloat(toko.Long));
                        state.gps.jarak = Math.round(jarak);
                        const radius = parseFloat(toko.Radius_M) || 50;
                        if (jarak <= radius) { badge.className = 'gps-badge ok'; text.textContent = `${Math.round(jarak)}m - Valid`; }
                        else { badge.className = 'gps-badge bad'; text.textContent = `${Math.round(jarak)}m - Jauh (max ${radius}m)`; }
                    } else {
                        badge.className = 'gps-badge ok'; text.textContent = `GPS aktif (${Math.round(pos.coords.accuracy)}m)`;
                    }
                },
                (err) => {
                    badge.className = 'gps-badge bad';
                    let msg = 'Gagal mendapatkan lokasi';
                    if (err.code === 1) msg = 'Izin GPS ditolak';
                    else if (err.code === 2) msg = 'Lokasi tidak tersedia';
                    else if (err.code === 3) msg = 'Timeout';
                    text.textContent = msg;
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

        // ==================== TOKO & SHIFT ====================
        async function loadTokoData() {
            try {
                const res = await apiCall('getTokoList');
                if (res.success && Array.isArray(res.data)) {
                    state.tokoList = res.data.filter(t => t.Status === 'Aktif');
                    const sel = document.getElementById('selectToko');
                    sel.innerHTML = '<option value="">Pilih...</option>';
                    state.tokoList.forEach(t => { sel.innerHTML += `<option value="${t.ID_Toko}">${t.Nama_Toko}</option>`; });
                    const selLembur = document.getElementById('lemburToko');
                    selLembur.innerHTML = '';
                    state.tokoList.forEach(t => { selLembur.innerHTML += `<option value="${t.ID_Toko}">${t.Nama_Toko}</option>`; });
                }
            } catch (e) { console.log('loadTokoData error:', e); }
        }

        async function onTokoChange() {
            const tokoId = document.getElementById('selectToko').value;
            const shiftSel = document.getElementById('selectShift');
            if (!tokoId) { shiftSel.innerHTML = '<option value="">Pilih...</option>'; document.getElementById('jamInfoCard').classList.add('hidden'); return; }
            try {
                const res = await apiCall('getShiftByToko', { idToko: tokoId });
                if (res.success && Array.isArray(res.data)) {
                    state.shiftList = res.data;
                    shiftSel.innerHTML = '<option value="">Pilih...</option>';
                    res.data.forEach(s => {
                        const jm = formatTimeFromResponse(s.Jam_Masuk);
                        const jp = formatTimeFromResponse(s.Jam_Pulang);
                        shiftSel.innerHTML += `<option value="${s.ID_Shift}">${s.Nama_Shift} (${jm} - ${jp})</option>`;
                    });
                    if (state.user.shiftDefault) { const ex = res.data.some(s => s.ID_Shift === state.user.shiftDefault); if (ex) shiftSel.value = state.user.shiftDefault; }
                    updateShiftInfo();
                }
            } catch (e) { console.log('onTokoChange error:', e); }
            initGPS();
            updateTokoCardInfo();
        }

        function updateShiftInfo() {
            const shiftId = document.getElementById('selectShift').value;
            const shift = state.shiftList.find(s => s.ID_Shift === shiftId);
            if (shift) {
                document.getElementById('jamInfoCard').classList.remove('hidden');
                const jamMasuk = formatTimeFromResponse(shift.Jam_Masuk);
                const jamPulang = formatTimeFromResponse(shift.Jam_Pulang);
                document.getElementById('infoJamMasuk').textContent = 'Jam Masuk: ' + jamMasuk;
                document.getElementById('infoJamPulang').textContent = 'Jam Pulang: ' + jamPulang;
                document.getElementById('shiftNama').textContent = (shift.Nama_Shift || 'Reguler') + ' - ' + jamMasuk + ' - ' + jamPulang;
            } else {
                document.getElementById('jamInfoCard').classList.add('hidden');
                document.getElementById('shiftNama').textContent = 'Reguler - --:-- - --:--';
            }
        }

        let dateIntervalId = null;
        function updateDate() {
            const run = () => {
                const now = new Date();
                const opt = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
                const dateStr = now.toLocaleDateString('id-ID', opt);
                
                const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');
                const cardTime = document.getElementById('cardTimeStr');
                if (cardTime) cardTime.textContent = timeStr;
                
                const bulanOpt = { month: 'long', year: 'numeric' };
                const bulanLabel = document.getElementById('statBulanLabel');
                const dataBulanLabel = document.getElementById('dataBulanLabel');
                const bulanStr = now.toLocaleDateString('id-ID', bulanOpt);
                if (bulanLabel) bulanLabel.textContent = dateStr; // Taruh Hari Tanggal Lengkap di sini!
                if (dataBulanLabel) dataBulanLabel.textContent = bulanStr;
            };
            run();
            if (!dateIntervalId) {
                dateIntervalId = setInterval(run, 1000);
            }
        }

        // ==================== TOKO CARD INFO ====================
        function updateTokoCardInfo() {
            const tokoId = document.getElementById('selectToko').value;
            const toko = state.tokoList.find(t => t.ID_Toko === tokoId);
            const img = document.getElementById('fotoTokoCard');
            const nama = document.getElementById('namaTokoCard');
            if (toko) {
                nama.textContent = toko.Nama_Toko || '-';
                if (toko.Foto_Toko_URL || toko.Foto_URL || toko.Gambar || toko.fotoUrl) {
                    img.src = toko.Foto_Toko_URL || toko.Foto_URL || toko.Gambar || toko.fotoUrl;
                    img.style.display = 'block';
                } else {
                    img.style.display = 'none';
                }
            } else {
                nama.textContent = '-';
                img.style.display = 'none';
            }
        }

        // ==================== ABSEN ====================
        async function checkAbsenStatus() {
            if (!state.user || !state.user.id) { state.absenStatus = 'belum_masuk'; updateButtonVisibility(); return; }
            try {
                const res = await apiCall('getAbsenStatus', { idKaryawan: state.user.id });
                if (res && res.status) {
                    state.absenStatus = res.status;
                    state.jamMasukReal = '';
                    state.jamMasukShift = '';
                    state.jamPulangShift = '';
                    state.lemburStatus = (res.lembur && res.lembur.Status) || '';
                    state.lemburTokoId = (res.lembur && (res.lembur.ID_Toko || res.lembur.idToko)) || '';
                    state.absenTokoId = '';
                    if (res.status === 'sudah_pulang') {
                        const d = res.data || {};
                        state.absenTokoId = d.ID_Toko || d.idToko || '';
                        state.jamMasukReal = d.Jam_Masuk || d.jamMasuk || '';
                        state.jamMasukShift = (res.shift && res.shift.Jam_Masuk) || '';
                        state.jamPulangShift = (res.shift && res.shift.Jam_Pulang) || '';
                        state.jamPulangReal = d.Jam_Pulang || d.jamPulang || '';
                        document.getElementById('statusMasuk').textContent = 'Masuk: ' + formatTimeFromResponse(d.Jam_Masuk || d.jamMasuk);
                        document.getElementById('statusMasuk').className = 'status-masuk-capsule ok';
                        document.getElementById('statusPulang').textContent = 'Pulang: ' + formatTimeFromResponse(d.Jam_Pulang || d.jamPulang);
                        document.getElementById('statusPulang').className = 'status-pulang-capsule ok';
                    } else if (res.status === 'sudah_masuk') {
                        const d = res.data || {};
                        state.absenTokoId = d.ID_Toko || d.idToko || '';
                        state.jamMasukReal = d.Jam_Masuk || d.jamMasuk || '';
                        state.jamMasukShift = (res.shift && res.shift.Jam_Masuk) || '';
                        state.jamPulangShift = (res.shift && res.shift.Jam_Pulang) || '';
                        document.getElementById('statusMasuk').textContent = 'Masuk: ' + formatTimeFromResponse(d.Jam_Masuk || d.jamMasuk);
                        document.getElementById('statusMasuk').className = 'status-masuk-capsule ok';
                        document.getElementById('statusPulang').textContent = 'Pulang: --';
                        document.getElementById('statusPulang').className = 'status-pulang-capsule pending';
                    } else {
                        document.getElementById('statusMasuk').textContent = 'Masuk: --';
                        document.getElementById('statusMasuk').className = 'status-masuk-capsule pending';
                        document.getElementById('statusPulang').textContent = 'Pulang: --';
                        document.getElementById('statusPulang').className = 'status-pulang-capsule pending';
                    }
                }
            } catch(e) { console.error('checkAbsenStatus error:', e); }
            updateButtonVisibility();
        }

        function getEarlyCheckInMinutes(realTimeStr, shiftTimeStr) {
            if (!realTimeStr || !shiftTimeStr) return 0;
            const parseTimeToMinutes = (str) => {
                const parts = String(str).split(':');
                if (parts.length < 2) return 0;
                return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            };
            const realMin = parseTimeToMinutes(realTimeStr);
            const shiftMin = parseTimeToMinutes(shiftTimeStr);
            return shiftMin - realMin;
        }

        function getLateCheckOutMinutes(realTimeStr, shiftTimeStr) {
            if (!realTimeStr || !shiftTimeStr) return 0;
            const parseTimeToMinutes = (str) => {
                const parts = String(str).split(':');
                if (parts.length < 2) return 0;
                return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            };
            const realMin = parseTimeToMinutes(realTimeStr);
            const shiftMin = parseTimeToMinutes(shiftTimeStr);
            return realMin - shiftMin;
        }

        function isCurrentTimeOutsideShift(shiftStartStr, shiftEndStr) {
            if (!shiftStartStr || !shiftEndStr) return false;
            const now = new Date();
            const curMin = now.getHours() * 60 + now.getMinutes();
            
            const parseTimeToMinutes = (str) => {
                const parts = String(str).split(':');
                if (parts.length < 2) return 0;
                return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
            };
            
            const startMin = parseTimeToMinutes(shiftStartStr);
            const endMin = parseTimeToMinutes(shiftEndStr);
            
            if (endMin < startMin) {
                return curMin < startMin && curMin > endMin;
            }
            return curMin < startMin || curMin > endMin;
        }

        function updateButtonVisibility() {
            const bm = document.getElementById('btnMasuk');
            const bp = document.getElementById('btnPulang');
            const bl = document.getElementById('btnLembur');
            const ml = document.getElementById('menuLembur');
            
            if (!bl) return;
            
            if (!state.user || !state.user.id) {
                bm.classList.remove('hidden');
                bp.classList.add('hidden');
                bl.classList.add('hidden');
                return;
            }
            
            bl.classList.remove('hidden');
            
            let isLemburDisabled = false;
            
            if (state.absenStatus === 'belum_masuk') {
                bm.classList.remove('hidden');
                bp.classList.add('hidden');
                isLemburDisabled = true;
                bl.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Belum Absen Masuk`;
            } else if (state.absenStatus === 'sudah_masuk') {
                bm.classList.add('hidden');
                bp.classList.remove('hidden');
                
                // Selama shift berjalan (sudah absen masuk), tombol lembur selalu aktif/bisa diakses
                isLemburDisabled = false;
                bl.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> MODE LEMBUR`;
            } else if (state.absenStatus === 'sudah_pulang') {
                bm.classList.add('hidden');
                bp.classList.add('hidden');
                
                // Setelah absen pulang, tombol lembur kembali off
                isLemburDisabled = true;
                bl.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> Sudah Absen Pulang`;
            } else {
                bm.classList.add('hidden');
                bp.classList.add('hidden');
                bl.classList.add('hidden');
            }
            
            bl.disabled = isLemburDisabled;
            
            if (ml) {
                if (isLemburDisabled) {
                    ml.disabled = true;
                    ml.style.cursor = 'not-allowed';
                    ml.style.opacity = '0.5';
                    ml.removeAttribute('onclick');
                    
                    const iconWrap = ml.querySelector('.menu-icon');
                    if (iconWrap) {
                        iconWrap.style.background = '#F1F5F9';
                        const svg = iconWrap.querySelector('svg');
                        if (svg) svg.style.stroke = '#94A3B8';
                    }
                    const label = ml.querySelector('.menu-label');
                    if (label) label.style.color = '#94A3B8';
                } else {
                    ml.disabled = false;
                    ml.style.cursor = 'pointer';
                    ml.style.opacity = '1';
                    ml.setAttribute('onclick', "openModal('modalLembur')");
                    
                    const iconWrap = ml.querySelector('.menu-icon');
                    if (iconWrap) {
                        iconWrap.style.background = '#FFF3E0';
                        const svg = iconWrap.querySelector('svg');
                        if (svg) svg.style.stroke = '#FF9500';
                    }
                    const label = ml.querySelector('.menu-label');
                    if (label) label.style.color = '';
                }
            }
            
            const isOvertimeActive = (state.absenStatus !== 'sudah_pulang') && 
                                     (state.lemburStatus === 'Approved') && 
                                     isCurrentTimeOutsideShift(state.jamMasukShift, state.jamPulangShift);
            
            if (isOvertimeActive) {
                document.body.classList.add('overtime-glow-active');
            } else {
                document.body.classList.remove('overtime-glow-active');
            }
        }

        async function absenMasuk() {
            if (!state.photoData) { tampilPicoModal('wajah_gagal', 'Ambil foto selfie dulu ya!'); return; }
            if (!state.user || !state.user.id) { showToast('Login dulu!', 'error'); playSound('error'); return; }
            if (!document.getElementById('selectToko').value) { showToast('Pilih toko dulu!', 'error'); return; }
            if (!document.getElementById('selectShift').value) { showToast('Pilih shift dulu!', 'error'); return; }

            const toko = state.tokoList.find(t => t.ID_Toko === document.getElementById('selectToko').value);
            if (toko && state.gps.jarak !== null) {
                const radius = parseFloat(toko.Radius_M) || 50;
                if (state.gps.jarak > radius) { tampilPicoModal('gps_jauh', `Anda ${state.gps.jarak}m dari toko. Max ${radius}m.<br>Mendekatlah!`); return; }
            }

            const shiftSelect = document.getElementById('selectShift');
            const shiftName = shiftSelect.options[shiftSelect.selectedIndex].text.split(' (')[0];
            const btn = document.getElementById('btnMasuk');
            btn.disabled = true; btn.innerHTML = '<div class="spinner"></div> Memproses...';

            try {
                const res = await apiCall('absenMasuk', {
                    idKaryawan: state.user.id, nama: state.user.name,
                    idToko: document.getElementById('selectToko').value, namaToko: toko ? toko.Nama_Toko : '',
                    idShift: document.getElementById('selectShift').value, namaShift: shiftName,
                    fotoBase64: state.photoData, lat: state.gps.lat, lng: state.gps.lng
                });
                if (res.success) {
                    state.absenStatus = 'sudah_masuk'; updateButtonVisibility();
                    tampilPicoModal('sukses', `<b>Absen Masuk Berhasil!</b><br>Jam: ${formatTimeFromResponse(res.jamMasuk)}<br>Status: ${res.statusMasuk}`);
                    document.getElementById('statusMasuk').textContent = 'Masuk: ' + formatTimeFromResponse(res.jamMasuk);
                    document.getElementById('statusMasuk').className = 'status-masuk-capsule ok';
                    // Refresh status so button changes to Pulang
                    await checkAbsenStatus();
                    await updateMonthlyRecap();
                    retakePhoto();
                } else { tampilPicoModal('error', res.error || 'Gagal absen masuk'); }
            } catch (e) { tampilPicoModal('error', 'Gagal: ' + e.message); }
            finally { btn.disabled = false; btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> ABSEN MASUK`; }
        }

        async function absenPulang() {
            if (!state.photoData) { tampilPicoModal('wajah_gagal', 'Ambil foto selfie dulu ya!'); return; }
            if (!state.user || !state.user.id) { showToast('Login dulu!', 'error'); return; }

            // Validasi GPS untuk Absen Pulang
            if (state.gps.lat === null || state.gps.lng === null) {
                showToast('Koordinat GPS belum dimuat! Nyalakan GPS Anda dan tunggu sebentar.', 'error');
                return;
            }
            
            // Jarak ke Toko Asal Absen Masuk
            let jarakAsal = Infinity;
            let radiusAsal = 50;
            const asalToko = state.tokoList.find(t => t.ID_Toko === state.absenTokoId);
            if (asalToko && asalToko.Lat && asalToko.Long) {
                jarakAsal = hitungJarak(state.gps.lat, state.gps.lng, parseFloat(asalToko.Lat), parseFloat(asalToko.Long));
                radiusAsal = parseFloat(asalToko.Radius_M) || 50;
            }
            
            // Jarak ke Toko Lembur (jika ada lembur yang DISETUJUI / Approved)
            let jarakLembur = Infinity;
            let radiusLembur = 50;
            let lemburToko = null;
            const isLemburApproved = state.lemburStatus === 'Approved';
            
            if (isLemburApproved && state.lemburTokoId) {
                lemburToko = state.tokoList.find(t => t.ID_Toko === state.lemburTokoId);
                if (lemburToko && lemburToko.Lat && lemburToko.Long) {
                    jarakLembur = hitungJarak(state.gps.lat, state.gps.lng, parseFloat(lemburToko.Lat), parseFloat(lemburToko.Long));
                    radiusLembur = parseFloat(lemburToko.Radius_M) || 50;
                }
            }
            
            const isNearAsal = jarakAsal <= radiusAsal;
            const isNearLembur = isLemburApproved && (jarakLembur <= radiusLembur);
            
            if (!isNearAsal && !isNearLembur) {
                let msg = `<b>Gagal Absen Pulang!</b><br><br>Anda berada di luar jangkauan area toko:<br>`;
                if (asalToko) {
                    msg += `- <b>${Math.round(jarakAsal)}m</b> dari Toko Asal (${asalToko.Nama_Toko}) (Max ${radiusAsal}m)<br>`;
                }
                if (isLemburApproved && lemburToko) {
                    msg += `- <b>${Math.round(jarakLembur)}m</b> dari Toko Lembur (${lemburToko.Nama_Toko}) (Max ${radiusLembur}m)<br>`;
                }
                msg += `<br><span style="color:#E53935;font-weight:800;">Silakan mendekat ke toko untuk melakukan absen pulang!</span>`;
                tampilPicoModal('gps_jauh', msg);
                return;
            }

            const btn = document.getElementById('btnPulang');
            btn.disabled = true; btn.innerHTML = '<div class="spinner"></div> Memproses...';
            try {
                const res = await apiCall('absenPulang', {
                    idKaryawan: state.user.id, nama: state.user.name,
                    fotoBase64: state.photoData, lat: state.gps.lat, lng: state.gps.lng
                });
                if (res.success) {
                    state.absenStatus = 'sudah_pulang'; updateButtonVisibility();
                    tampilPicoModal('izin_pulang', `<b>Absen Pulang Berhasil!</b><br>Durasi: ${res.durasiKerja || '-'}<br>Jam: ${formatTimeFromResponse(res.jamPulang)}`);
                    document.getElementById('statusPulang').textContent = 'Pulang: ' + formatTimeFromResponse(res.jamPulang);
                    document.getElementById('statusPulang').className = 'status-pulang-capsule ok';
                    // Refresh status so buttons hide
                    await checkAbsenStatus();
                    await updateMonthlyRecap();
                    retakePhoto();
                } else { tampilPicoModal('error', res.error || 'Gagal absen pulang'); }
            } catch (e) { tampilPicoModal('error', 'Gagal: ' + e.message); }
            finally { btn.disabled = false; btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> ABSEN PULANG`; }
        }

        function toggleLemburMode() {
            if (state.absenStatus === 'belum_masuk') {
                showToast('Anda harus absen masuk terlebih dahulu!', 'error');
                return;
            }
            openModal('modalLembur');
        }

        // ==================== LEMBUR ====================
        async function submitLembur() {
            if (!state.user || !state.user.id) { showToast('Login dulu!', 'error'); return; }
            const tokoId = document.getElementById('lemburToko').value;
            const toko = state.tokoList.find(t => t.ID_Toko === tokoId);
            
            const ketType = document.getElementById('lemburKeteranganType').value;
            const ketManual = document.getElementById('lemburKeteranganManual').value.trim();
            const keterangan = ketType === 'Lainnya' ? ketManual : ketType;
            
            if (!keterangan) {
                showToast('Keterangan lembur wajib diisi!', 'error');
                return;
            }
            
            if (!state.lemburPhotoData) {
                showToast('Foto bukti lembur wajib diambil!', 'error');
                return;
            }
            
            const btn = document.querySelector('button[onclick="submitLembur()"]');
            const originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<div class="spinner"></div> Mengirim...';
            
            try {
                const res = await apiCall('ajukanLembur', {
                    idKaryawan: state.user.id,
                    nama: state.user.name,
                    idToko: tokoId,
                    namaToko: toko ? toko.Nama_Toko : '',
                    alasan: keterangan,
                    fotoBase64: state.lemburPhotoData
                });
                
                if (res.success) {
                    closeModal('modalLembur');
                    tampilPicoModal('lembur_pending', 'Pengajuan lembur terkirim!<br>Tunggu approve dari Bos ya!');
                    resetLemburFoto();
                } else {
                    showToast(res.error || 'Gagal mengajukan lembur', 'error');
                }
            } catch (e) {
                showToast('Gagal ajukan lembur: ' + e.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }
        }

        function toggleLemburKeterangan() {
            const ketType = document.getElementById('lemburKeteranganType').value;
            const manualGroup = document.getElementById('lemburKeteranganManualGroup');
            if (manualGroup) {
                manualGroup.classList.toggle('hidden', ketType !== 'Lainnya');
            }
        }

        async function handleLemburFotoSelect(input) {
            const label = document.getElementById('lemburFotoLabel');
            const previewContainer = document.getElementById('lemburFotoPreviewContainer');
            const previewImg = document.getElementById('lemburFotoPreview');
            
            if (!label) return;
            
            if (input.files && input.files[0]) {
                const file = input.files[0];
                label.textContent = file.name;
                label.parentElement.style.borderColor = 'var(--primary)';
                label.parentElement.style.color = 'var(--primary)';
                
                try {
                    // Kompresi otomatis gambar ke kualitas 60% dan lebar maks 800px
                    const compressed = await compressImage(file, 0.6, 800);
                    state.lemburPhotoData = compressed.base64;
                    
                    if (previewImg) previewImg.src = compressed.base64;
                    if (previewContainer) previewContainer.style.display = 'block';
                } catch (e) {
                    console.error('Gagal kompresi foto lembur:', e);
                    showToast('Gagal memproses gambar', 'error');
                }
            } else {
                resetLemburFoto();
            }
        }

        function resetLemburFoto(e) {
            if (e) e.stopPropagation();
            const fileInput = document.getElementById('lemburFotoInput');
            const label = document.getElementById('lemburFotoLabel');
            const previewContainer = document.getElementById('lemburFotoPreviewContainer');
            const previewImg = document.getElementById('lemburFotoPreview');
            
            state.lemburPhotoData = null;
            if (fileInput) fileInput.value = '';
            if (label) {
                label.textContent = 'Ambil Foto Bukti (Kamera)';
                label.parentElement.style.borderColor = '#CBD5E1';
                label.parentElement.style.color = '#64748B';
            }
            if (previewContainer) previewContainer.style.display = 'none';
            if (previewImg) previewImg.src = '';
        }

        // ==================== IZIN ====================
        function selectIzin(el, type, idJenis) {
            document.querySelectorAll('.izin-chip').forEach(c => c.classList.remove('active'));
            el.classList.add('active');
            
            state.selectedIzin = {
                type: type,
                idJenis: idJenis,
                namaJenis: el.textContent.trim()
            };
            
            const groupSelesai = document.getElementById('groupIzinTglSelesai');
            const kuotaInfo = document.getElementById('kuotaInfo');
            
            if (type === 'sakit') {
                if (groupSelesai) groupSelesai.style.display = 'none';
                if (kuotaInfo) kuotaInfo.style.display = 'none';
            } else {
                if (groupSelesai) groupSelesai.style.display = 'block';
                if (kuotaInfo) {
                    kuotaInfo.style.display = 'block';
                    fetchAndShowKuota(type);
                }
            }
        }

        async function fetchAndShowKuota(type) {
            const kuotaEl = document.getElementById('kuotaInfo');
            if (!state.user || !state.user.id) return;
            kuotaEl.innerHTML = 'Memuat sisa kuota...';
            try {
                const res = await apiCall('getSisaKuota', { idKaryawan: state.user.id });
                if (res && res.success && res.kuota) {
                    const k = res.kuota[type];
                    if (k) {
                        if (type === 'cuti' || type === 'izin') {
                            kuotaEl.innerHTML = `Sisa kuota bulan ini (gabungan Cuti & Izin): <strong>${k.sisa !== null ? k.sisa + ' hari' : 'Tanpa batas'}</strong>`;
                        } else {
                            kuotaEl.innerHTML = `Sisa kuota untuk ${k.nama}: <strong>${k.sisa !== null ? k.sisa + ' hari' : 'Tanpa batas'}</strong>`;
                        }
                    } else {
                        kuotaEl.innerHTML = `Sisa kuota: <strong>Tanpa batas</strong>`;
                    }
                } else {
                    kuotaEl.innerHTML = 'Gagal memuat kuota';
                }
            } catch (e) {
                kuotaEl.innerHTML = 'Gagal memuat kuota';
            }
        }

        async function loadDynamicJenisIzin() {
            const container = document.getElementById('izinChipsContainer');
            if (!container) return;
            
            container.innerHTML = '<div style="font-size:14px;color:var(--text-secondary);padding:6px 0;">Memuat kategori...</div>';
            
            try {
                const res = await apiCall('getJenisIzinAktif', { idKaryawan: state.user.id });
                if (res && res.success && res.data && res.data.length > 0) {
                    container.innerHTML = '';
                    res.data.forEach((item, index) => {
                        const chip = document.createElement('div');
                        chip.className = 'izin-chip' + (index === 0 ? ' active' : '');
                        chip.textContent = item.Nama_Jenis;
                        chip.onclick = () => selectIzin(chip, item.Kode, item.ID_Jenis);
                        container.appendChild(chip);
                        
                        // Select the first one by default
                        if (index === 0) {
                            selectIzin(chip, item.Kode, item.ID_Jenis);
                        }
                    });
                } else {
                    container.innerHTML = '<div style="font-size:14px;color:red;padding:6px 0;">Gagal memuat kategori izin</div>';
                }
            } catch (e) {
                container.innerHTML = '<div style="font-size:14px;color:red;padding:6px 0;">Error koneksi data</div>';
            }
        }

        async function submitIzin() {
            if (!state.user || !state.user.id) { showToast('Login dulu!', 'error'); return; }
            const tglMulai = document.getElementById('izinTglMulai').value;
            const tglSelesaiInput = document.getElementById('izinTglSelesai');
            const alasan = document.getElementById('izinAlasan').value;
            
            // Lampiran file upload
            const fileInput = document.getElementById('izinLampiran');
            
            if (!state.selectedIzin) { showToast('Pilih kategori izin dulu!', 'error'); return; }
            const { type, idJenis, namaJenis } = state.selectedIzin;
            
            if (!tglMulai) { showToast('Pilih tanggal mulai dulu!', 'error'); return; }
            
            let tglSelesai = '';
            if (type !== 'sakit') {
                tglSelesai = tglSelesaiInput.value;
                if (!tglSelesai) { showToast('Pilih tanggal selesai dulu!', 'error'); return; }
                if (new Date(tglSelesai) < new Date(tglMulai)) {
                    showToast('Tanggal selesai tidak boleh sebelum tanggal mulai!', 'error');
                    return;
                }
            }
            
            if (!alasan.trim()) { showToast('Isi alasan dulu!', 'error'); return; }

            // Set button to loading state
            const submitBtn = document.querySelector('#modalIzin .btn-primary');
            const originalHtml = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<div class="spinner"></div> Mengirim...';

            const proceedSubmit = async (base64Data = '') => {
                try {
                    const res = await apiCall('ajukanIzin', {
                        idKaryawan: state.user.id, nama: state.user.name,
                        idJenisIzin: idJenis, namaJenis: namaJenis,
                        tglMulai: tglMulai, tglSelesai: tglSelesai, alasan: alasan, lampiranBase64: base64Data
                    });
                    if (res && res.success) {
                        closeModal('modalIzin');
                        // Reset form fields
                        document.getElementById('izinAlasan').value = '';
                        if (tglSelesaiInput) tglSelesaiInput.value = '';
                        if (fileInput) {
                            fileInput.value = '';
                            updateFileName(fileInput);
                        }
                        tampilPicoModal('izin_cuti', 'Pengajuan izin terkirim!<br>Menunggu approve admin');
                    } else {
                        showToast(res.error || 'Gagal ajukan izin', 'error');
                    }
                } catch (e) { 
                    showToast('Gagal ajukan izin', 'error'); 
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalHtml;
                }
            };

            // Baca file lampiran jika ada (Kompresi Gambar otomatis)
            if (fileInput && fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                try {
                    let base64Data = '';
                    if (file.type.startsWith('image/')) {
                        // Kompresi gambar ke kualitas 60% dan lebar maks 800px
                        const compressed = await compressImage(file, 0.6, 800);
                        base64Data = compressed.base64;
                    } else {
                        // Jika PDF, baca langsung
                        base64Data = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = (e) => resolve(e.target.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                        });
                    }
                    await proceedSubmit(base64Data);
                } catch (e) {
                    console.error('Gagal memproses lampiran:', e);
                    showToast('Gagal memproses file lampiran', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalHtml;
                }
            } else {
                await proceedSubmit('');
            }
        }
 
        // ==================== JADWAL ====================
        function navJadwal(dir) { state.jadwalOffset += dir; renderJadwal(); }
 
        async function renderJadwal() {
            if (!state.user || !state.user.id) { showToast('Login dulu!', 'error'); return; }
            try {
                const now = new Date(); now.setDate(now.getDate() + state.jadwalOffset * 7);
                const res = await apiCall('getJadwalMingguan', { idKaryawan: state.user.id, tanggalReferensi: now.toISOString() });
                if (res.success) {
                    const container = document.getElementById('jadwalContainer');
                    
                    // Mendapatkan index hari ini (Senin = 0, ..., Minggu = 6)
                    const todayIndex = (new Date().getDay() + 6) % 7;
                    
                    container.innerHTML = res.minggu.map((j, index) => {
                        const jm = formatTimeFromResponse(j.jamMasuk);
                        const jp = formatTimeFromResponse(j.jamPulang);
                        
                        const isLibur = j.libur || j.toko === '—' || j.toko === '-';
                        let isToday = false;
                        let isPassed = false;
                        
                        if (state.jadwalOffset < 0) {
                            isPassed = true;
                        } else if (state.jadwalOffset === 0) {
                            if (index < todayIndex) isPassed = true;
                            else if (index === todayIndex) isToday = true;
                        }
                        
                        let cardStyle = '';
                        let todayBadge = '';
                        let statusBadge = '';
                        
                        if (isToday) {
                            cardStyle = `background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border: 2.5px solid #10B981; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.18); transform: scale(1.01);`;
                            todayBadge = `<span style="background: #10B981; color: white; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-left: 8px; box-shadow: 0 2px 6px rgba(16,185,129,0.2);">Hari Ini</span>`;
                        } else if (isPassed) {
                            cardStyle = `background: #F8FAFC; border: 1.5px solid #E2E8F0; opacity: 0.45; filter: grayscale(10%);`;
                        } else {
                            cardStyle = `background: white; border: 1.5px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.015);`;
                        }
                        
                        if (isLibur) {
                            statusBadge = `<span class="badge" style="background: #FEE2E2; color: #EF4444; border: 1px solid #FECACA; font-weight: 800; font-size: 11px; padding: 6px 12px; border-radius: 12px;">LIBUR</span>`;
                        } else {
                            statusBadge = `<span class="badge badge-green" style="font-weight: 800; font-size: 11px; padding: 6px 12px; border-radius: 12px;">${j.shift}</span>`;
                        }
                        
                        const tglSplit = j.tanggal.split(' ');
                        const tglHari = tglSplit[0] || '';
                        const tglBulan = tglSplit[1] || '';
                        
                        return `
<div class="jadwal-card" style="border-radius: 20px; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; transition: all 0.25s ease; ${cardStyle}">
    <div style="display: flex; align-items: center; gap: 14px;">
        <div style="text-align: center; min-width: 55px; padding-right: 12px; border-right: 2px solid ${isToday ? '#10B981' : isPassed ? '#CBD5E1' : '#0D8ABC'};">
            <div style="font-size: 10px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.3px;">${j.namaHari}</div>
            <div style="font-size: 20px; font-weight: 900; color: #1E293B; margin-top: 1px; line-height: 1.1;">${tglHari}</div>
            <div style="font-size: 9px; font-weight: 800; color: #94A3B8; text-transform: uppercase;">${tglBulan}</div>
        </div>
        <div style="text-align: left;">
            <div style="display: flex; align-items: center; flex-wrap: wrap;">
                <h4 style="font-size: 15px; font-weight: 800; color: #1E293B; margin: 0; line-height: 1.2;">${isLibur ? 'Hari Libur / Off' : j.toko}</h4>
                ${todayBadge}
            </div>
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 5px; font-size: 12px; font-weight: 700; color: #64748B;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity: 0.85;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>${isLibur ? '—' : jm + ' - ' + jp}</span>
            </div>
        </div>
    </div>
    <div style="display: flex; align-items: center; gap: 10px;">
        ${statusBadge}
    </div>
</div>
`;
                    }).join('');
                    
                    const senin = new Date(now); senin.setDate(now.getDate() - now.getDay() + 1);
                    const minggu = new Date(senin); minggu.setDate(senin.getDate() + 6);
                    document.getElementById('jadwalPeriode').textContent = senin.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' - ' + minggu.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                }
            } catch (e) { console.log('renderJadwal error:', e); }
        }

        // ==================== RAPORT ====================
        window.viewPhoto = function(url) {
            const lightbox = document.getElementById('lightboxModal');
            const img = document.getElementById('lightboxImg');
            if (lightbox && img) {
                img.src = url;
                lightbox.classList.add('active');
            }
        };

        window.closeLightbox = function() {
            const lightbox = document.getElementById('lightboxModal');
            if (lightbox) {
                lightbox.classList.remove('active');
            }
        };

        async function renderRaport() {
            if (!state.user || !state.user.id) { showToast('Login dulu!', 'error'); return; }
            
            function isSameDay(dateStr1, dateStr2) {
                if (!dateStr1 || !dateStr2) return false;
                const clean1 = String(dateStr1).trim().split(' ')[0].replace(/\//g, '-');
                const clean2 = String(dateStr2).trim().split(' ')[0].replace(/\//g, '-');
                if (clean1 === clean2) return true;
                try {
                    const parts1 = clean1.split('-');
                    const parts2 = clean2.split('-');
                    if (parts1.length === 3 && parts2.length === 3) {
                        let d1 = parseInt(parts1[0], 10), m1 = parseInt(parts1[1], 10), y1 = parseInt(parts1[2], 10);
                        let d2 = parseInt(parts2[0], 10), m2 = parseInt(parts2[1], 10), y2 = parseInt(parts2[2], 10);
                        if (parts1[0].length === 4) {
                            y1 = parseInt(parts1[0], 10);
                            m1 = parseInt(parts1[1], 10);
                            d1 = parseInt(parts1[2], 10);
                        }
                        if (parts2[0].length === 4) {
                            y2 = parseInt(parts2[0], 10);
                            m2 = parseInt(parts2[1], 10);
                            d2 = parseInt(parts2[2], 10);
                        }
                        return y1 === y2 && m1 === m2 && d1 === d2;
                    }
                } catch (e) {}
                return false;
            }

            function formatIndonesianDateLabel(dateObj) {
                const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                const dayName = days[dateObj.getDay()];
                const dd = String(dateObj.getDate()).padStart(2, '0');
                const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                const yyyy = dateObj.getFullYear();
                return `${dayName}, ${dd}/${mm}/${yyyy}`;
            }

            try {
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth();
                const todayDate = now.getDate();
                
                const res = await apiCall('getRaportBulanan', { idKaryawan: state.user.id, bulan: currentMonth + 1, tahun: currentYear });
                if (res.success) {
                    document.getElementById('raportHadir').textContent = res.totalHadir;
                    document.getElementById('raportTelat').textContent = res.totalTelat;
                    
                    // Generate list of dates from 1st of current month up to today
                    const datesList = [];
                    for (let d = 1; d <= todayDate; d++) {
                        const dateObj = new Date(currentYear, currentMonth, d);
                        const yyyy = dateObj.getFullYear();
                        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const dd = String(dateObj.getDate()).padStart(2, '0');
                        const dateStr = `${yyyy}-${mm}-${dd}`;
                        datesList.push({
                            dateStr: dateStr,
                            dateObj: dateObj
                        });
                    }
                    // Sort descending (latest/newest dates first)
                    datesList.sort((a, b) => b.dateObj - a.dateObj);
                    
                    const tbody = document.getElementById('raportTbody');
                    tbody.innerHTML = datesList.map(item => {
                        const dateStr = item.dateStr;
                        const dateObj = item.dateObj;
                        const displayDateLabel = formatIndonesianDateLabel(dateObj);
                        
                        // 1. Check if attended (check-in data exists)
                        const d = (res.detailHarian || []).find(x => isSameDay(x.tanggal, dateStr));
                        if (d) {
                            const hasLembur = d.durasiLembur && d.durasiLembur !== '' && d.durasiLembur !== '-';
                            const lemburBadge = hasLembur ? `<span class="badge-lembur-tag">🔥 Lembur</span>` : '';
                            const swapBadge = d.isSwap ? `<span class="badge-swap-tag" title="${d.swapDetail || 'Tukar Shift'}">⇆ Tukar Shift</span>` : '';
                            
                            const resolvedFotoMasuk = resolveFotoUrl(d.fotoMasuk);
                            const resolvedFotoPulang = resolveFotoUrl(d.fotoPulang);
                            
                            const fotoMasukHtml = resolvedFotoMasuk 
                                ? `<div class="photo-circle-wrapper" onclick="viewPhoto('${resolvedFotoMasuk}')"><img src="${resolvedFotoMasuk}" alt="Check In"></div>`
                                : `<div class="photo-circle-wrapper"><div class="photo-placeholder">👤</div></div>`;
                                
                            const fotoPulangHtml = resolvedFotoPulang
                                ? `<div class="photo-circle-wrapper" onclick="viewPhoto('${resolvedFotoPulang}')"><img src="${resolvedFotoPulang}" alt="Check Out"></div>`
                                : `<div class="photo-circle-wrapper"><div class="photo-placeholder">👤</div></div>`;
                                
                            return `
                                <div class="raport-card animate-fade-in">
                                    <div class="raport-card-header">
                                        <div class="raport-card-date">${displayDateLabel}</div>
                                        <div class="flex items-center gap-2">
                                            ${swapBadge}
                                            ${lemburBadge}
                                            ${d.status === 'Ontime' 
                                                ? '<span class="raport-card-badge badge-ontime">✅ Ontime</span>' 
                                                : '<span class="raport-card-badge badge-telat">⏳ Telat ' + (d.menitTelat || 0) + 'm</span>'}
                                        </div>
                                    </div>
                                    <div class="raport-card-meta">
                                        <span class="raport-meta-item store">📍 ${d.toko || 'Toko Default'}</span>
                                        <span class="raport-meta-item">⏱️ ${d.shift || 'Shift'}</span>
                                    </div>
                                    <div class="raport-photos-grid">
                                        <div class="photo-column">
                                            ${fotoMasukHtml}
                                            <div class="photo-info">
                                                <span class="photo-label">Check In</span>
                                                <span class="photo-time">${d.jamMasuk || '-'}</span>
                                            </div>
                                        </div>
                                        <div class="photo-column">
                                            ${fotoPulangHtml}
                                            <div class="photo-info">
                                                <span class="photo-label">Check Out</span>
                                                <span class="photo-time">${d.jamPulang || '-'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="raport-durasi-section">
                                        <div class="durasi-item">
                                            <span>Durasi Kerja:</span>
                                            <span class="durasi-value">${d.jamKerja || '-'}</span>
                                        </div>
                                        ${hasLembur ? `
                                        <div class="durasi-item">
                                            <span>Durasi Lembur:</span>
                                            <span class="durasi-value" style="color:#2E7D32;">${d.durasiLembur}</span>
                                        </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        }
                        
                        // 2. Check if Sunday (Libur Toko)
                        const isSunday = dateObj.getDay() === 0;
                        if (isSunday) {
                            return `
                                <div class="raport-card raport-card-libur animate-fade-in">
                                    <div class="raport-card-header" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;">
                                        <div class="raport-card-date" style="color: #64748b;">${displayDateLabel}</div>
                                        <span class="raport-card-badge badge-libur-status">😴 Libur Toko</span>
                                    </div>
                                </div>
                            `;
                        }
                        
                        // 3. Check if approved Izin / Sakit / Cuti
                        const leave = (res.izinCuti || []).find(i => dateStr >= i.tanggalMulai && dateStr <= i.tanggalSelesai);
                        if (leave) {
                            const leaveType = String(leave.tipe).toLowerCase();
                            let leaveClass = 'type-izin';
                            let leaveBadgeIcon = '📝';
                            if (leaveType.includes('sakit')) {
                                leaveClass = 'type-sakit';
                                leaveBadgeIcon = '🤒';
                            } else if (leaveType.includes('cuti')) {
                                leaveClass = 'type-cuti';
                                leaveBadgeIcon = '✈️';
                            }
                            
                            const resolvedLampiran = leave.lampiranUrl ? resolveFotoUrl(leave.lampiranUrl) : '';
                            
                            return `
                                <div class="raport-card raport-card-izin ${leaveClass} animate-fade-in">
                                    <div class="raport-card-header">
                                        <div class="raport-card-date">${displayDateLabel}</div>
                                        <span class="raport-card-badge badge-izin-status">${leaveBadgeIcon} ${leave.tipe}</span>
                                    </div>
                                    <div class="raport-izin-body" style="display: flex; gap: 12px; align-items: center; margin-top: 8px;">
                                        <div class="raport-izin-reason-section" style="flex: 1; margin-top: 0;">
                                            <div class="izin-reason-title">Keperluan / Keterangan</div>
                                            <div class="izin-reason-value">"${leave.alasan || 'Disetujui Admin'}"</div>
                                        </div>
                                        ${resolvedLampiran ? `
                                        <div class="photo-column" style="flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 4px;">
                                            <div class="photo-circle-wrapper" onclick="viewPhoto('${resolvedLampiran}')" style="width: 50px; height: 50px; border-color: #cbd5e1; cursor: pointer; border-radius: 50%; overflow: hidden; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                                <img src="${resolvedLampiran}" alt="Lampiran" style="width: 100%; height: 100%; object-fit: cover;">
                                            </div>
                                            <span style="font-size: 8px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px;">Lampiran</span>
                                        </div>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
                        }
                        
                        // 4. Check if today but haven't clocked in yet
                        const isToday = dateObj.getDate() === now.getDate() && dateObj.getMonth() === now.getMonth() && dateObj.getFullYear() === now.getFullYear();
                        if (isToday) {
                            return `
                                <div class="raport-card raport-card-belum-absen animate-fade-in">
                                    <div class="raport-card-header" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;">
                                        <div class="raport-card-date" style="color: #854d0e;">${displayDateLabel}</div>
                                        <span class="raport-card-badge badge-belum-status">⏳ Belum Absen</span>
                                    </div>
                                </div>
                            `;
                        }
                        
                        // 5. Otherwise, marked as Alpa (Absent without reason)
                        return `
                            <div class="raport-card raport-card-alpa animate-fade-in">
                                <div class="raport-card-header" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;">
                                    <div class="raport-card-date" style="color: #c53030;">${displayDateLabel}</div>
                                    <span class="raport-card-badge badge-alpa-status">🚨 Alpa</span>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            } catch (e) { console.log('renderRaport error:', e); }
        }

        // ==================== NOTIFIKASI ====================
        async function checkMyApprovals() {
            if (!state.user || !state.user.id) return;
            try {
                const res = await apiCall('getMyApprovals', { idKaryawan: state.user.id });
                if (res.success && Array.isArray(res.data)) {
                    state.notifList = res.data;
                    updateNotifBadge(); updateNotifBubble();
                    const unread = res.data.filter(n => n.status !== 'Pending');
                    if (unread.length > 0 && !state.notifShown) {
                        const latest = unread[0];
                        showToast(`Pengajuan ${latest.tipe} Anda ${latest.status === 'Approved' ? 'disetujui' : 'ditolak'}!`, latest.status === 'Approved' ? 'success' : 'error');
                        state.notifShown = true;
                    }
                }
            } catch (e) { console.log('checkMyApprovals error:', e); }
            
            // Periksa juga live Swap Shift request yang masuk!
            try {
                await checkPendingTukerShift();
            } catch (e) { console.log('checkPendingTukerShift trigger error:', e); }
        }

        function formatDateIndo(dateStr) {
            if (!dateStr) return '-';
            try {
                const date = new Date(dateStr);
                const options = { day: 'numeric', month: 'long', year: 'numeric' };
                return date.toLocaleDateString('id-ID', options);
            } catch (e) {
                return dateStr;
            }
        }

        async function checkPendingTukerShift() {
            if (!state.user || !state.user.id) return;
            try {
                // Jangan tampilkan jika modal persetujuan sedang terbuka agar tidak mengganggu input
                const modal = document.getElementById('modalPersetujuanTukerShift');
                if (modal && modal.classList.contains('active')) return;

                // Load karyawanList jika belum terisi agar bisa mendeteksi foto profil pengaju
                if (!state.karyawanList || state.karyawanList.length === 0) {
                    try {
                        const kRes = await apiCall('getKaryawanList');
                        if (kRes.success && Array.isArray(kRes.data)) {
                            state.karyawanList = kRes.data.filter(k => k.Status === 'Aktif');
                        }
                    } catch(e) { console.error('Gagal memuat rekan untuk pencarian foto:', e); }
                }

                const res = await apiCall('getPendingTukerShift', { idKaryawan: state.user.id });
                if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                    const item = res.data[0]; // Ambil yang paling lama pending/pertama
                    
                    // Populate modal elements
                    document.getElementById('persetujuanIdTuker').value = item.id;
                    document.getElementById('persetujuanNama').innerText = item.namaSaya;
                    document.getElementById('persetujuanRole').innerText = item.jabatanSaya;
                    document.getElementById('persetujuanTanggal').innerText = formatDateIndo(item.tanggal);
                    
                    document.getElementById('persetujuanJadwalSaya').innerText = item.namaTokoSaya;
                    document.getElementById('persetujuanJamSaya').innerText = item.namaShiftSaya + ` (${item.jamMasukSaya} - ${item.jamPulangSaya})`;
                    
                    document.getElementById('persetujuanJadwalTujuan').innerText = item.namaTokoTujuan;
                    document.getElementById('persetujuanJamTujuan').innerText = item.namaShiftTujuan + ` (${item.jamMasukTujuan} - ${item.jamPulangTujuan})`;
                    
                    const avatarText = document.getElementById('persetujuanAvatarText');
                    const avatarImg = document.getElementById('persetujuanAvatarImg');
                    
                    // 1. Coba ambil foto dari item respon
                    let resolvedFoto = resolveFotoUrl(item.fotoSaya);
                    
                    // 2. Jika kosong, cari berdasarkan nama pengaju di karyawanList secara real-time
                    if (!resolvedFoto && state.karyawanList && state.karyawanList.length > 0) {
                        const pengaju = state.karyawanList.find(k => k.Nama && item.namaSaya && k.Nama.trim().toLowerCase() === item.namaSaya.trim().toLowerCase());
                        if (pengaju) {
                            const rawFoto = pengaju.Foto_URL || pengaju.Foto_Profil || pengaju.fotoUrl || '';
                            resolvedFoto = resolveFotoUrl(rawFoto);
                        }
                    }
                    
                    if (resolvedFoto) {
                        avatarImg.src = resolvedFoto;
                        avatarImg.style.display = 'block';
                        avatarText.style.display = 'none';
                    } else {
                        avatarImg.style.display = 'none';
                        avatarText.style.display = 'block';
                        avatarText.innerText = item.namaSaya ? item.namaSaya.charAt(0).toUpperCase() : '?';
                    }
                    
                    // Open Modal!
                    openModal('modalPersetujuanTukerShift');
                    playSound('pop');
                }
            } catch (e) {
                console.log('checkPendingTukerShift error:', e);
            }
        }

        async function responTukerShift(isApproved) {
            const idTuker = document.getElementById('persetujuanIdTuker').value;
            if (!idTuker) return;
            
            const action = isApproved ? 'approveTukerShift' : 'rejectTukerShift';
            
            try {
                showToast('Mengirim keputusan...', 'info');
                const res = await apiCall(action, { idTuker: idTuker, idKaryawan: state.user.id });
                if (res.success) {
                    closeModal('modalPersetujuanTukerShift');
                    tampilPicoModal('sukses', isApproved ? '<b>Pertukaran Shift Disetujui! ⇆</b><br>Sukses menyetujui ajukan pertukaran shift. Jadwal Anda berdua telah otomatis disesuaikan!' : '<b>Pertukaran Shift Ditolak</b><br>Pertukaran shift berhasil ditolak.');
                    playSound(isApproved ? 'success' : 'alert');
                    
                    // Refresh data dashboard / jadwal
                    if (typeof checkAbsenStatus === 'function') checkAbsenStatus();
                    if (typeof updateMonthlyRecap === 'function') updateMonthlyRecap();
                } else {
                    showToast(res.error || 'Gagal memproses keputusan', 'error');
                }
            } catch (e) {
                showToast('Koneksi backend gagal', 'error');
            }
        }

        function getReadNotificationIds() {
            try {
                const data = localStorage.getItem('read_notif_ids');
                return data ? JSON.parse(data) : [];
            } catch (e) { return []; }
        }

        function markNotificationsAsRead(ids) {
            try {
                const readIds = getReadNotificationIds();
                const updated = Array.from(new Set([...readIds, ...ids]));
                localStorage.setItem('read_notif_ids', JSON.stringify(updated));
            } catch (e) {}
        }

        function updateNotifBadge() {
            const badge = document.getElementById('notifBadge');
            const readIds = getReadNotificationIds();
            const unreadNotifs = state.notifList ? state.notifList.filter(n => n.status !== 'Pending' && !readIds.includes(String(n.id))) : [];
            const count = unreadNotifs.length;
            if (count > 0) { badge.textContent = count > 9 ? '9+' : count; badge.classList.remove('hidden'); }
            else { badge.classList.add('hidden'); }
        }

        function updateNotifBubble() {
            const list = document.getElementById('notifBubbleList');
            const readIds = getReadNotificationIds();
            
            // FILTER HANYA YANG BELUM DIBACA! Jika sudah dibaca (ID ada di readIds), tidak ditampilkan di gelembung!
            const unreadNotifs = state.notifList ? state.notifList.filter(n => n.status !== 'Pending' && !readIds.includes(String(n.id))) : [];
            
            if (unreadNotifs.length === 0) { 
                list.innerHTML = '<div class="notif-empty">Belum ada pemberitahuan</div>'; 
                return; 
            }
            
            list.innerHTML = unreadNotifs.map(n => {
                let tipeLabel = 'Izin/Cuti';
                let textLabel = `Pengajuan tanggal ${n.tanggal} telah <strong>${n.status === 'Approved' ? 'disetujui' : n.status === 'Rejected' ? 'ditolak' : 'diproses'}</strong>`;
                
                if (n.tipe === 'lembur') {
                    tipeLabel = 'Lembur';
                } else if (n.tipe === 'tuker_shift') {
                    tipeLabel = 'Tukar Shift ⇆';
                    textLabel = `Permintaan tukar shift tanggal ${formatDateIndo(n.tanggal)} telah <strong>${n.status === 'Approved' ? 'disetujui' : 'ditolak'}</strong>`;
                }
                
                return `
    <div class="notif-item ${n.status === 'Approved' ? 'approved' : n.status === 'Rejected' ? 'rejected' : ''} unread-glowing" onclick="showNotifDetail('${n.id}', '${n.tipe}', '${n.status}', '${n.tanggal}', '${n.approvedAt || ''}')">
      <div class="notif-item-title">${tipeLabel} <span class="unread-dot">●</span></div>
      <div class="notif-item-text">${textLabel}</div>
      <div class="notif-item-date">${n.approvedAt || n.tanggal}</div>
    </div>
  `;
            }).join('');
        }

        function showNotifDetail(id, tipe, status, tanggal, approvedAt) {
            closeNotifBubble({ stopPropagation: () => {} }); // Tutup gelembung lonceng agar tidak bertumpuk
            
            let tipePico = 'sukses';
            let title = '';
            let detail = '';
            
            if (tipe === 'lembur') {
                if (status === 'Approved') {
                    tipePico = 'sukses';
                    title = 'Lembur Disetujui! 🎉🔥';
                    detail = `Pengajuan lembur Anda pada tanggal <b>${tanggal}</b> telah disetujui oleh Bos!<br><br>` +
                             `PICO sangat bangga padamu! Tetap jaga kesehatan saat lembur ya. Semangat kerja keras bagai api berkobar! 💪🐧`;
                } else if (status === 'Rejected') {
                    tipePico = 'error';
                    title = 'Lembur Belum Disetujui 💔';
                    detail = `Pengajuan lembur Anda pada tanggal <b>${tanggal}</b> belum disetujui oleh Bos.<br><br>` +
                             `Jangan berkecil hati ya! Tetap semangat bekerja jujur, Pico selalu mendukungmu di setiap langkah! 🐧✨`;
                } else {
                    tipePico = 'lembur_pending';
                    title = 'Lembur Sedang Diproses ⏳';
                    detail = `Pengajuan lembur Anda pada tanggal <b>${tanggal}</b> sedang menunggu persetujuan.<br><br>` +
                             `Pico sedang memantau persetujuan dari Bos untukmu. Sabar menunggu ya! 🐧🔍`;
                }
            } else if (tipe === 'tuker_shift') {
                if (status === 'Approved') {
                    tipePico = 'sukses';
                    title = 'Tukar Shift Disetujui! ⇆🎉';
                    detail = `Permintaan tukar shift Anda pada tanggal <b>${formatDateIndo(tanggal)}</b> telah disetujui oleh rekan kerja Anda!<br><br>` +
                             `PICO ikut senang! Jadwal kerja Anda berdua telah berhasil disesuaikan di database. Jangan lupa datang tepat waktu sesuai shift baru ya! 🐧💚`;
                } else if (status === 'Rejected') {
                    tipePico = 'error';
                    title = 'Tukar Shift Ditolak ❌';
                    detail = `Permintaan tukar shift Anda pada tanggal <b>${formatDateIndo(tanggal)}</b> ditolak oleh rekan kerja Anda.<br><br>` +
                             `Jangan patah semangat ya! Mungkin rekan kerja Anda sedang ada keperluan mendesak di hari tersebut. Tetap kompak bekerja sama! 🙏🐧`;
                }
            } else {
                // Izin / Cuti
                if (status === 'Approved') {
                    tipePico = 'izin_cuti';
                    title = 'Izin/Cuti Disetujui! 🌴🏖️';
                    detail = `Pengajuan izin/cuti Anda pada tanggal <b>${tanggal}</b> telah disetujui Admin.<br><br>` +
                             `Hore! Selamat beristirahat, luangkan waktu dengan keluarga, atau pulihkan kesehatanmu ya. Pico mendoakan yang terbaik! 🐧💚`;
                } else if (status === 'Rejected') {
                    tipePico = 'error';
                    title = 'Izin/Cuti Ditolak ❌';
                    detail = `Pengajuan izin/cuti Anda pada tanggal <b>${tanggal}</b> ditolak oleh Admin.<br><br>` +
                             `Silakan konfirmasi langsung ke bagian Admin/HRD untuk penjelasan lebih lanjut ya. Tetap semangat! 🙏🐧`;
                } else {
                    tipePico = 'izin_sakit';
                    title = 'Izin Sedang Diproses ⏳';
                    detail = `Pengajuan izin/cuti Anda pada tanggal <b>${tanggal}</b> sedang diproses oleh Admin.<br><br>` +
                             `Tunggu sebentar ya, Pico akan segera memberi tahu Anda jika statusnya sudah diperbarui! 🐧⏱️`;
                }
            }
            
            const pesanHtml = `<div style="text-align:center;">` +
                              `<h3 style="margin-top:0;color:${tipePico === 'error' ? '#C62828' : '#0D8ABC'};font-size:18px;font-weight:800;">${title}</h3>` +
                              `<p style="font-size:14px;line-height:1.5;color:#475569;margin-top:10px;">${detail}</p>` +
                              `</div>`;
                              
            // Tandai notifikasi spesifik ini saja sebagai sudah dibaca
            markNotificationsAsRead([String(id)]);
            
            // Tampilkan modal dan kirimkan callback untuk membersihkannya dari gelembung ketika ditutup
            tampilPicoModal(tipePico, pesanHtml, function() {
                updateNotifBadge(); // Perbarui lencana lonceng (jumlah berkurang)
                updateNotifBubble(); // Bersihkan pesan ini dari daftar gelembung lonceng!
            });
        }

        function toggleNotifBubble(e) { 
            e.stopPropagation(); 
            const bubble = document.getElementById('notifBubble');
            bubble.classList.toggle('show');
            // Catatan: Kami tidak lagi menandai semua sebagai dibaca secara otomatis di sini.
            // Notifikasi baru akan tetap menyala dan terlihat sampai karyawan mengklik dan melihat detailnya!
        }
        function closeNotifBubble(e) { if (e && e.stopPropagation) e.stopPropagation(); document.getElementById('notifBubble').classList.remove('show'); }
        document.addEventListener('click', function (e) {
            const bubble = document.getElementById('notifBubble');
            const bell = document.getElementById('notifBell');
            if (bubble && bell && !bubble.contains(e.target) && !bell.contains(e.target)) bubble.classList.remove('show');
            // Close chat attachment menu when clicking outside
            const attachMenu = document.getElementById('chatAttachMenu');
            const attachBtn = e.target.closest('button[onclick*="toggleChatAttachMenu"]');
            if (attachMenu && attachMenu.style.display === 'block' && !attachMenu.contains(e.target) && !attachBtn) {
                attachMenu.style.display = 'none';
            }
        });

        // ==================== MODAL UTILS ====================
        function openModal(id) {
            if (id === 'modalLembur') {
                if (state.lemburStatus === 'Pending') {
                    tampilPicoModal('lembur_pending', '<b>Lembur Menunggu Approval ⏳</b><br>Pengajuan lembur Anda hari ini sedang diproses. Sabar ya, Pico sedang memantau persetujuan dari Bos! 🐧');
                    return;
                } else if (state.lemburStatus === 'Approved') {
                    tampilPicoModal('sukses', '<b>Lembur Telah Disetujui! 🔥</b><br>Selamat! Pengajuan lembur Anda hari ini telah disetujui Bos. Selamat bekerja lembur, tetap semangat & jaga kesehatan! 💪🔥');
                    return;
                }
            }
            document.getElementById(id).classList.add('active');
            document.body.style.overflow = 'hidden';
            if (id === 'modalJadwal') renderJadwal();
            if (id === 'modalChat') { 
                loadCachedChatMessages();
                state.chatLastReadId = localStorage.getItem('chatLastReadId') || '';
                state.hasShownNewMessagesDivider = false;
                renderChat(true);

                loadChatMessages(); 
                startChatPolling(); 
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                const labelAbsensi = document.getElementById('labelAbsensi');
                if (labelAbsensi) labelAbsensi.style.color = 'var(--text-secondary)';
                const navChat = document.getElementById('navChat');
                if (navChat) navChat.classList.add('active');
                
                // Force load karyawanList if empty to enable tag mentions and autocompletion
                if (!state.karyawanList || state.karyawanList.length === 0) {
                    apiCall('getKaryawanList').then(res => {
                        if (res.success && Array.isArray(res.data)) {
                            state.karyawanList = res.data.filter(k => k.Status === 'Aktif');
                        }
                    }).catch(() => {});
                }
            }
            if (id === 'modalTukerShift') populateTukerShiftModal();
            if (id === 'modalTugas') renderTugasList();
            if (id === 'modalBerita') renderBeritaList();
            if (id === 'modalIzin') {
                loadDynamicJenisIzin();
            }
        }
        function closeModal(id) {
            document.getElementById(id).classList.remove('active');
            document.body.style.overflow = '';
            if (id === 'modalChat') {
                stopChatPolling();
                const navChat = document.getElementById('navChat');
                if (navChat) navChat.classList.remove('active');
                
                // Restore previous active tab state
                const tabAbsensi = document.getElementById('tabAbsensi');
                const labelAbsensi = document.getElementById('labelAbsensi');
                if (tabAbsensi && tabAbsensi.classList.contains('active')) {
                    if (labelAbsensi) labelAbsensi.style.color = 'var(--primary)';
                } else {
                    const navBeranda = document.getElementById('navBeranda');
                    if (navBeranda) navBeranda.classList.add('active');
                }
            }
            if (id === 'modalIzin') {
                const fileInput = document.getElementById('izinLampiran');
                if (fileInput) {
                    fileInput.value = '';
                    updateFileName(fileInput);
                }
            }
            if (id === 'modalLembur') {
                resetLemburFoto();
                const typeSelect = document.getElementById('lemburKeteranganType');
                if (typeSelect) {
                    typeSelect.value = 'Event / Promo';
                    toggleLemburKeterangan();
                }
                const manualText = document.getElementById('lemburKeteranganManual');
                if (manualText) manualText.value = '';
            }
        }
        
        function updateChatBadgeState(show) {
            const badge = document.getElementById('badgeChat');
            const badgeBottom = document.getElementById('badgeChatBottom');
            if (show) {
                if (badge) {
                    badge.textContent = '';
                    badge.classList.remove('hidden');
                }
                if (badgeBottom) {
                    badgeBottom.classList.remove('hidden');
                }
            } else {
                if (badge) badge.classList.add('hidden');
                if (badgeBottom) badgeBottom.classList.add('hidden');
            }
        }

        function updateFileName(input) {
            const label = document.getElementById('izinLampiranLabel');
            const previewContainer = document.getElementById('izinLampiranPreviewContainer');
            const previewImg = document.getElementById('izinLampiranPreview');
            
            if (!label) return;
            
            if (input.files && input.files[0]) {
                const file = input.files[0];
                label.textContent = file.name;
                label.parentElement.style.borderColor = 'var(--primary)';
                label.parentElement.style.color = 'var(--primary)';
                
                // Tampilkan preview jika berupa gambar
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        if (previewImg) previewImg.src = e.target.result;
                        if (previewContainer) previewContainer.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                } else if (file.type === 'application/pdf') {
                    // Tampilkan ikon placeholder PDF
                    if (previewImg) previewImg.src = 'https://cdn-icons-png.flaticon.com/512/337/337946.png';
                    if (previewContainer) previewContainer.style.display = 'block';
                } else {
                    if (previewContainer) previewContainer.style.display = 'none';
                }
            } else {
                label.textContent = 'Pilih file surat dokter / bukti foto';
                label.parentElement.style.borderColor = '#CBD5E1';
                label.parentElement.style.color = '#64748B';
                if (previewContainer) previewContainer.style.display = 'none';
                if (previewImg) previewImg.src = '';
            }
        }

        function resetIzinLampiran(e) {
            if (e) e.stopPropagation();
            const fileInput = document.getElementById('izinLampiran');
            if (fileInput) {
                fileInput.value = '';
                updateFileName(fileInput);
            }
        }
        function closeModalOnOverlay(e, id) { if (e.target.id === id) closeModal(id); }

        function showToast(msg, type = 'info') {
            const toast = document.getElementById('toast');
            toast.textContent = msg; toast.className = `toast toast-${type} show`;
            setTimeout(() => toast.classList.remove('show'), 4000);
        }

        // ==================== PICO ====================
        function tampilPicoModal(tipe, pesan, callback = null, showCancel = false, cancelCallback = null) {
            const modal = document.getElementById('pico-modal');
            const imgElement = document.getElementById('pico-modal-img');
            const textElement = document.getElementById('pico-modal-text');
            const btnElement = document.getElementById('pico-modal-btn');
            const btnSecondary = document.getElementById('pico-modal-btn-secondary');
            
            // Daftarkan path file gambar Anda di sini (sesuaikan dengan path hosting / folder Anda)
            const pathGambar = "https://lh3.googleusercontent.com/d/"; // Biarkan kosong jika file berada di folder root yang sama
            
            let gambar = "13EQkf3fVMogqbquyalUbg90Aq-9OHGbS"; // Default
            let warnaTombol = "#2ed573";   // Hijau default
            let teksTombol = "Oke, Pico!";

            // Set gambar & style berdasarkan tipe kejadian
            switch (tipe) {
                case 'sukses':
                    gambar = "1Tnf4KogLXDeGaXjzi7nT-6D0XDsLQJtI";
                    warnaTombol = "#2ed573"; // Hijau
                    teksTombol = "Mantap, Pico!";
                    break;
                case 'gps_jauh':
                    gambar = "1t3Ip_ioGD55TEWbkKPgtnYtDciidJuDZ";
                    warnaTombol = "#e74c3c"; // Merah
                    teksTombol = "Saya akan mendekat";
                    break;
                case 'wajah_gagal':
                    gambar = "1znuTlrMgr6b_qpWdrTwdW5FnPsbsd3cE";
                    warnaTombol = "#f39c12"; // Oranye
                    teksTombol = "Coba Foto Lagi 📸";
                    break;
                case 'lembur_pending':
                    gambar = "1q5q5rsFG0ZrhaGJyEulwU8MJjXAtFyKc";
                    warnaTombol = "#3498db"; // Biru
                    teksTombol = "Siap, tunggu Bos!";
                    break;
                case 'izin_sakit':
                    gambar = "1wf65GL6UGY_qDfnGEhSYHxvYL5pRXJwf";
                    warnaTombol = "#9b59b6"; // Ungu
                    teksTombol = "Semoga Cepat Sembuh";
                    break;
                case 'izin_telat':
                    gambar = "115BmzgFQ2uJHXk8khNGAhdYD0tRVrh1h";
                    warnaTombol = "#f1c40f"; // Kuning
                    teksTombol = "Saya Mengerti";
                    break;
                case 'izin_pulang':
                    gambar = "152ZtNSBruDX5KQOpo7fMv7SDws0u1VlF";
                    warnaTombol = "#e67e22"; // Oranye gelap
                    teksTombol = "Hati-hati di jalan";
                    break;
                case 'izin_cuti':
                    gambar = "1Tnxa9YDmJD0N0evyv7RGg9wRERDBm3zJ";
                    warnaTombol = "#1abc9c"; // Toska
                    teksTombol = "Selamat berlibur";
                    break;
                case 'error':
                    gambar = "1Q5WxPZ2uulbNdZsggdCQ2HZhyJiFoJKV";
                    warnaTombol = "#c0392b"; // Merah Tua
                    teksTombol = "Aduh, maaf Pico";
                    break;
            }
            imgElement.src = pathGambar + gambar;
            textElement.innerHTML = pesan;
            btnElement.style.backgroundColor = warnaTombol;
            btnElement.textContent = teksTombol;
            btnElement.onclick = () => { closePicoModal(); if (callback) callback(); };
            
            if (showCancel) {
                btnSecondary.style.display = 'block';
                btnSecondary.onclick = () => {
                    closePicoModal();
                    if (cancelCallback) cancelCallback();
                };
            } else {
                btnSecondary.style.display = 'none';
            }
            
            modal.classList.add('active');
            playSound(tipe === 'sukses' ? 'success' : 'error');
        }
        function closePicoModal() { 
            document.getElementById('pico-modal').classList.remove('active'); 
            const btnSecondary = document.getElementById('pico-modal-btn-secondary');
            if (btnSecondary) btnSecondary.style.display = 'none';
        }

        let stepIndex = 0, typingEffect, isTyping = false, bubbleTimer = null;
        const tutorialSteps = [
            "<b>Semangat Pagi!</b><br>Ayo absen dulu sama PICO biar rezeki makin lancar!",
            "<b>Langkah 1:</b><br>Ambil foto selfie bening, biar PICO gampang ngenalin wajahmu!",
            "<b>Langkah 2:</b><br>Pilih Toko & Shift. Data sudah auto-isi kalau sudah di-setting!",
            "<b>Langkah 3:</b><br>Pastikan GPS nyala & kamu sudah dekat toko ya!",
            "<b>Langkah 4:</b><br>Klik <b>'Mode Lembur'</b> setelah absen masuk untuk ajukan lembur.",
            "<b>Langkah 5:</b><br>Absen Pulang = foto lagi + GPS di lokasi toko.",
            "<b>Gagal Wajah?</b><br>Jangan ketutup masker/topi, cari tempat terang!",
            "<b>Gagal Jarak?</b><br>GPS harus aktif Mode Akurasi Tinggi. Maksimal 50m dari titik toko!",
            "<b>Masalah Jaringan?</b><br>Ganti ke data seluler atau cari sinyal lebih stabil.",
            "<b>Pinguin Cell!</b><br>Kerja jujur itu hebat. Tetap semangat!"
        ];
        const instruksiPencet = [
            "Tekan PICO untuk lanjut...", "Pencet PICO kalau sudah paham...", "Klik PICO lagi...",
            "Ayo tekan PICO...", "Pencet PICO lanjut ke tips...", "Lanjut? Klik PICO...",
            "Cek tips GPS, pencet PICO...", "Pencet PICO lagi ya...", "Hampir selesai, klik PICO...", "Tekan PICO untuk ulangi..."
        ];

        function picoAction() {
            const mascot = document.getElementById('pinguin-mascot');
            mascot.style.transform = 'scale(0.88)'; setTimeout(() => mascot.style.transform = '', 200);
            tampilTutorial();
        }
        function closeBubble(e) {
            if (e) { e.stopPropagation(); e.preventDefault(); }
            const bubble = document.getElementById('chat-bubble');
            if (bubble) {
                bubble.classList.remove('show');
                bubble.style.display = 'none';
            }
            clearTimeout(bubbleTimer);
            isTyping = false;
            clearTimeout(typingEffect);
        }
        function tampilTutorial() {
            if (isTyping) { closeBubble(); setTimeout(() => tampilTutorial(), 300); return; }
            const bubble = document.getElementById('chat-bubble');
            const textContainer = document.getElementById('tutorial-text');
            bubble.style.display = 'block'; bubble.classList.add('show');
            clearTimeout(typingEffect); textContainer.innerHTML = ""; isTyping = true;
            let fullText = tutorialSteps[stepIndex] + `<br><br><span style="font-size:12px;color:var(--text-secondary);font-style:italic;">(${instruksiPencet[stepIndex]})</span>`;
            let charIndex = 0;
            function typeWriter() {
                if (charIndex < fullText.length) {
                    if (fullText.charAt(charIndex) === '<') {
                        let tagEnd = fullText.indexOf('>', charIndex);
                        textContainer.innerHTML += fullText.substring(charIndex, tagEnd + 1); charIndex = tagEnd + 1;
                    } else { textContainer.innerHTML += fullText.charAt(charIndex); charIndex++; }
                    typingEffect = setTimeout(typeWriter, 28);
                } else { isTyping = false; }
            }
            typeWriter();
            stepIndex++; if (stepIndex >= tutorialSteps.length) stepIndex = 0;
            clearTimeout(bubbleTimer); bubbleTimer = setTimeout(() => closeBubble(), 8000);
        }

        // ==================== PERMISSION HELP ====================
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
                { t: 'Pilih <strong>Pengaturan → Privasi dan keamanan → Izin situs</strong>.' },
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
                { t: 'Pilih <strong>Pengaturan → Situs dan unduhan → Izin situs</strong>.' },
                { t: 'Ketuk <strong>Kamera</strong>, cari situs ini, pilih <strong>Izinkan</strong>.' },
                { t: 'Kembali ke halaman ini dan tekan <strong>Coba Nyalakan Kamera</strong>.' }
            ],
            'firefox': [
                { t: 'Ketuk <strong>⋮ (titik tiga)</strong> di pojok kanan atas.' },
                { t: 'Pilih <strong>Pengaturan → Privasi & Keamanan → Izin</strong>.' },
                { t: 'Ketuk <strong>Kamera</strong>, cari situs ini, ubah ke <strong>Izinkan</strong>.' },
                { t: 'Kembali ke halaman ini dan tekan <strong>Coba Nyalakan Kamera</strong>.' }
            ],
            'edge': [
                { t: 'Ketuk <strong>⋯ (titik tiga)</strong> di pojok kanan bawah.' },
                { t: 'Pilih <strong>Pengaturan → Privasi dan keamanan → Izin situs</strong>.' },
                { t: 'Ketuk <strong>Kamera</strong>, cari situs ini, pilih <strong>Izinkan</strong>.' },
                { t: 'Kembali ke halaman ini dan tekan <strong>Coba Nyalakan Kamera</strong>.' }
            ]
        };
        function showPermHelp() {
            const browser = detectBrowser();
            const steps = browserSteps[browser] || browserSteps['chrome-android'];
            document.getElementById('permSteps').innerHTML = steps.map((s, i) => `
    <div class="perm-step"><div class="perm-step-num">${i + 1}</div><div class="perm-step-text">${s.t}</div></div>
  `).join('');
            document.getElementById('permHelpModal').classList.add('active');
        }
        function closePermHelp() { document.getElementById('permHelpModal').classList.remove('active'); }
        function retryCameraAfterHelp() { closePermHelp(); autoStartCamera(); }

        // ==================== TIME FORMATTER ====================
        function formatTimeFromResponse(timeStr) {
            if (!timeStr) return '--:--';

            // If it's already clean HH:mm or HH:mm:ss
            if (typeof timeStr === 'string' && /^\d{2}:\d{2}/.test(timeStr)) {
                return timeStr.substring(0, 5);
            }

            // Handle ISO date strings (like 1899-12-29T23:17:48.000Z)
            if (typeof timeStr === 'string' && (timeStr.includes('1899') || timeStr.includes('1900') || timeStr.includes('T'))) {
                try {
                    const d = new Date(timeStr);
                    if (!isNaN(d.getTime())) {
                        // Use local time methods (getHours/getMinutes) which automatically accounts for local timezone offsets!
                        const h = String(d.getHours()).padStart(2, '0');
                        const m = String(d.getMinutes()).padStart(2, '0');
                        return h + ':' + m;
                    }
                } catch (e) { }
            }

            // Handle numeric serial number from Google Sheets
            if (typeof timeStr === 'number' || (typeof timeStr === 'string' && /^\d+\.?\d*$/.test(timeStr))) {
                const num = parseFloat(timeStr);
                if (!isNaN(num)) {
                    const fraction = num - Math.floor(num);
                    const absFraction = Math.abs(fraction);
                    const totalMinutes = Math.round(absFraction * 24 * 60);
                    const h = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
                    const m = String(totalMinutes % 60).padStart(2, '0');
                    return h + ':' + m;
                }
            }

            // Last resort: try to parse any string containing time pattern
            if (typeof timeStr === 'string') {
                const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
                if (timeMatch) {
                    const h = String(timeMatch[1]).padStart(2, '0');
                    const m = String(timeMatch[2]).padStart(2, '0');
                    return h + ':' + m;
                }
            }

            return '--:--';
        }
        
        // ==================== API ====================
        async function apiCall(action, payload = {}) {
            const maxRetries = 2;
            let lastError;

            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    const body = JSON.stringify({ action, ...payload });
                    console.log(`[API] ${action} sending:`, body.substring(0, 200));

                    const response = await fetch(APPS_SCRIPT_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: body
                    });

                    console.log(`[API] ${action} response status:`, response.status);

                    if (!response.ok) {
                        throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                    }

                    const text = await response.text();
                    console.log(`[API] ${action} raw response:`, text.substring(0, 300));

                    if (!text || !text.trim()) {
                        throw new Error('Response kosong dari server');
                    }

                    // Try to extract JSON from response
                    let data;
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        // Try to find JSON object in text
                        const m = text.match(/\{[\s\S]*\}/);
                        if (m) {
                            try { data = JSON.parse(m[0]); } catch (e2) { throw new Error('Parse error: ' + text.substring(0, 200)); }
                        } else {
                            throw new Error('Invalid response: ' + text.substring(0, 200));
                        }
                    }

                    if (!data || typeof data !== 'object') {
                        throw new Error('Invalid response format');
                    }

                    return data;

                } catch (error) {
                    lastError = error;
                    console.warn(`[API] ${action} attempt ${attempt + 1} failed:`, error.message);
                    if (attempt < maxRetries) {
                        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
                    }
                }
            }

            console.error('[API]', action, 'All retries failed:', lastError);
            throw lastError;
        }

        // ==================== CHAT ====================
        let chatMessages = [];
        let chatAttachment = null; // { type: 'image'|'file', data: base64, name: string }
        let chatCameraStream = null;

        let chatPollTimeout = null;

        // Scientific WhatsApp-style read tracking & red dot badge management
        function checkUnreadChatState() {
            if (!chatMessages || chatMessages.length === 0) {
                updateChatBadgeState(false);
                return;
            }
            const lastReadId = localStorage.getItem('chatLastReadId') || '';
            if (!lastReadId) {
                const hasOthersMsg = chatMessages.some(m => String(m.idKaryawan) !== String(state.user.id));
                updateChatBadgeState(hasOthersMsg);
                return;
            }
            const lastReadIndex = chatMessages.findIndex(m => m.idPesan === lastReadId);
            if (lastReadIndex === -1) {
                // Assume unread if latest message from others is not the lastReadId
                const latestMsg = chatMessages[chatMessages.length - 1];
                const isLatestFromOthers = latestMsg && String(latestMsg.idKaryawan) !== String(state.user.id);
                updateChatBadgeState(isLatestFromOthers);
                return;
            }
            const hasNewOthersMsg = chatMessages.slice(lastReadIndex + 1).some(m => String(m.idKaryawan) !== String(state.user.id));
            updateChatBadgeState(hasNewOthersMsg);
        }

        function initChatScrollListener() {
            const container = document.getElementById('chatMessages');
            if (!container) return;
            
            container.addEventListener('scroll', () => {
                const modal = document.getElementById('modalChat');
                const isModalOpen = modal && modal.classList.contains('active');
                if (!isModalOpen) return;
                
                // If they scroll near the bottom (within 60px of the bottom scroll limit),
                // we consider that they have read/scrolled past all messages!
                const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 60;
                if (isAtBottom && chatMessages.length > 0) {
                    const lastMsg = chatMessages[chatMessages.length - 1];
                    if (lastMsg && lastMsg.idPesan) {
                        const prevLastReadId = localStorage.getItem('chatLastReadId') || '';
                        if (prevLastReadId !== lastMsg.idPesan) {
                            localStorage.setItem('chatLastReadId', lastMsg.idPesan);
                            checkUnreadChatState(); // Instantly hide the red dot badge!
                        }
                    }
                }
            });
        }

        // HIGH COMPRESSION CACHE SYSTEM FOR CHAT (Array-of-Arrays minimizes storage by ~75%)
        function saveChatMessagesToCache(messages) {
            if (!messages || !Array.isArray(messages)) return;
            const listToCache = messages.slice(-150); // Keep last 150 messages
            const compressed = listToCache.map(m => [
                m.idPesan || '',       // 0
                m.idKaryawan || '',    // 1
                m.nama || '',          // 2
                m.waktu || '',         // 3
                m.pesan || '',         // 4
                m.tipe || 'text',      // 5
                m.fileUrl || '',       // 6
                m.namaFile || '',      // 7
                m.status || '',        // 8
                m.tempId || ''         // 9
            ]);
            try {
                localStorage.setItem('chatMessagesCache_v2', JSON.stringify(compressed));
            } catch(e) {
                console.error('[CHAT] Cache save error:', e);
            }
        }

        function loadCachedChatMessages() {
            try {
                const cachedStr = localStorage.getItem('chatMessagesCache_v2');
                if (cachedStr) {
                    const compressed = JSON.parse(cachedStr);
                    if (Array.isArray(compressed)) {
                        chatMessages = compressed.map(arr => ({
                            idPesan: arr[0],
                            idKaryawan: arr[1],
                            nama: arr[2],
                            waktu: arr[3],
                            pesan: arr[4],
                            tipe: arr[5],
                            fileUrl: arr[6],
                            namaFile: arr[7],
                            status: arr[8] || 'sent',
                            tempId: arr[9]
                        }));
                    }
                }
                checkUnreadChatState();
            } catch(e) {
                console.error('[CHAT] Cache load error:', e);
            }
        }

        async function loadChatMessages() {
            if (!state.user || !state.user.id) return;
            try {
                const res = await apiCall('getChatMessages', { limit: 50 });
                if (res.success && Array.isArray(res.data)) {
                    // Simpan ID pesan lama sebelum digabung untuk mendeteksi pesan baru
                    const oldIds = new Set(chatMessages.map(m => m.idPesan).filter(Boolean));

                    // Merge server data with local pending messages
                    const pendingMessages = chatMessages.filter(m => m.status === 'sending' || m.status === 'failed');
                    chatMessages = [...res.data, ...pendingMessages];
                    
                    // Sort by timestamp
                    chatMessages.sort((a, b) => {
                        const ta = safeParseDate(a.waktu) || new Date(0);
                        const tb = safeParseDate(b.waktu) || new Date(0);
                        return ta - tb;
                    });
                    
                    saveChatMessagesToCache(chatMessages);
                    
                    const modal = document.getElementById('modalChat');
                    const isModalOpen = modal && modal.classList.contains('active');
                    
                    if (isModalOpen) {
                        const container = document.getElementById('chatMessages');
                        const isAtBottom = container ? (container.scrollHeight - container.scrollTop - container.clientHeight < 60) : false;
                        if (isAtBottom && chatMessages.length > 0) {
                            const lastMsg = chatMessages[chatMessages.length - 1];
                            if (lastMsg && lastMsg.idPesan) {
                                localStorage.setItem('chatLastReadId', lastMsg.idPesan);
                            }
                        }
                    }
                    
                    renderChat();

                    // Deteksi jika ada pesan baru dari orang lain untuk diputar suaranya & diberi notifikasi
                    let hasNewMsg = false;
                    let latestNewMsg = null;
                    res.data.forEach(m => {
                        if (m.idPesan && !oldIds.has(m.idPesan) && String(m.idKaryawan) !== String(state.user.id)) {
                            hasNewMsg = true;
                            latestNewMsg = m;
                        }
                    });

                    if (hasNewMsg && latestNewMsg) {
                        playSound('pop');
                        if (!isModalOpen) {
                            showToast(`Pesan baru dari ${latestNewMsg.nama}: ${latestNewMsg.pesan.substring(0, 30)}${latestNewMsg.pesan.length > 30 ? '...' : ''}`, 'info');
                        }
                    }

                    checkUnreadChatState();
                } else {
                    renderChatEmpty();
                }
            } catch (e) {
                console.error('[CHAT] Load failed:', e);
                if (chatMessages.length === 0) renderChatEmpty();
            }
        }

        let pusher = null;
        let chatChannel = null;

        function initPusher() {
            try {
                // Pusher client keys (sandbox free tier, active)
                pusher = new Pusher('e912ab0d6c703b0d5c07', {
                    cluster: 'ap1',
                    forceTLS: true
                });

                chatChannel = pusher.subscribe('pinguin-chat');
                
                chatChannel.bind('new-message', function(data) {
                    handleIncomingMessage(data);
                });
                
                chatChannel.bind('swap-shift-alert', function(data) {
                    if (data && String(data.targetId) === String(state.user.id)) {
                        checkPendingTukerShift();
                    }
                });
                
                console.log('[PUSHER] ✅ Connected to real-time WebSocket channel');
            } catch (e) {
                console.error('[PUSHER] ❌ Pusher init failed:', e);
            }
        }

        function handleIncomingMessage(data) {
            if (!state.user || !state.user.id) return;
            
            // Avoid duplicates
            if (String(data.idKaryawan) === String(state.user.id)) {
                const existing = chatMessages.find(m => (data.tempId && m.tempId === data.tempId) || (data.idPesan && String(m.idPesan) === String(data.idPesan)));
                if (existing) {
                    // Update status of our own sending message to sent
                    const idx = chatMessages.findIndex(m => (data.tempId && m.tempId === data.tempId) || (data.idPesan && String(m.idPesan) === String(data.idPesan)));
                    if (idx !== -1) {
                        chatMessages[idx].status = 'sent';
                        if (data.idPesan) chatMessages[idx].idPesan = data.idPesan;
                        chatMessages[idx].waktu = data.waktu || 'Baru saja';
                        renderChat();
                    }
                    return;
                }
            } else {
                // If it's already in the messages, don't re-append
                const existing = chatMessages.find(m => String(m.idPesan) === String(data.idPesan));
                if (existing) return;
            }
            
            const newMsg = {
                idPesan: data.idPesan,
                idKaryawan: data.idKaryawan,
                nama: data.nama,
                pesan: data.pesan,
                tipe: data.tipe || 'text',
                fileUrl: data.fileUrl || '',
                namaFile: data.namaFile || '',
                waktu: data.waktu || 'Baru saja',
                status: 'sent'
            };
            
            chatMessages.push(newMsg);
            
            const modal = document.getElementById('modalChat');
            const isModalOpen = modal && modal.classList.contains('active');
            
            if (isModalOpen) {
                const container = document.getElementById('chatMessages');
                const isAtBottom = container ? (container.scrollHeight - container.scrollTop - container.clientHeight < 60) : false;
                
                renderChat();
                
                if (isAtBottom && container) {
                    container.scrollTop = container.scrollHeight;
                    if (newMsg.idPesan) {
                        localStorage.setItem('chatLastReadId', newMsg.idPesan);
                    }
                }
                
                // Play notification sound for incoming chat
                if (String(data.idKaryawan) !== String(state.user.id)) {
                    if (isCurrentUserTagged(data.pesan)) {
                        playSound('tagalert');
                    } else {
                        playSound('pop');
                    }
                }
            } else {
                renderChat();
                // If modal closed, play sound and display visual toast
                if (String(data.idKaryawan) !== String(state.user.id)) {
                    const isTagged = isCurrentUserTagged(data.pesan);
                    if (isTagged) {
                        showToast(`🔔 Kamu ditag oleh ${data.nama}: "${data.pesan.substring(0, 35)}${data.pesan.length > 35 ? '...' : ''}"`, 'warning');
                        playSound('tagalert');
                    } else {
                        showToast(`Pesan baru dari ${data.nama}: ${data.pesan.substring(0, 35)}${data.pesan.length > 35 ? '...' : ''}`, 'info');
                        playSound('pop');
                    }
                }
            }
            
            checkUnreadChatState();
        }

        function startChatPolling() {
            // POLLING TELAH DIMATIKAN TOTAL UNTUK MENCEGAH GOOGLE BAN/LIMIT!
            // Sistem sekarang menggunakan murni Pusher WebSockets untuk real-time 
            // ditambah Local Cache (Memori HP) untuk mempercepat loading tanpa membebani server.
            if (chatPollTimeout) {
                clearTimeout(chatPollTimeout);
                chatPollTimeout = null;
            }
        }

        function stopChatPolling() {
            if (chatPollTimeout) {
                clearTimeout(chatPollTimeout);
                chatPollTimeout = null;
            }
        }

        function getHashCodeColor(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            const h = Math.abs(hash % 360);
            return `hsl(${h}, 75%, 40%)`;
        }

        function safeParseDate(dateStr) {
            if (!dateStr) return null;
            if (dateStr instanceof Date) return dateStr;
            if (dateStr === 'Mengirim...' || dateStr === 'Terkirim' || dateStr === 'Baru saja') {
                return new Date();
            }
            
            let date = new Date(dateStr);
            if (!isNaN(date.getTime())) return date;
            
            try {
                // Cek format dd/mm/yyyy hh:mm:ss atau dd-mm-yyyy hh:mm:ss
                const cleaned = dateStr.replace(/,/g, '').replace(/\./g, ':').trim();
                const parts = cleaned.split(' ');
                if (parts.length >= 1) {
                    const datePart = parts[0];
                    const timePart = parts[1] || '00:00:00';
                    
                    let day, month, year;
                    if (datePart.includes('/')) {
                        const dParts = datePart.split('/');
                        day = parseInt(dParts[0], 10);
                        month = parseInt(dParts[1], 10) - 1;
                        year = parseInt(dParts[2], 10);
                    } else if (datePart.includes('-')) {
                        const dParts = datePart.split('-');
                        if (dParts[0].length === 4) {
                            year = parseInt(dParts[0], 10);
                            month = parseInt(dParts[1], 10) - 1;
                            day = parseInt(dParts[2], 10);
                        } else {
                            day = parseInt(dParts[0], 10);
                            month = parseInt(dParts[1], 10) - 1;
                            year = parseInt(dParts[2], 10);
                        }
                    }
                    
                    const tParts = timePart.split(':');
                    const hours = parseInt(tParts[0] || 0, 10);
                    const minutes = parseInt(tParts[1] || 0, 10);
                    const seconds = parseInt(tParts[2] || 0, 10);
                    
                    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                        const parsed = new Date(year, month, day, hours, minutes, seconds);
                        if (!isNaN(parsed.getTime())) return parsed;
                    }
                }
            } catch (e) {
                console.warn('[DATE] Failed custom parsing:', dateStr, e);
            }
            
            return null;
        }

        function formatChatTime(dateStr) {
            if (!dateStr || dateStr === 'Mengirim...' || dateStr === 'Terkirim') {
                return dateStr || 'Mengirim...';
            }
            if (dateStr === 'Baru saja') return 'Baru saja';
            
            const date = safeParseDate(dateStr);
            if (!date || isNaN(date.getTime())) {
                return dateStr; // Fallback aman daripada Nan:Nan
            }
            
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;
            
            // 1. Kurang dari 1 menit -> "Baru saja"
            if (diffMins < 1) {
                return 'Baru saja';
            }
            // 2. Kurang dari 60 menit -> "X mnt lalu"
            if (diffMins < 60) {
                return `${diffMins} mnt lalu`;
            }
            
            const todayStr = now.toDateString();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();
            const dateStrDate = date.toDateString();
            
            // 3. Hari ini -> "Hari ini 14:30" (atau "X jam lalu" jika < 6 jam)
            if (dateStrDate === todayStr) {
                if (diffHours < 6) {
                    return `${diffHours} jam lalu`;
                }
                return `Hari ini ${timeStr}`;
            }
            
            // 4. Kemarin -> "Kemarin 14:30"
            if (dateStrDate === yesterdayStr) {
                return `Kemarin ${timeStr}`;
            }
            
            // 5. Tanggal biasa -> "17 Mei, 14:30"
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            return `${date.getDate()} ${months[date.getMonth()]}, ${timeStr}`;
        }

        function renderChatEmpty() {
            const container = document.getElementById('chatMessages');
            container.innerHTML = '<div style="align-self: center; color: #64748b; font-size: 13px; margin-top: 20px; font-weight: 600; background: white; padding: 8px 16px; border-radius: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">Belum ada pesan. Yuk, sapa rekan kerja Anda! 👋</div>';
        }

        function isCurrentUserTagged(messageText) {
            if (!messageText || !state.user || !state.user.name) return false;
            const cleanText = messageText.toLowerCase();
            
            // Match @name (e.g. Budisantoso or Budi)
            const fullNameNoSpaces = state.user.name.replace(/\s+/g, '').toLowerCase();
            if (cleanText.includes('@' + fullNameNoSpaces)) return true;
            
            const nameWords = state.user.name.split(/\s+/).filter(w => w.length > 2);
            for (let word of nameWords) {
                if (cleanText.includes('@' + word.toLowerCase())) return true;
            }
            
            return false;
        }

        window.selectChatMention = function(fullName) {
            const input = document.getElementById('chatInput');
            if (!input) return;
            const text = input.value;
            const caretPos = input.selectionStart;
            
            const textBeforeCaret = text.substring(0, caretPos);
            const textAfterCaret = text.substring(caretPos);
            
            const cleanName = fullName.replace(/\s+/g, '');
            const newTextBefore = textBeforeCaret.replace(/@([a-zA-Z0-9_]*)$/, `@${cleanName} `);
            
            input.value = newTextBefore + textAfterCaret;
            input.focus();
            
            const newCaretPos = newTextBefore.length;
            input.setSelectionRange(newCaretPos, newCaretPos);
            
            const autocomplete = document.getElementById('chatMentionAutocomplete');
            if (autocomplete) autocomplete.style.display = 'none';
        };

        window.selectChatMention = function(fullName) {
            const input = document.getElementById('chatInput');
            if (!input) return;
            const text = input.value;
            const caretPos = input.selectionStart;
            
            const textBeforeCaret = text.substring(0, caretPos);
            const textAfterCaret = text.substring(caretPos);
            
            const cleanName = fullName.replace(/\s+/g, '');
            const newTextBefore = textBeforeCaret.replace(/@([a-zA-Z0-9_]*)$/, `@${cleanName} `);
            
            input.value = newTextBefore + textAfterCaret;
            input.focus();
            
            const newCaretPos = newTextBefore.length;
            input.setSelectionRange(newCaretPos, newCaretPos);
            
            const autocomplete = document.getElementById('chatMentionAutocomplete');
            if (autocomplete) autocomplete.style.display = 'none';
        };

        // REPLY TO MESSAGE GLOBALS & HELPERS
        let chatLongPressTimer = null;
        let isLongPressTriggered = false;
        
        window.startChatLongPress = function(event, id) {
            window.cancelChatLongPress();
            isLongPressTriggered = false;
            
            chatLongPressTimer = setTimeout(() => {
                isLongPressTriggered = true;
                if (navigator.vibrate) navigator.vibrate(50);
                window.setChatReply(id);
            }, 600);
        };
        
        window.cancelChatLongPress = function() {
            if (chatLongPressTimer) {
                clearTimeout(chatLongPressTimer);
                chatLongPressTimer = null;
            }
        };
        
        window.setChatReply = function(id) {
            const m = chatMessages.find(msg => (msg.idPesan === id || msg.tempId === id));
            if (!m) return;
            
            state.replyingTo = {
                idPesan: m.idPesan || m.tempId,
                senderName: m.nama,
                messageText: m.pesan || ''
            };
            
            const senderElement = document.getElementById('chatReplySender');
            const textElement = document.getElementById('chatReplyText');
            const previewElement = document.getElementById('chatReplyPreview');
            
            if (senderElement) senderElement.textContent = m.nama;
            
            let displayVal = m.pesan || '';
            const replyRegex = /^\{\{REPLY:.*?\}\}/;
            displayVal = displayVal.replace(replyRegex, '');
            if (m.tipe === 'image') displayVal = '[Foto]';
            else if (m.tipe === 'file') displayVal = '[Dokumen]';
            
            if (textElement) textElement.textContent = displayVal;
            if (previewElement) previewElement.style.display = 'flex';
            
            const input = document.getElementById('chatInput');
            if (input) input.focus();
        };
        
        window.clearChatReply = function() {
            state.replyingTo = null;
            const previewElement = document.getElementById('chatReplyPreview');
            if (previewElement) previewElement.style.display = 'none';
        };
        
        window.scrollToChatMessage = function(idPesan) {
            const targetElement = document.getElementById('chat-msg-' + idPesan);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Flash highlight effect to WOW the user!
                targetElement.style.transition = 'all 0.3s ease';
                const originalBg = targetElement.style.background;
                const originalBoxShadow = targetElement.style.boxShadow;
                
                targetElement.style.background = '#fef08a'; // Flash highlight yellow
                targetElement.style.boxShadow = '0 0 15px rgba(254,240,138,0.8)';
                
                setTimeout(() => {
                    targetElement.style.background = originalBg;
                    targetElement.style.boxShadow = originalBoxShadow;
                }, 1000);
            }
        };

        function formatMentions(text, isMe = false) {
            if (!text) return '';
            let escaped = escapeHtml(text);
            
            // Highlight @name pattern
            return escaped.replace(/@([a-zA-Z0-9_]+)/g, (match, username) => {
                let isMeTagged = false;
                
                // First, find if this username matches ANY employee in state.karyawanList (valid mention check!)
                let matchedKaryawan = null;
                if (state.karyawanList && Array.isArray(state.karyawanList)) {
                    matchedKaryawan = state.karyawanList.find(k => {
                        const cleanK = (k.Nama || '').toLowerCase().replace(/\s+/g, '');
                        const cleanTarget = username.toLowerCase();
                        const words = (k.Nama || '').toLowerCase().split(/\s+/).filter(w => w.length > 2);
                        
                        return cleanK === cleanTarget || words.some(w => w === cleanTarget);
                    });
                }
                
                if (!matchedKaryawan) {
                    // Not a valid employee name -> return plain @name (no coloring)
                    return match;
                }
                
                // If it is indeed a valid employee name, color it!
                if (state.user && state.user.name) {
                    const cleanUser = state.user.name.toLowerCase().replace(/\s+/g, '');
                    const cleanMatch = username.toLowerCase();
                    const cleanWords = state.user.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
                    
                    if (cleanUser.includes(cleanMatch) || cleanMatch.includes(cleanUser) || cleanWords.some(w => w === cleanMatch)) {
                        isMeTagged = true;
                    }
                }
                
                if (isMeTagged) {
                    return `<span class="chat-mention tagged-me" style="background: #fef3c7; color: #d97706; padding: 2px 6px; border-radius: 6px; font-weight: 900; border: 1px solid #fcd34d; font-size: 13.5px; display: inline-block; box-shadow: 0 2px 5px rgba(217,119,6,0.08);">@${username}</span>`;
                }
                
                if (isMe) {
                    return `<span class="chat-mention" style="background: rgba(255, 255, 255, 0.25); color: #ffffff; padding: 2px 6px; border-radius: 6px; font-weight: 900; font-size: 13.5px; display: inline-block; border: 1px solid rgba(255, 255, 255, 0.35); box-shadow: 0 2px 4px rgba(0,0,0,0.05);">@${username}</span>`;
                }
                return `<span class="chat-mention" style="background: rgba(59,130,246,0.15); color: #1d4ed8; padding: 2px 6px; border-radius: 6px; font-weight: 800; font-size: 13.5px; display: inline-block;">@${username}</span>`;
            });
        }

        function renderChat(forceScrollToBottom = false) {
            const container = document.getElementById('chatMessages');
            if (!chatMessages.length) { renderChatEmpty(); return; }
            
            const previousScrollTop = container.scrollTop;
            const previousScrollHeight = container.scrollHeight;
            const isAtBottom = previousScrollHeight - previousScrollTop - container.clientHeight < 80;
            
            let renderedDivider = false;
            
            container.innerHTML = chatMessages.map((m, index) => {
                const isMe = String(m.idKaryawan) === String(state.user.id);
                
                // Parse reply prefix if exists
                let actualPesan = m.pesan || '';
                let replyBoxHtml = '';
                
                const replyMatch = actualPesan.match(/^\{\{REPLY:(.*?)\|(.*?)\|(.*?)\}\}/);
                if (replyMatch) {
                    const replyId = replyMatch[1];
                    const replySender = replyMatch[2];
                    let replyTextRaw = replyMatch[3];
                    
                    // Strip reply prefix from the rendered message body
                    actualPesan = actualPesan.substring(replyMatch[0].length);
                    
                    // Format the replied text
                    let displayReplyText = replyTextRaw;
                    if (displayReplyText.startsWith('[Foto]')) displayReplyText = '📷 Foto';
                    else if (displayReplyText.startsWith('[Dokumen]')) displayReplyText = '📄 Dokumen';
                    
                    const replyQuoteStyle = isMe 
                        ? 'background: rgba(255, 255, 255, 0.15); border-left: 4px solid #ffffff; padding: 6px 12px; border-radius: 8px; margin-bottom: 8px; font-size: 11.5px; color: rgba(255,255,255,0.9); cursor: pointer; text-align: left; max-width: 100%; transition: background 0.2s;'
                        : 'background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 6px 12px; border-radius: 8px; margin-bottom: 8px; font-size: 11.5px; color: #475569; cursor: pointer; text-align: left; max-width: 100%; transition: background 0.2s;';
                    
                    replyBoxHtml = `
                    <div onclick="scrollToChatMessage('${replyId}')" style="${replyQuoteStyle}" onmouseover="this.style.background='${isMe ? 'rgba(255,255,255,0.22)' : '#e2e8f0'}'" onmouseout="this.style.background='${isMe ? 'rgba(255,255,255,0.15)' : '#f1f5f9'}'">
                        <div style="font-weight: 800; font-size: 10px; color: ${isMe ? '#ffffff' : '#3b82f6'}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">
                            ${replySender}
                        </div>
                        <div style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;">
                            ${escapeHtml(displayReplyText)}
                        </div>
                    </div>`;
                }

                let content = '';
                let captionHtml = '';
                const trimmedActual = actualPesan.trim();
                if (trimmedActual && trimmedActual !== '[Foto]' && trimmedActual !== '[File]') {
                    captionHtml = `
                    <div style="font-size: 14.5px; font-weight: 600; line-height: 1.5; word-break: break-word; margin-top: 8px; padding: 0 2px; color: ${isMe ? '#ffffff' : 'var(--text)'};">
                        ${formatMentions(actualPesan, isMe)}
                    </div>`;
                }

                if (m.tipe === 'image' && m.fileUrl) {
                    content = `
                    ${replyBoxHtml}
                    <div style="position:relative; border-radius:12px; overflow:hidden; max-width:260px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); margin-top: 2px;">
                        <img src="${resolveFotoUrl(m.fileUrl)}" style="width:100%; max-height:220px; object-fit:cover; display:block; cursor:pointer;" onclick="viewPhoto('${resolveFotoUrl(m.fileUrl)}')" alt="Foto">
                    </div>
                    ${captionHtml}`;
                } else if (m.tipe === 'file' && m.fileUrl) {
                    content = `
                    ${replyBoxHtml}
                    <a href="${getPublicViewUrl(m.fileUrl, 'file')}" target="_blank" style="color: inherit; text-decoration: none; display: block; margin-top: 2px;">
                        <div style="display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: ${isMe ? 'rgba(255, 255, 255, 0.15)' : '#f1f5f9'}; border-radius: 12px; font-size: 13px; font-weight: 700; border: 1px solid ${isMe ? 'rgba(255,255,255,0.2)' : '#e2e8f0'};">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0; color: ${isMe ? 'white' : '#3b82f6'};">
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                <polyline points="13 2 13 9 20 9"></polyline>
                            </svg>
                            <span style="max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.namaFile || 'Lampiran File'}</span>
                        </div>
                    </a>
                    ${captionHtml}`;
                } else {
                    content = `
                    ${replyBoxHtml}
                    <div style="font-size: 14.5px; font-weight: 600; line-height: 1.5; word-break: break-word;">
                        ${formatMentions(actualPesan, isMe)}
                    </div>`;
                }

                // Status indicator for own messages
                let statusIcon = '';
                if (isMe) {
                    if (m.status === 'sending') {
                        statusIcon = '<span style="font-size:10px; opacity:0.65; display:inline-flex; align-items:center; gap:2px;">&#9203;</span>';
                    } else if (m.status === 'failed') {
                        statusIcon = `<span style="font-size:10px; color:#fca5a5; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:2px;" onclick="retryChatMessage('${m.tempId}')">&#10060; Gagal</span>`;
                    } else {
                        statusIcon = '<span style="font-size:10px; opacity:0.75; display:inline-flex; align-items:center; gap:2px;">&#10003;</span>';
                    }
                }

                const timeStr = formatChatTime(m.waktu);
                const bubbleId = m.idPesan || m.tempId;

                // LONG PRESS EVENT ATTRIBUTES
                const gestureAttrs = `
                    onmousedown="startChatLongPress(event, '${bubbleId}')"
                    onmouseup="cancelChatLongPress()"
                    onmouseleave="cancelChatLongPress()"
                    ontouchstart="startChatLongPress(event, '${bubbleId}')"
                    ontouchend="cancelChatLongPress()"
                    ondblclick="setChatReply('${bubbleId}')"
                `;

                // === BUILD MESSAGE BUBBLE ===
                let bubbleHtml = '';
                if (isMe) {
                    // SENDER BUBBLE (SAYA)
                    bubbleHtml = `
                    <div id="chat-msg-${bubbleId}" style="align-self: flex-end; max-width: 78%; display: flex; flex-direction: column; align-items: flex-end; transition: all 0.3s ease; border-radius: 20px 20px 4px 20px;">
                        <div ${gestureAttrs} style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 10px 16px; border-radius: 20px 20px 4px 20px; box-shadow: 0 4px 12px rgba(37,99,235,0.18); ${m.status === 'failed' ? 'border: 2px solid #ef4444;' : ''}; cursor: pointer; user-select: none; -webkit-user-select: none;">
                            ${content}
                            <div style="font-size: 10px; margin-top: 5px; opacity: 0.8; text-align: right; display: flex; justify-content: flex-end; align-items: center; gap: 4px; font-weight: 700;">
                                <span>${timeStr}</span>
                                ${statusIcon}
                            </div>
                        </div>
                    </div>`;
                } else {
                    // RECIPIENT BUBBLE (REKAN)
                    const karyawan = state.karyawanList.find(k => k.ID_Karyawan === m.idKaryawan);
                    const rawFotoUrl = karyawan ? (karyawan.Foto_URL || karyawan.Foto_Profil || '') : '';
                    const resolvedFoto = resolveFotoUrl(rawFotoUrl);
                    
                    const avatarColor = getHashCodeColor(m.nama || 'Karyawan');
                    const initial = m.nama ? m.nama.charAt(0).toUpperCase() : '?';
                    
                    let avatarBadge = '';
                    if (resolvedFoto) {
                        avatarBadge = `<img src="${resolvedFoto}" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover; box-shadow: 0 3px 6px rgba(0,0,0,0.06); flex-shrink: 0;" alt="${m.nama}">`;
                    } else {
                        avatarBadge = `<div style="width: 34px; height: 34px; border-radius: 50%; background: ${avatarColor}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; box-shadow: 0 3px 6px rgba(0,0,0,0.06); flex-shrink: 0; text-shadow: 0 1px 2px rgba(0,0,0,0.15);">${initial}</div>`;
                    }
                    
                    // Highlight if tagged
                    const isTagged = isCurrentUserTagged(m.pesan);
                    let bubbleStyle = 'background: white; color: #0f172a; padding: 10px 16px; border-radius: 4px 20px 20px 20px; box-shadow: 0 4px 12px rgba(15,23,42,0.04); border: 1px solid #f1f5f9; cursor: pointer; user-select: none; -webkit-user-select: none;';
                    let alertBadge = '';
                    
                    if (isTagged) {
                        bubbleStyle = 'background: #fffbeb; color: #0f172a; padding: 10px 16px; border-radius: 4px 20px 20px 20px; box-shadow: 0 4px 14px rgba(217,119,6,0.08); border: 1px solid #fcd34d; border-left: 4px solid #d97706; cursor: pointer; user-select: none; -webkit-user-select: none;';
                        alertBadge = `
                        <div style="display: flex; align-items: center; gap: 4px; font-size: 10px; color: #d97706; font-weight: 800; margin-bottom: 5px; background: #fef3c7; width: fit-content; padding: 2px 8px; border-radius: 12px; border: 0.5px solid #fcd34d; flex-shrink:0;">
                            <span>🔔 Disebut</span>
                        </div>`;
                    }

                    bubbleHtml = `
                    <div id="chat-msg-${bubbleId}" style="align-self: flex-start; max-width: 78%; display: flex; gap: 10px; align-items: flex-start; transition: all 0.3s ease; border-radius: 4px 20px 20px 20px;">
                        <!-- Avatar Badge -->
                        ${avatarBadge}
                        <div style="display: flex; flex-direction: column;">
                            <div ${gestureAttrs} style="${bubbleStyle}">
                                ${alertBadge}
                                <div style="font-size: 11px; font-weight: 800; color: ${avatarColor}; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">${escapeHtml(m.nama || 'Rekan')}</div>
                                ${content}
                                <div style="font-size: 10px; margin-top: 5px; color: #64748b; text-align: right; font-weight: 700;">
                                    ${timeStr}
                                </div>
                            </div>
                        </div>
                    </div>`;
                }

                // === WhatsApp-style read marker divider (🚨 PESAN BARU) ===
                let dividerHtml = '';
                if (state.chatLastReadId && m.idPesan && !isMe && !state.hasShownNewMessagesDivider && !renderedDivider) {
                    const lastReadIndex = chatMessages.findIndex(x => x.idPesan === state.chatLastReadId);
                    if (lastReadIndex !== -1 && index > lastReadIndex) {
                        renderedDivider = true;
                        dividerHtml = `
                        <div class="chat-new-messages-divider animate-fade-in" style="display: flex; align-items: center; justify-content: center; margin: 16px 0; width: 100%; grid-column: span 2; grid-row: auto;">
                            <div style="flex: 1; height: 1.5px; background: #fca5a5;"></div>
                            <span style="font-size: 10px; font-weight: 800; color: #ef4444; text-transform: uppercase; letter-spacing: 0.8px; padding: 4px 12px; background: #fee2e2; border-radius: 20px; border: 1px solid #fca5a5; margin: 0 10px; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.08);">🚨 PESAN BARU</span>
                            <div style="flex: 1; height: 1.5px; background: #fca5a5;"></div>
                        </div>`;
                    }
                }

                return dividerHtml + bubbleHtml;
            }).join('');
            
            if (renderedDivider) {
                state.hasShownNewMessagesDivider = true;
            }
            
            if (forceScrollToBottom || isAtBottom) {
                container.scrollTop = container.scrollHeight;
            } else {
                container.scrollTop = previousScrollTop;
            }
        }

        function escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Attachment handling
        function toggleChatAttachMenu() {
            const menu = document.getElementById('chatAttachMenu');
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        }

        function onChatFileSelected(input) {
            const file = input.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) { showToast('File max 5MB', 'error'); input.value = ''; return; }
            const reader = new FileReader();
            reader.onload = (e) => {
                chatAttachment = { type: 'file', data: e.target.result, name: file.name };
                showChatAttachmentPreview(file.name);
            };
            reader.readAsDataURL(file);
            document.getElementById('chatAttachMenu').style.display = 'none';
            input.value = '';
        }

        function onChatPhotoSelected(input) {
            const file = input.files[0];
            if (!file) return;
            compressImage(file, 0.6, 1200).then(({ base64, name }) => {
                chatAttachment = { type: 'image', data: base64, name: name };
                showChatAttachmentPreview(name);
            }).catch(() => showToast('Gagal proses foto', 'error'));
            document.getElementById('chatAttachMenu').style.display = 'none';
            input.value = '';
        }

        function showChatAttachmentPreview(name) {
            const preview = document.getElementById('chatAttachmentPreview');
            document.getElementById('chatAttachmentName').textContent = name;
            preview.style.display = 'flex';
        }

        function clearChatAttachment() {
            chatAttachment = null;
            document.getElementById('chatAttachmentPreview').style.display = 'none';
            document.getElementById('chatAttachmentName').textContent = '';
        }

        // Chat Camera
        async function openChatCamera() {
            document.getElementById('chatAttachMenu').style.display = 'none';
            const overlay = document.getElementById('chatCameraOverlay');
            const video = document.getElementById('chatCameraVideo');
            overlay.classList.add('active');
            try {
                if (chatCameraStream) chatCameraStream.getTracks().forEach(t => t.stop());
                chatCameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
                video.srcObject = chatCameraStream;
                await video.play();
            } catch (err) {
                showToast('Gagal nyalakan kamera: ' + err.message, 'error');
                closeChatCamera();
            }
        }

        function closeChatCamera() {
            const overlay = document.getElementById('chatCameraOverlay');
            overlay.classList.remove('active');
            if (chatCameraStream) { chatCameraStream.getTracks().forEach(t => t.stop()); chatCameraStream = null; }
            const video = document.getElementById('chatCameraVideo');
            if (video) { video.srcObject = null; video.pause(); }
        }

        function captureChatPhoto() {
            const video = document.getElementById('chatCameraVideo');
            const canvas = document.getElementById('chatCameraCanvas');
            if (!video.videoWidth) return;
            // Kompres ukuran foto chat
            let w = video.videoWidth;
            let h = video.videoHeight;
            const maxDimension = 640;
            if (w > maxDimension || h > maxDimension) {
                if (w > h) {
                    h = Math.round(h * maxDimension / w);
                    w = maxDimension;
                } else {
                    w = Math.round(w * maxDimension / h);
                    h = maxDimension;
                }
            }
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0);
            const base64 = canvas.toDataURL('image/jpeg', 0.5);
            chatAttachment = { type: 'image', data: base64, name: 'camera.jpg' };
            showChatAttachmentPreview('camera.jpg');
            closeChatCamera();
        }

        // Image compression utility
        function compressImage(file, quality, maxWidth) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        let w = img.width, h = img.height;
                        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
                        const canvas = document.createElement('canvas');
                        canvas.width = w; canvas.height = h;
                        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                        resolve({ base64: canvas.toDataURL('image/jpeg', quality), name: file.name });
                    };
                    img.onerror = reject;
                    img.src = e.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        async function sendChat() {
            const input = document.getElementById('chatInput');
            let pesan = input.value.trim();
            if (!pesan && !chatAttachment) return;
            if (!state.user || !state.user.id) { showToast('Login dulu!', 'error'); return; }

            // Generate temp ID for tracking
            const tempId = 'temp_' + Date.now();

            // Prepend reply prefix if active
            let replyTextPlaceholder = pesan;
            if (state.replyingTo) {
                // If it is a file/photo message, we want the placeholder to be descriptive
                let snippet = state.replyingTo.messageText;
                const replyRegex = /^\{\{REPLY:.*?\}\}/;
                snippet = snippet.replace(replyRegex, '');
                
                const replyPrefix = `{{REPLY:${state.replyingTo.idPesan}|${state.replyingTo.senderName}|${snippet}}}`;
                pesan = replyPrefix + pesan;
            }

            // Build payload
            const payload = { idKaryawan: state.user.id, nama: state.user.name, pesan: pesan || '', tempId: tempId };
            if (chatAttachment) {
                payload.tipe = chatAttachment.type;
                payload.fileBase64 = chatAttachment.data;
                payload.namaFile = chatAttachment.name;
            }

            // Optimistic render with "sending" status
            const msgObj = {
                tempId: tempId,
                idKaryawan: state.user.id,
                nama: state.user.name,
                pesan: pesan || (chatAttachment ? (chatAttachment.type === 'image' ? '[Foto]' : '[File]') : ''),
                tipe: chatAttachment ? chatAttachment.type : 'text',
                fileUrl: chatAttachment ? chatAttachment.data : null,
                namaFile: chatAttachment ? chatAttachment.name : null,
                waktu: 'Mengirim...',
                status: 'sending'
            };
            chatMessages.push(msgObj);
            renderChat(true);
            input.value = '';
            clearChatAttachment();
            window.clearChatReply();

            try {
                const res = await apiCall('sendChatMessage', payload);
                if (res.success) {
                    // Update status to sent
                    const idx = chatMessages.findIndex(m => m.tempId === tempId);
                    if (idx !== -1) {
                        chatMessages[idx].status = 'sent';
                        chatMessages[idx].waktu = 'Terkirim';
                        chatMessages[idx].idPesan = res.idPesan;
                        renderChat();
                        playSound('chatsent');
                    }
                    // Refresh messages after short delay to get server timestamp
                    setTimeout(() => loadChatMessages(), 800);
                } else {
                    throw new Error(res.error || 'Server error');
                }
            } catch (e) {
                // Update status to failed
                const idx = chatMessages.findIndex(m => m.tempId === tempId);
                if (idx !== -1) {
                    chatMessages[idx].status = 'failed';
                    chatMessages[idx].waktu = 'Gagal dikirim';
                    renderChat();
                }
                showToast('Gagal mengirim: ' + e.message, 'error');
            }
        }

        // Retry failed message
        async function retryChatMessage(tempId) {
            const msg = chatMessages.find(m => m.tempId === tempId);
            if (!msg) return;

            // Remove old failed message
            chatMessages = chatMessages.filter(m => m.tempId !== tempId);

            // Rebuild payload and resend
            document.getElementById('chatInput').value = msg.pesan;
            if (msg.fileUrl && msg.tipe !== 'text') {
                chatAttachment = { type: msg.tipe, data: msg.fileUrl, name: msg.namaFile };
                showChatAttachmentPreview(msg.namaFile);
            }
            sendChat();
        }

        async function populateTukerShiftModal() {
            if (!state.user || !state.user.id) { showToast('Login dulu!', 'error'); return; }
            
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('tukerTanggalSaya').value = today;

            // Setup Card Saya
            document.getElementById('tukerSayaNama').innerText = state.user.name || 'Saya';
            document.getElementById('tukerSayaRole').innerText = state.user.role || 'Karyawan';
            
            const avatarTxt = document.getElementById('tukerSayaAvatarText');
            const avatarImg = document.getElementById('tukerSayaAvatarImg');
            
            const saved = loadLogin();
            const fotoUrl = saved ? (saved.Foto_URL || saved.Foto_Profil || saved.fotoUrl || '') : '';
            const resolved = resolveFotoUrl(fotoUrl);
            if (resolved) {
                avatarImg.src = resolved;
                avatarImg.style.display = 'block';
                avatarTxt.style.display = 'none';
            } else {
                avatarTxt.innerText = (state.user.name || 'S').charAt(0).toUpperCase();
                avatarTxt.style.display = 'flex';
                avatarImg.style.display = 'none';
            }

            // Populate Colleague Karyawan list (exclude self)
            const selKaryawan = document.getElementById('tukerKaryawan');
            selKaryawan.innerHTML = '<option value="">Pilih Rekan...</option>';
            
            // Force-fetch karyawan if list is empty
            if (!state.karyawanList || state.karyawanList.length === 0) {
                try {
                    const res = await apiCall('getKaryawanList');
                    if (res.success && Array.isArray(res.data)) {
                        state.karyawanList = res.data.filter(k => k.Status === 'Aktif');
                    }
                } catch(e) { console.error('Gagal memuat rekan:', e); }
            }

            if (state.karyawanList && state.karyawanList.length) {
                state.karyawanList.filter(k => k.ID_Karyawan !== state.user.id).forEach(k => {
                    const fotoUrl = k.Foto_URL || k.Foto_Profil || k.fotoUrl || '';
                    selKaryawan.innerHTML += `<option value="${k.ID_Karyawan}" data-role="${k.Jabatan || 'Karyawan'}" data-foto="${fotoUrl}">${k.Nama}</option>`;
                });
            }
            
            // Reset Target Card info
            document.getElementById('tukerTujuanNama').innerText = 'Pilih Rekan';
            document.getElementById('tukerTujuanRole').innerText = 'Jabatan';
            
            const destAvatarTxt = document.getElementById('tukerTujuanAvatarText');
            const destAvatarImg = document.getElementById('tukerTujuanAvatarImg');
            destAvatarTxt.innerText = '?';
            destAvatarTxt.style.display = 'flex';
            destAvatarImg.style.display = 'none';

            document.getElementById('tujuanScheduleBox').innerHTML = '<div class="schedule-placeholder">Pilih rekan...</div>';
            document.getElementById('tujuanSwapCard').classList.remove('active-schedule');

            // Auto-detect schedule for self
            await detectSayaSchedule();
        }

        async function detectSayaSchedule() {
            const tanggal = document.getElementById('tukerTanggalSaya').value;
            const container = document.getElementById('sayaScheduleBox');
            const card = document.getElementById('sayaSwapCard');
            
            if (!tanggal) {
                container.innerHTML = '<div class="schedule-placeholder">Pilih tanggal...</div>';
                card.classList.remove('active-schedule');
                return;
            }
            
            container.innerHTML = '<div class="spinner" style="margin: 0 auto; width: 20px; height: 20px;"></div>';
            
            try {
                const res = await apiCall('getKaryawanJadwalByDate', {
                    idKaryawan: state.user.id,
                    tanggal: tanggal
                });
                
                if (res.success) {
                    if (res.libur) {
                        container.innerHTML = `
                            <div class="schedule-libur">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                </svg>
                                <span style="font-weight:800; font-size:11px; margin-top:4px;">L I B U R</span>
                            </div>`;
                        document.getElementById('tukerTokoSaya').value = '';
                        document.getElementById('tukerShiftSaya').value = '';
                        card.classList.remove('active-schedule');
                    } else {
                        container.innerHTML = `
                            <div class="schedule-active-info">
                                <div class="schedule-row" style="color: #2563eb;">
                                    <div class="schedule-icon-wrapper" style="background: rgba(37, 99, 235, 0.1);">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    </div>
                                    <span>${res.namaToko}</span>
                                </div>
                                <div class="schedule-row" style="color: #475569;">
                                    <div class="schedule-icon-wrapper" style="background: rgba(71, 85, 105, 0.1);">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                    </div>
                                    <span>${res.namaShift}</span>
                                </div>
                                <div class="schedule-row" style="font-size: 11px; color: #64748b; padding-left: 32px; margin-top: -4px;">
                                    <span>${res.jamMasuk} - ${res.jamPulang}</span>
                                </div>
                            </div>`;
                        document.getElementById('tukerTokoSaya').value = res.idToko;
                        document.getElementById('tukerShiftSaya').value = res.idShift;
                        card.classList.add('active-schedule');
                    }
                } else {
                    container.innerHTML = '<div class="schedule-placeholder" style="color: #ef4444;">Gagal memuat jadwal</div>';
                    card.classList.remove('active-schedule');
                }
            } catch (e) {
                container.innerHTML = '<div class="schedule-placeholder" style="color: #ef4444;">Koneksi gagal</div>';
                card.classList.remove('active-schedule');
            }
        }

        async function onTukerTanggalSayaChange() {
            await detectSayaSchedule();
            await detectColleagueSchedule();
        }

        async function onColleagueSelectChange() {
            await detectColleagueSchedule();
        }

        async function detectColleagueSchedule() {
            const karyawanId = document.getElementById('tukerKaryawan').value;
            const tanggal = document.getElementById('tukerTanggalSaya').value;
            const container = document.getElementById('tujuanScheduleBox');
            const card = document.getElementById('tujuanSwapCard');
            
            // Update Card Rekan Tujuan UI
            const selKaryawan = document.getElementById('tukerKaryawan');
            const selectedOpt = selKaryawan.options[selKaryawan.selectedIndex];
            
            if (selectedOpt && selectedOpt.value) {
                const colName = selectedOpt.text;
                const colRole = selectedOpt.getAttribute('data-role') || 'Karyawan';
                const colFoto = selectedOpt.getAttribute('data-foto') || '';
                
                document.getElementById('tukerTujuanNama').innerText = colName;
                document.getElementById('tukerTujuanRole').innerText = colRole;
                
                const avatarTxt = document.getElementById('tukerTujuanAvatarText');
                const avatarImg = document.getElementById('tukerTujuanAvatarImg');
                const resolved = resolveFotoUrl(colFoto);
                if (resolved) {
                    avatarImg.src = resolved;
                    avatarImg.style.display = 'block';
                    avatarTxt.style.display = 'none';
                } else {
                    avatarTxt.innerText = (colName || 'R').charAt(0).toUpperCase();
                    avatarTxt.style.display = 'flex';
                    avatarImg.style.display = 'none';
                }
            } else {
                document.getElementById('tukerTujuanNama').innerText = 'Pilih Rekan';
                document.getElementById('tukerTujuanRole').innerText = 'Jabatan';
                const avatarTxt = document.getElementById('tukerTujuanAvatarText');
                const avatarImg = document.getElementById('tukerTujuanAvatarImg');
                avatarTxt.innerText = '?';
                avatarTxt.style.display = 'flex';
                avatarImg.style.display = 'none';
            }
            
            if (!karyawanId || !tanggal) {
                container.innerHTML = '<div class="schedule-placeholder">Pilih rekan...</div>';
                card.classList.remove('active-schedule');
                return;
            }
            
            container.innerHTML = '<div class="spinner" style="margin: 0 auto; width: 20px; height: 20px;"></div>';
            
            try {
                const res = await apiCall('getKaryawanJadwalByDate', {
                    idKaryawan: karyawanId,
                    tanggal: tanggal
                });
                
                if (res.success) {
                    if (res.libur) {
                        container.innerHTML = `
                            <div class="schedule-libur">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                </svg>
                                <span style="font-weight:800; font-size:11px; margin-top:4px;">L I B U R</span>
                            </div>`;
                        document.getElementById('tukerTokoTujuan').value = '';
                        document.getElementById('tukerShiftTujuan').value = '';
                        card.classList.remove('active-schedule');
                    } else {
                        container.innerHTML = `
                            <div class="schedule-active-info">
                                <div class="schedule-row" style="color: #f97316;">
                                    <div class="schedule-icon-wrapper" style="background: rgba(249, 115, 22, 0.1);">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    </div>
                                    <span>${res.namaToko}</span>
                                </div>
                                <div class="schedule-row" style="color: #475569;">
                                    <div class="schedule-icon-wrapper" style="background: rgba(71, 85, 105, 0.1);">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                    </div>
                                    <span>${res.namaShift}</span>
                                </div>
                                <div class="schedule-row" style="font-size: 11px; color: #64748b; padding-left: 32px; margin-top: -4px;">
                                    <span>${res.jamMasuk} - ${res.jamPulang}</span>
                                </div>
                            </div>`;
                        document.getElementById('tukerTokoTujuan').value = res.idToko;
                        document.getElementById('tukerShiftTujuan').value = res.idShift;
                        card.classList.add('active-schedule');
                    }
                } else {
                    container.innerHTML = '<div class="schedule-placeholder" style="color: #ef4444;">Gagal memuat jadwal</div>';
                    card.classList.remove('active-schedule');
                }
            } catch (e) {
                container.innerHTML = '<div class="schedule-placeholder" style="color: #ef4444;">Koneksi gagal</div>';
                card.classList.remove('active-schedule');
            }
        }

        async function submitTukerShift() {
            if (!state.user || !state.user.id) { showToast('Login dulu!', 'error'); return; }
            
            const tokoSaya = document.getElementById('tukerTokoSaya').value;
            const shiftSaya = document.getElementById('tukerShiftSaya').value;
            const tanggalSaya = document.getElementById('tukerTanggalSaya').value;
            
            const karyawanId = document.getElementById('tukerKaryawan').value;
            const tokoTujuan = document.getElementById('tukerTokoTujuan').value;
            const shiftTujuan = document.getElementById('tukerShiftTujuan').value;
            
            if (!karyawanId) {
                showToast('Pilih rekan kerja tujuan swap!', 'error'); return;
            }
            if (!tokoSaya || !shiftSaya) {
                showToast('Jadwal Anda pada tanggal tersebut tidak aktif/libur!', 'error'); return;
            }
            if (!tokoTujuan || !shiftTujuan) {
                showToast('Jadwal rekan tujuan pada tanggal tersebut tidak aktif/libur!', 'error'); return;
            }
            
            const btn = document.getElementById('btnAjukanTuker');
            btn.disabled = true;
            btn.innerHTML = '<div class="spinner" style="display:inline-block; vertical-align:middle; width:16px; height:16px;"></div> Memproses...';
            
            try {
                const res = await apiCall('ajukanTukerShift', {
                    idKaryawan: state.user.id,
                    nama: state.user.name,
                    idTokoSaya: tokoSaya,
                    idTokoTujuan: tokoTujuan,
                    idKaryawanTujuan: karyawanId,
                    shiftSaya,
                    shiftTujuan,
                    tanggal: tanggalSaya,
                    tanggalTujuan: tanggalSaya,
                    alasan: ""
                });
                
                if (res.success) {
                    closeModal('modalTukerShift');
                    tampilPicoModal('sukses', '<b>Pengajuan Tukar Shift Terkirim! ⇆</b><br>Sukses mengirimkan pengajuan tukar shift. Menunggu konfirmasi dari rekan kerja Anda.');
                    playSound('success');
                } else {
                    showToast(res.error || 'Gagal mengajukan tukar shift', 'error');
                }
            } catch (e) {
                showToast('Koneksi backend gagal', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" style="margin-right: 8px;">
                        <path d="M17 1l4 4-4 4"></path>
                        <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                        <path d="M7 23l-4-4 4-4"></path>
                        <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                    </svg>
                    AJUKAN TUKAR SHIFT`;
            }
        }

        // ==================== DATA IZIN & LEMBUR ====================
        let izinHistoryData = [];
        let lemburHistoryData = [];
        let izinFilter = 'semua';
        let lemburFilter = 'semua';

        async function renderDataIzin() {
            if (!state.user || !state.user.id) { showToast('Login dulu!', 'error'); return; }
            const container = document.getElementById('izinHistoryList');
            container.innerHTML = '<div class="history-empty">Memuat data...</div>';
            try {
                const res = await apiCall('getIzinHistory', { idKaryawan: state.user.id });
                if (res.success && Array.isArray(res.data)) {
                    izinHistoryData = res.data;
                    renderIzinList();
                } else {
                    container.innerHTML = '<div class="history-empty">Belum ada pengajuan izin</div>';
                }
            } catch (e) {
                container.innerHTML = '<div class="history-empty">Gagal memuat data</div>';
            }
        }

        function renderIzinList() {
            const container = document.getElementById('izinHistoryList');
            let filtered = izinHistoryData;
            if (izinFilter !== 'semua') {
                filtered = izinHistoryData.filter(d => (d.status || '').toLowerCase() === izinFilter);
            }
            if (filtered.length === 0) {
                container.innerHTML = '<div class="history-empty">Tidak ada data untuk filter ini</div>';
                return;
            }
            container.innerHTML = filtered.map(d => {
                const st = (d.status || 'Pending').toLowerCase();
                const stClass = st === 'approved' ? 'approved' : st === 'rejected' ? 'rejected' : 'pending';
                const stText = st === 'approved' ? 'Disetujui' : st === 'rejected' ? 'Ditolak' : 'Pending';
                return `<div class="history-card ${stClass}">
      <div class="history-header">
        <div class="history-title">${d.jenis || 'Izin'}</div>
        <div class="history-badge ${stClass}">${stText}</div>
      </div>
      <div class="history-meta">
        <div><strong>Tanggal:</strong> ${d.tglMulai || '-'} s/d ${d.tglSelesai || '-'}</div>
        <div><strong>Alasan:</strong> ${d.alasan || '-'}</div>
        <div><strong>Diajukan:</strong> ${d.tanggalPengajuan || '-'}</div>
        ${d.approvedAt ? `<div><strong>Proses:</strong> ${d.approvedAt}</div>` : ''}
      </div>
    </div>`;
            }).join('');
        }

        function filterIzin(filter, el) {
            izinFilter = filter;
            document.querySelectorAll('#modalDataIzin .filter-chip').forEach(c => c.classList.remove('active'));
            el.classList.add('active');
            renderIzinList();
        }

        async function renderDataLembur() {
            if (!state.user || !state.user.id) { showToast('Login dulu!', 'error'); return; }
            const container = document.getElementById('lemburHistoryList');
            container.innerHTML = '<div class="history-empty">Memuat data...</div>';
            try {
                const res = await apiCall('getLemburHistory', { idKaryawan: state.user.id });
                if (res.success && Array.isArray(res.data)) {
                    lemburHistoryData = res.data;
                    renderLemburList();
                } else {
                    container.innerHTML = '<div class="history-empty">Belum ada pengajuan lembur</div>';
                }
            } catch (e) {
                container.innerHTML = '<div class="history-empty">Gagal memuat data</div>';
            }
        }

        function renderLemburList() {
            const container = document.getElementById('lemburHistoryList');
            let filtered = lemburHistoryData;
            if (lemburFilter !== 'semua') {
                filtered = lemburHistoryData.filter(d => (d.status || '').toLowerCase() === lemburFilter);
            }
            if (filtered.length === 0) {
                container.innerHTML = '<div class="history-empty">Tidak ada data untuk filter ini</div>';
                return;
            }
            container.innerHTML = filtered.map(d => {
                const st = (d.status || 'Pending').toLowerCase();
                const stClass = st === 'approved' ? 'approved' : st === 'rejected' ? 'rejected' : 'pending';
                const stText = st === 'approved' ? 'Disetujui' : st === 'rejected' ? 'Ditolak' : 'Pending';
                return `<div class="history-card ${stClass}">
      <div class="history-header">
        <div class="history-title">Lembur - ${d.toko || '-'}</div>
        <div class="history-badge ${stClass}">${stText}</div>
      </div>
      <div class="history-meta">
        <div><strong>Tanggal:</strong> ${d.tanggal || '-'}</div>
        <div><strong>Alasan:</strong> ${d.alasan || '-'}</div>
        <div><strong>Diajukan:</strong> ${d.tanggalPengajuan || '-'}</div>
        ${d.approvedAt ? `<div><strong>Proses:</strong> ${d.approvedAt}</div>` : ''}
      </div>
    </div>`;
            }).join('');
        }

        function filterLembur(filter, el) {
            lemburFilter = filter;
            document.querySelectorAll('#modalDataLembur .filter-chip').forEach(c => c.classList.remove('active'));
            el.classList.add('active');
            renderLemburList();
        }

        // ==================== TUGAS ====================
        let tugasData = [];
        let tugasFilter = 'semua';

        async function renderTugasList() {
            if (!state.user || !state.user.id) { showToast('Login dulu!', 'error'); return; }
            const container = document.getElementById('tugasList');
            container.innerHTML = '<div class="history-empty">Memuat tugas...</div>';
            try {
                const res = await apiCall('getTugasList', { idKaryawan: state.user.id, idToko: state.user.tokoDefault || '' });
                if (res.success && Array.isArray(res.data)) {
                    tugasData = res.data;
                    renderTugasItems();
                    // Update badge
                    const pendingCount = tugasData.filter(t => t.status !== 'Selesai').length;
                    const badge = document.getElementById('badgeTugas');
                    if (badge) {
                        badge.textContent = pendingCount;
                        badge.classList.toggle('hidden', pendingCount === 0);
                    }
                } else {
                    container.innerHTML = '<div class="history-empty">Belum ada tugas</div>';
                }
            } catch (e) {
                container.innerHTML = '<div class="history-empty">Gagal memuat tugas</div>';
            }
        }

        function renderTugasItems() {
            const container = document.getElementById('tugasList');
            let filtered = tugasData;
            if (tugasFilter !== 'semua') {
                filtered = tugasData.filter(t => (t.status || '').toLowerCase() === tugasFilter);
            }
            if (filtered.length === 0) {
                container.innerHTML = '<div class="history-empty">Tidak ada tugas untuk filter ini</div>';
                return;
            }
            container.innerHTML = filtered.map(t => {
                const pri = (t.prioritas || 'Low').trim();
                const priLower = pri.toLowerCase();
                const isDone = t.status === 'Selesai';
                
                // Priority Tag formatting
                let priLabel = '🟢 Biasa';
                if (priLower === 'high' || priLower === 'penting' || priLower === 'tinggi') {
                    priLabel = '🔴 Tinggi';
                } else if (priLower === 'medium' || priLower === 'sedang') {
                    priLabel = '🟡 Sedang';
                }
                
                // Deadline HTML
                let deadlineHtml = '';
                if (t.deadline) {
                    deadlineHtml = `
                    <div style="display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-secondary); font-weight: 700;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: #64748b; flex-shrink:0;">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>Deadline: <b style="color: #475569;">${t.deadline}</b></span>
                    </div>`;
                } else {
                    deadlineHtml = `
                    <div style="display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-secondary); font-weight: 600;">
                        <span>Tanpa Deadline</span>
                    </div>`;
                }

                const cardStyle = isDone 
                    ? 'background: #f8fafc; border-left: 5px solid #10b981; opacity: 0.85;' 
                    : `border-left: 5px solid ${priLower === 'high' ? '#ef4444' : priLower === 'medium' ? '#f59e0b' : '#10b981'};`;

                return `
                <div class="tugas-card" style="position: relative; background: var(--surface); border-radius: 16px; padding: 16px 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.03); margin-bottom: 12px; border: 1px solid #e2e8f0; ${cardStyle} transition: all 0.25s;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
                        <div style="font-size: 16px; font-weight: 800; color: #0f172a; line-height: 1.35; flex: 1;">${escapeHtml(t.judul)}</div>
                        <span style="font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 8px; letter-spacing: 0.5px;
                            background: ${priLower === 'high' ? '#fee2e2' : priLower === 'medium' ? '#fef3c7' : '#d1fae5'};
                            color: ${priLower === 'high' ? '#b91c1c' : priLower === 'medium' ? '#b45309' : '#047857'}; flex-shrink: 0;">
                            ${priLabel}
                        </span>
                    </div>
                    <div style="font-size: 13.5px; line-height: 1.5; color: #475569; margin-bottom: 16px; font-weight: 500; white-space: pre-line;">${escapeHtml(t.deskripsi || '')}</div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #e2e8f0; padding-top: 12px; gap: 10px;">
                        ${deadlineHtml}
                        ${!isDone ? `
                            <button class="tugas-btn selesai" onclick="selesaikanTugas('${t.id}')" 
                                style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; font-size: 12.5px; font-weight: 800; padding: 8px 16px; border-radius: 12px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; box-shadow: 0 4px 10px rgba(16,185,129,0.25); transition: all 0.2s;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="flex-shrink:0;">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Selesai
                            </button>
                        ` : `
                            <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #059669; font-weight: 800; background: #d1fae5; padding: 4px 10px; border-radius: 20px;">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="flex-shrink:0;">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Selesai
                            </span>
                        `}
                    </div>
                </div>`;
            }).join('');
        }

        function filterTugas(filter, el) {
            tugasFilter = filter;
            document.querySelectorAll('#modalTugas .filter-chip').forEach(c => c.classList.remove('active'));
            el.classList.add('active');
            renderTugasItems();
        }

        async function selesaikanTugas(idTugas) {
            if (!state.user || !state.user.id) return;
            try {
                await apiCall('updateTugasStatus', { idTugas: idTugas, status: 'Selesai', idKaryawan: state.user.id });
                showToast('Tugas diselesaikan!', 'success');
                renderTugasList();
            } catch (e) {
                showToast('Gagal update tugas', 'error');
            }
        }

        // ==================== BERITA ====================
        async function renderBeritaList() {
            const container = document.getElementById('beritaList');
            container.innerHTML = '<div class="history-empty">Memuat info...</div>';
            try {
                const res = await apiCall('getBeritaList', { limit: 10 });
                if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                    container.innerHTML = res.data.map(b => {
                        const kat = b.kategori || 'Umum';
                        let badgeBg = 'linear-gradient(135deg, #8492a6, #64748b)';
                        let badgeColor = 'white';
                        
                        if (kat === 'Penting') {
                            badgeBg = 'linear-gradient(135deg, #ff6b6b, #ef4444)';
                        } else if (kat === 'Info') {
                            badgeBg = 'linear-gradient(135deg, #0d8abc, #0a6b8e)';
                        } else if (kat === 'Event') {
                            badgeBg = 'linear-gradient(135deg, #34c759, #10b981)';
                        } else if (kat === 'Promo') {
                            badgeBg = 'linear-gradient(135deg, #ff9500, #f59e0b)';
                        }

                        // Parse and format date beautifully
                        let tglPublishHtml = '';
                        if (b.tglPublish) {
                            tglPublishHtml = `
                            <div style="display: flex; align-items: center; gap: 4px; font-size: 11.5px; color: #8b95a5; font-weight: 700; margin-top: 12px;">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: #a0aec0; flex-shrink: 0;">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <span>Diterbitkan: ${b.tglPublish}</span>
                            </div>`;
                        }

                        return `
                        <div class="berita-card" style="background: var(--surface); border-radius: 20px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.03); margin-bottom: 16px; border: 1px solid #e2e8f0; transition: transform 0.2s, box-shadow 0.2s;">
                            ${b.gambarUrl ? `
                                <div style="position: relative; width: 100%; height: 170px; overflow: hidden; background: #f1f5f9;">
                                    <img src="${b.gambarUrl}" class="berita-img" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s;" alt="${escapeHtml(b.judul)}">
                                    <div style="position: absolute; bottom: 12px; left: 16px;">
                                        <span class="berita-kategori" style="background: ${badgeBg}; color: ${badgeColor}; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 0.5px;">${kat}</span>
                                    </div>
                                </div>
                            ` : `
                                <div style="padding: 16px 20px 0 20px;">
                                    <span class="berita-kategori" style="background: ${badgeBg}; color: ${badgeColor}; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 6px rgba(0,0,0,0.05);">${kat}</span>
                                </div>
                            `}
                            
                            <div class="berita-body" style="padding: 16px 20px 20px;">
                                <div class="berita-judul" style="font-size: 17px; font-weight: 800; color: #0f172a; line-height: 1.35; margin-bottom: 8px;">${escapeHtml(b.judul)}</div>
                                <div class="berita-isi" style="font-size: 13.5px; line-height: 1.55; color: #475569; font-weight: 500; white-space: pre-line; word-break: break-word;">${escapeHtml(b.isi)}</div>
                                ${tglPublishHtml}
                            </div>
                        </div>`;
                    }).join('');
                    
                    // Update badge
                    const badge = document.getElementById('badgeBerita');
                    if (badge) {
                        badge.textContent = res.data.length;
                        badge.classList.remove('hidden');
                    }
                } else {
                    container.innerHTML = '<div class="history-empty">Belum ada info</div>';
                }
            } catch (e) {
                container.innerHTML = '<div class="history-empty">Gagal memuat info</div>';
            }
        }

        function getKategoriColor(kat) {
            const colors = { 'Umum': '#8B95A5', 'Penting': '#FF3B30', 'Info': '#0D8ABC', 'Event': '#34C759', 'Promo': '#FF9500' };
            return colors[kat] || colors['Umum'];
        }

        // ==================== LOGOUT ====================
        function logout() {
            tampilPicoModal(
                'error', 
                '<b>Yakin ingin keluar, Kak?</b><br>PICO akan sangat merindukan kehadiranmu di sini! 🥺💔', 
                () => {
                    clearLogin(); 
                    stopCamera();
                    tampilPicoModal('sukses', '<b>Logout Berhasil!</b><br>Kamu telah aman keluar dari aplikasi. Sampai jumpa lagi, Kak! PICO selalu menunggumu kembali! 👋🐧', () => {
                        location.reload();
                    });
                }, 
                true
            );
        }

        // ==================== TOUCH FIX ====================
        document.addEventListener('touchstart', function () { }, { passive: true });

        // ==================== MONTHLY RECAP ====================
        async function updateMonthlyRecap() {
            if (!state.user || !state.user.id) return;
            try {
                const now = new Date();
                const res = await apiCall('getRaportBulanan', {
                    idKaryawan: state.user.id,
                    bulan: now.getMonth() + 1,
                    tahun: now.getFullYear()
                });
                
                if (res && res.success) {
                    let totalHadir = res.totalHadir || 0;
                    let totalTelat = res.totalTelat || 0;
                    let totalSakit = res.totalSakit || 0;
                    let totalIzin = res.totalIzin || 0;
                    let totalCuti = res.totalCuti || 0;
                    let totalLembur = res.totalLembur || 0;
                    let totalPulangCepat = res.totalPulangCepat || 0;
                    
                    const currentMonth = now.getMonth() + 1;
                    const currentYear = now.getFullYear();

                    // ==========================================
                    // CLIENT-SIDE FALLBACK & DOUBLE-CHECK
                    // ==========================================
                    // Jika data backend mengembalikan 0 (atau jika backend belum di-redeploy),
                    // kita hitung secara lokal dari API riwayat untuk menjamin 100% kebenaran data!

                    // A. HITUNG IZIN, SAKIT, CUTI DARI RIWAYAT IZIN CLIENT-SIDE
                    try {
                        const izinRes = await apiCall('getIzinHistory', { idKaryawan: state.user.id });
                        if (izinRes && izinRes.success && Array.isArray(izinRes.data)) {
                            let localSakit = 0;
                            let localIzin = 0;
                            let localCuti = 0;
                            
                            izinRes.data.forEach(i => {
                                if ((i.status || '').toLowerCase() === 'approved' && i.tglMulai) {
                                    const tgl = parseDateSafe(i.tglMulai);
                                    if (tgl && tgl.getMonth() + 1 === currentMonth && tgl.getFullYear() === currentYear) {
                                        const jenis = String(i.jenis || '').toLowerCase();
                                        const start = parseDateSafe(i.tglMulai);
                                        const end = i.tglSelesai ? parseDateSafe(i.tglSelesai) : start;
                                        let diffDays = 1;
                                        if (start && end) {
                                            diffDays = Math.max(1, Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1);
                                        }
                                        
                                        if (jenis.includes('sakit')) {
                                            localSakit += diffDays;
                                        } else if (jenis.includes('cuti')) {
                                            localCuti += diffDays;
                                        } else {
                                            localIzin += diffDays;
                                        }
                                    }
                                }
                            });
                            
                            if (totalSakit === 0) totalSakit = localSakit;
                            if (totalIzin === 0) totalIzin = localIzin;
                            if (totalCuti === 0) totalCuti = localCuti;
                        }
                    } catch (err) { console.log('Local Izin calculation error:', err); }

                    // B. HITUNG LEMBUR DARI RIWAYAT LEMBUR CLIENT-SIDE
                    try {
                        const lemburRes = await apiCall('getLemburHistory', { idKaryawan: state.user.id });
                        if (lemburRes && lemburRes.success && Array.isArray(lemburRes.data)) {
                            let localLembur = 0;
                            lemburRes.data.forEach(l => {
                                if ((l.status || '').toLowerCase() === 'approved' && l.tanggal) {
                                    const tgl = parseDateSafe(l.tanggal);
                                    if (tgl && tgl.getMonth() + 1 === currentMonth && tgl.getFullYear() === currentYear) {
                                        localLembur++;
                                    }
                                }
                            });
                            if (totalLembur === 0) totalLembur = localLembur;
                        }
                    } catch (err) { console.log('Local Lembur calculation error:', err); }

                    // C. HITUNG PULANG CEPAT SECARA CERDAS & AKURAT
                    try {
                        let localPulangCepat = 0;
                        if (Array.isArray(res.detailHarian) && res.detailHarian.length > 0) {
                            const activeShifts = [];
                            const aktifToko = state.user.tokoDefault || '';
                            if (aktifToko) {
                                const sRes = await apiCall('getShiftByToko', { idToko: aktifToko });
                                if (sRes && sRes.success && Array.isArray(sRes.data)) {
                                    activeShifts.push(...sRes.data);
                                }
                            }
                            
                            res.detailHarian.forEach(d => {
                                if (d.jamPulang && d.jamPulang !== '-' && d.jamPulang !== '') {
                                    let shiftJamPulang = '';
                                    const timeRangeMatch = d.shift.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
                                    if (timeRangeMatch && timeRangeMatch[2]) {
                                        shiftJamPulang = timeRangeMatch[2];
                                    } else {
                                        const foundShift = activeShifts.find(s => d.shift.includes(s.Nama_Shift));
                                        if (foundShift && foundShift.Jam_Pulang) {
                                            shiftJamPulang = foundShift.Jam_Pulang;
                                        }
                                    }
                                    
                                    if (shiftJamPulang) {
                                        const parseToMin = (tStr) => {
                                            const pts = String(tStr).split(':');
                                            return pts.length >= 2 ? parseInt(pts[0]) * 60 + parseInt(pts[1]) : null;
                                        };
                                        const realMin = parseToMin(d.jamPulang);
                                        const shiftMin = parseToMin(shiftJamPulang);
                                        if (realMin !== null && shiftMin !== null && realMin < shiftMin) {
                                            localPulangCepat++;
                                        }
                                    }
                                }
                            });
                            if (totalPulangCepat === 0) totalPulangCepat = localPulangCepat;
                        }
                    } catch (err) { console.log('Local Pulang Cepat calculation error:', err); }
                    
                    // Hitung hari kerja berjalan s.d hari ini (kecuali hari Minggu)
                    let workingDaysUpToToday = 0;
                    const year = now.getFullYear();
                    const month = now.getMonth();
                    for (let d = 1; d <= now.getDate(); d++) {
                        const day = new Date(year, month, d).getDay();
                        if (day !== 0) { // Bukan hari Minggu (0)
                            workingDaysUpToToday++;
                        }
                    }
                    
                    // Hitung total hari kerja dalam bulan ini (kecuali hari Minggu)
                    let totalWorkingDaysInMonth = 0;
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    for (let d = 1; d <= daysInMonth; d++) {
                        const day = new Date(year, month, d).getDay();
                        if (day !== 0) {
                            totalWorkingDaysInMonth++;
                        }
                    }
                    if (totalWorkingDaysInMonth === 0) totalWorkingDaysInMonth = 26; // Fallback
                    
                    // Alpa = (Hari Kerja Berjalan - Hadir - Sakit - Izin - Cuti)
                    const alpa = Math.max(0, workingDaysUpToToday - totalHadir - totalSakit - totalIzin - totalCuti);
                    
                    const monthLabel = getMonthNameIndo(month) + ' ' + year;
                    
                    // 1. UPDATE BERANDA CARD
                    if (document.getElementById('statHadir')) document.getElementById('statHadir').textContent = totalHadir;
                    if (document.getElementById('statAlpa')) document.getElementById('statAlpa').textContent = alpa;
                    if (document.getElementById('statTelat')) document.getElementById('statTelat').textContent = totalTelat;
                    
                    const pctHadir = Math.min(100, Math.round((totalHadir / totalWorkingDaysInMonth) * 100));
                    const pctAlpa = Math.min(100, Math.round((alpa / totalWorkingDaysInMonth) * 100));
                    const pctTelat = totalHadir > 0 ? Math.min(100, Math.round((totalTelat / totalHadir) * 100)) : 0;
                    
                    if (document.getElementById('barHadir')) document.getElementById('barHadir').style.width = pctHadir + '%';
                    if (document.getElementById('barAlpa')) document.getElementById('barAlpa').style.width = pctAlpa + '%';
                    if (document.getElementById('barTelat')) document.getElementById('barTelat').style.width = pctTelat + '%';
                    
                    // 2. UPDATE REKAP ABSENSI CARD IN DATA TAB
                    if (document.getElementById('dataBulanLabel')) document.getElementById('dataBulanLabel').textContent = monthLabel;
                    if (document.getElementById('dataHadir')) document.getElementById('dataHadir').textContent = totalHadir;
                    if (document.getElementById('dataAlpa')) document.getElementById('dataAlpa').textContent = alpa;
                    if (document.getElementById('dataSakit')) document.getElementById('dataSakit').textContent = totalSakit;
                    if (document.getElementById('dataIzin')) document.getElementById('dataIzin').textContent = totalIzin;
                    if (document.getElementById('dataCuti')) document.getElementById('dataCuti').textContent = totalCuti;
                    if (document.getElementById('dataLembur')) document.getElementById('dataLembur').textContent = totalLembur;
                    if (document.getElementById('dataTelat')) document.getElementById('dataTelat').textContent = totalTelat;
                    if (document.getElementById('dataPulangCepat')) document.getElementById('dataPulangCepat').textContent = totalPulangCepat;
                    
                    // Update progress bars for Data Tab
                    const pctDataSakit = Math.min(100, Math.round((totalSakit / totalWorkingDaysInMonth) * 100));
                    const pctDataIzin = Math.min(100, Math.round((totalIzin / totalWorkingDaysInMonth) * 100));
                    const pctDataCuti = Math.min(100, Math.round((totalCuti / totalWorkingDaysInMonth) * 100));
                    const pctDataLembur = Math.min(100, Math.round((totalLembur / totalWorkingDaysInMonth) * 100));
                    const pctDataTelat = totalHadir > 0 ? Math.min(100, Math.round((totalTelat / totalHadir) * 100)) : 0;
                    const pctDataPulangCepat = totalHadir > 0 ? Math.min(100, Math.round((totalPulangCepat / totalHadir) * 100)) : 0;
                    
                    if (document.getElementById('barDataHadir')) document.getElementById('barDataHadir').style.width = pctHadir + '%';
                    if (document.getElementById('barDataAlpa')) document.getElementById('barDataAlpa').style.width = pctAlpa + '%';
                    if (document.getElementById('barDataSakit')) document.getElementById('barDataSakit').style.width = pctDataSakit + '%';
                    if (document.getElementById('barDataIzin')) document.getElementById('barDataIzin').style.width = pctDataIzin + '%';
                    if (document.getElementById('barDataCuti')) document.getElementById('barDataCuti').style.width = pctDataCuti + '%';
                    if (document.getElementById('barDataLembur')) document.getElementById('barDataLembur').style.width = pctDataLembur + '%';
                    if (document.getElementById('barDataTelat')) document.getElementById('barDataTelat').style.width = pctDataTelat + '%';
                    if (document.getElementById('barDataPulangCepat')) document.getElementById('barDataPulangCepat').style.width = pctDataPulangCepat + '%';
                }
            } catch (e) {
                console.error('[RECAP] Gagal memuat rekap bulanan:', e);
            }
        }
        
        function getMonthNameIndo(monthNum) {
            const months = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ];
            return months[monthNum];
        }

        function registerWebpushrUser(userId) {
            if (!userId) return;

            // Daftarkan User ID secara langsung ke Webpushr (akan di-queue otomatis oleh SDK jika script belum selesai terunduh)
            if (typeof webpushr === 'function') {
                try {
                    webpushr('action', 'segment', { sid: String(userId) });
                    console.log('[WEBPUSHR] Registered segment for User ID:', userId);
                } catch(e) {
                    console.error('[WEBPUSHR] Failed to register segment:', e);
                }
            }
        }

        function checkNotificationStatus() {
            const banner = document.getElementById('notifOptinBanner');
            if (!banner) return;
            
            if (typeof Notification !== 'undefined') {
                // Tampilkan banner hanya jika izin belum 'granted' DAN user sudah login
                if (Notification.permission !== 'granted' && state.user && state.user.id) {
                    banner.style.display = 'flex';
                } else {
                    banner.style.display = 'none';
                }
            } else {
                banner.style.display = 'none';
            }
        }

        function triggerNotifPermissionRequest() {
            if (typeof Notification !== 'undefined') {
                // Meminta izin notifikasi (User Gesture triggered)
                Notification.requestPermission().then(permission => {
                    console.log('[NOTIFICATION] Permission requested:', permission);
                    checkNotificationStatus();
                    
                    if (permission === 'granted') {
                        if (state.user && state.user.id) {
                            registerWebpushrUser(state.user.id);
                        }
                        showToast('Notifikasi berhasil diaktifkan!', 'success');
                    } else if (permission === 'denied') {
                        showToast('Izin notifikasi ditolak/diblokir. Silakan aktifkan via setelan browser.', 'warning');
                    }
                }).catch(err => {
                    console.error('[NOTIFICATION] Request failed:', err);
                });
            } else {
                showToast('Browser Anda tidak mendukung notifikasi.', 'error');
            }
        }
