// ==================== STATE ====================
        let state = {
            user: null, photoData: null, gps: { lat: null, lng: null, accuracy: null, jarak: null },
            absenStatus: 'belum_masuk', absenTokoId: '', lemburTokoId: '', isLemburMode: false, jadwalOffset: 0, stream: null,
            tokoList: [], shiftList: [], karyawanList: [], notifList: [], notifShown: false,
            lemburStream: null, lemburPhotoData: null, audioUnlocked: false
        };
        
        // Inlined pico.js library for maximum reliability on all platforms
        const pico = {
            unpack_cascade: function(bytes) {
                const dview = new DataView(new ArrayBuffer(4));
                let p = 8;
                dview.setUint8(0, bytes[p+0]), dview.setUint8(1, bytes[p+1]), dview.setUint8(2, bytes[p+2]), dview.setUint8(3, bytes[p+3]);
                const tdepth = dview.getInt32(0, true);
                p = p + 4;
                dview.setUint8(0, bytes[p+0]), dview.setUint8(1, bytes[p+1]), dview.setUint8(2, bytes[p+2]), dview.setUint8(3, bytes[p+3]);
                const ntrees = dview.getInt32(0, true);
                p = p + 4;
                const tcodes_ls = [];
                const tpreds_ls = [];
                const thresh_ls = [];
                for(let t=0; t<ntrees; ++t) {
                    Array.prototype.push.apply(tcodes_ls, [0, 0, 0, 0]);
                    Array.prototype.push.apply(tcodes_ls, bytes.slice(p, p+4*Math.pow(2, tdepth)-4));
                    p = p + 4*Math.pow(2, tdepth)-4;
                    for(let i=0; i<Math.pow(2, tdepth); ++i) {
                        dview.setUint8(0, bytes[p+0]), dview.setUint8(1, bytes[p+1]), dview.setUint8(2, bytes[p+2]), dview.setUint8(3, bytes[p+3]);
                        tpreds_ls.push(dview.getFloat32(0, true));
                        p = p + 4;
                    }
                    dview.setUint8(0, bytes[p+0]), dview.setUint8(1, bytes[p+1]), dview.setUint8(2, bytes[p+2]), dview.setUint8(3, bytes[p+3]);
                    thresh_ls.push(dview.getFloat32(0, true));
                    p = p + 4;
                }
                const tcodes = new Int8Array(tcodes_ls);
                const tpreds = new Float32Array(tpreds_ls);
                const thresh = new Float32Array(thresh_ls);
                function classify_region(r, c, s, pixels, ldim) {
                     r = 256*r;
                     c = 256*c;
                     let root = 0;
                     let o = 0.0;
                     const pow2tdepth = Math.pow(2, tdepth) >> 0;
                     for(let i=0; i<ntrees; ++i) {
                        let idx = 1;
                        for(let j=0; j<tdepth; ++j)
                            idx = 2*idx + (pixels[((r+tcodes[root + 4*idx + 0]*s) >> 8)*ldim+((c+tcodes[root + 4*idx + 1]*s) >> 8)]<=pixels[((r+tcodes[root + 4*idx + 2]*s) >> 8)*ldim+((c+tcodes[root + 4*idx + 3]*s) >> 8)]);
                         o = o + tpreds[pow2tdepth*i + idx-pow2tdepth];
                         if(o<=thresh[i]) return -1;
                         root += 4*pow2tdepth;
                    }
                    return o - thresh[ntrees-1];
                }
                return classify_region;
            },
            run_cascade: function(image, classify_region, params) {
                const pixels = image.pixels;
                const nrows = image.nrows;
                const ncols = image.ncols;
                const ldim = image.ldim;
                const shiftfactor = params.shiftfactor;
                const minsize = params.minsize;
                const maxsize = params.maxsize;
                const scalefactor = params.scalefactor;
                let scale = minsize;
                const detections = [];
                while(scale<=maxsize) {
                    const step = Math.max(shiftfactor*scale, 1) >> 0;
                    const offset = (scale/2 + 1) >> 0;
                    for(let r=offset; r<=nrows-offset; r+=step)
                        for(let c=offset; c<=ncols-offset; c+=step) {
                            const q = classify_region(r, c, scale, pixels, ldim);
                            if (q > 0.0) detections.push([r, c, scale, q]);
                        }
                    scale = scale*scalefactor;
                }
                return detections;
            },
            cluster_detections: function(dets, iouthreshold) {
                dets = dets.sort(function(a, b) { return b[3] - a[3]; });
                function calculate_iou(det1, det2) {
                    const r1=det1[0], c1=det1[1], s1=det1[2];
                    const r2=det2[0], c2=det2[1], s2=det2[2];
                    const overr = Math.max(0, Math.min(r1+s1/2, r2+s2/2) - Math.max(r1-s1/2, r2-s2/2));
                    const overc = Math.max(0, Math.min(c1+s1/2, c2+s2/2) - Math.max(c1-s1/2, c2-s2/2));
                    return overr*overc/(s1*s1+s2*s2-overr*overc);
                }
                const assignments = new Array(dets.length).fill(0);
                const clusters = [];
                for(let i=0; i<dets.length; ++i) {
                    if(assignments[i]==0) {
                        let r=0.0, c=0.0, s=0.0, q=0.0, n=0;
                        for(let j=i; j<dets.length; ++j)
                            if(calculate_iou(dets[i], dets[j])>iouthreshold) {
                                assignments[j] = 1;
                                r = r + dets[j][0];
                                c = c + dets[j][1];
                                s = s + dets[j][2];
                                q = q + dets[j][3];
                                n = n + 1;
                            }
                        clusters.push([r/n, c/n, s/n, q]);
                    }
                }
                return clusters;
            },
            instantiate_detection_memory: function(size) {
                let n = 0;
                const memory = [];
                for(let i=0; i<size; ++i) memory.push([]);
                function update_memory(dets) {
                    memory[n] = dets;
                    n = (n+1)%memory.length;
                    dets = [];
                    for(let i=0; i<memory.length; ++i) dets = dets.concat(memory[i]);
                    return dets;
                }
                return update_memory;
            }
        };

        let facefinderClassifyRegion = null;
        let faceDetectionInterval = null;
        let updateMemory = null;
        
        let localDB = null; // Handler Basis Data IndexedDB Karyawan (Server Mini)

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
            // Sync to Native Preferences for Background Service
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
                window.Capacitor.Plugins.Preferences.set({ key: 'userId', value: String(data.id || '') });
                window.Capacitor.Plugins.Preferences.set({ key: 'userRole', value: String(data.role || '') });
            }
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
            // Remove from Native Preferences
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
                window.Capacitor.Plugins.Preferences.remove({ key: 'userId' });
                window.Capacitor.Plugins.Preferences.remove({ key: 'userRole' });
            }
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

        // ==================== BASIS DATA LOKAL & DELTA SYNC ENGINE ====================
        function initLocalDatabase() {
            return new Promise((resolve, reject) => {
                try {
                    if (!window.indexedDB) {
                        throw new Error("IndexedDB tidak didukung atau diblokir di browser ini.");
                    }
                    const request = indexedDB.open("PinguinAbsenDB", 2); // Naikkan versi ke 2 untuk upgrade schema
                    
                    request.onupgradeneeded = (e) => {
                        const db = e.target.result;
                        const stores = [
                            { name: "MASTER_KARYAWAN", key: "ID_Karyawan" },
                            { name: "MASTER_TOKO", key: "ID_Toko" },
                            { name: "SHIFT_TOKO", key: "ID_Shift" },
                            { name: "JADWAL_KARYAWAN", key: "ID_Jadwal" },
                            { name: "ABSENSI", key: "Timestamp" },
                            { name: "LEMBUR", key: "ID" },
                            { name: "IZIN_CUTI", key: "ID" },
                            { name: "MASTER_JENIS_IZIN", key: "ID_Jenis" },
                            { name: "SETTING_GLOBAL", key: "Parameter" },
                            { name: "LOG_ERROR", key: "Timestamp" },
                            { name: "CHAT", key: "ID_Pesan" },
                            { name: "TUKER_SHIFT", key: "ID_Tuker" },
                            { name: "TUGAS", key: "ID_Tugas" },
                            { name: "BERITA", key: "ID_Berita" },
                            { name: "OUTBOX_QUEUE", key: "id", auto: true },
                            { name: "FOTO_CACHE", key: "url" },         // Store untuk simpan gambar terkompresi / profile pic
                            { name: "RESPONSE_CACHE", key: "cacheKey" } // Store untuk simpan response query API kompleks
                        ];
                        
                        stores.forEach(store => {
                            if (!db.objectStoreNames.contains(store.name)) {
                                db.createObjectStore(store.name, { 
                                    keyPath: store.key, 
                                    autoIncrement: store.auto || false 
                                });
                            }
                        });
                    };
                    
                    request.onsuccess = (e) => {
                        localDB = e.target.result;
                        console.log("[DB] IndexedDB PinguinAbsenDB Berhasil Diinisialisasi (Versi 2).");
                        resolve(localDB);
                    };
                    
                    request.onerror = (e) => {
                        console.error("[DB] Gagal membuka IndexedDB:", e.target.error);
                        reject(e.target.error);
                    };
                } catch (err) {
                    console.error("[DB] Eksepsi saat membuka IndexedDB:", err);
                    reject(err);
                }
            });
        }

        // ==================== HELPER PENYIMPANAN LOKAL (OFFLINE ENGINE) ====================
        function getAllLocal(storeName) {
            return new Promise((resolve) => {
                if (!localDB || !localDB.objectStoreNames.contains(storeName)) return resolve([]);
                try {
                    const tx = localDB.transaction(storeName, "readonly");
                    const store = tx.objectStore(storeName);
                    const req = store.getAll();
                    req.onsuccess = () => resolve(req.result || []);
                    req.onerror = () => resolve([]);
                } catch(e) {
                    console.warn(`[DB] Gagal getAllLocal untuk ${storeName}:`, e);
                    resolve([]);
                }
            });
        }

        function getResponseCache(cacheKey) {
            return new Promise((resolve) => {
                if (!localDB || !localDB.objectStoreNames.contains("RESPONSE_CACHE")) return resolve(null);
                try {
                    const tx = localDB.transaction("RESPONSE_CACHE", "readonly");
                    const store = tx.objectStore("RESPONSE_CACHE");
                    const req = store.get(cacheKey);
                    req.onsuccess = () => resolve(req.result ? req.result.data : null);
                    req.onerror = () => resolve(null);
                } catch (e) {
                    resolve(null);
                }
            });
        }

        function saveResponseCache(cacheKey, data) {
            return new Promise((resolve) => {
                if (!localDB || !localDB.objectStoreNames.contains("RESPONSE_CACHE")) return resolve(false);
                try {
                    const tx = localDB.transaction("RESPONSE_CACHE", "readwrite");
                    const store = tx.objectStore("RESPONSE_CACHE");
                    const req = store.put({ cacheKey, data, timestamp: Date.now() });
                    req.onsuccess = () => resolve(true);
                    req.onerror = () => resolve(false);
                } catch (e) {
                    resolve(false);
                }
            });
        }

        async function cachedApiCall(action, payload = {}, onDataReceived) {
            const cacheKey = action + "_" + JSON.stringify(payload);
            
            // 1. Ambil dari cache lokal instan
            let cachedData = null;
            try {
                cachedData = await getResponseCache(cacheKey);
                if (cachedData) {
                    console.log(`[CACHE-ENGINE] Cache Hit untuk action: ${action}`);
                    onDataReceived(cachedData);
                }
            } catch (e) {
                console.warn("[CACHE-ENGINE] Gagal memuat cache:", e);
            }
            
            // 2. Tarik data segar dari server di background
            if (navigator.onLine) {
                try {
                    const res = await apiCall(action, payload);
                    if (res.success) {
                        const resStr = JSON.stringify(res);
                        const cachedStr = cachedData ? JSON.stringify(cachedData) : "";
                        
                        // Jika data berbeda dengan cache (atau cache kosong), update UI
                        if (resStr !== cachedStr) {
                            console.log(`[CACHE-ENGINE] Refreshing UI karena data baru tersedia dari server untuk: ${action}`);
                            onDataReceived(res);
                        }
                        
                        // Simpan ke cache lokal
                        await saveResponseCache(cacheKey, res);
                    } else if (!cachedData) {
                        // Jika gagal dan tidak ada cache, teruskan respon error
                        onDataReceived(res);
                    }
                    return res;
                } catch (err) {
                    console.warn(`[CACHE-ENGINE] Gagal fetch network untuk ${action}:`, err);
                    if (!cachedData) {
                        throw err;
                    }
                }
            } else {
                console.log(`[CACHE-ENGINE] Mode Offline. Menggunakan cache untuk: ${action}`);
                if (!cachedData) {
                    onDataReceived({ success: false, error: "Koneksi terputus dan data belum tersedia." });
                }
            }
        }

        // ==================== ENGINE SINKRONISASI FOTO LOKAL ====================
        function loadImageWithCache(imgElement, originalUrl) {
            if (!imgElement) return;
            const resolvedUrl = resolveFotoUrl(originalUrl);
            if (!resolvedUrl) {
                imgElement.src = "";
                return;
            }
            
            // Simpan resolvedUrl asli sebagai data attribute untuk self-healing jika gambar rusak
            imgElement.setAttribute('data-resolved-url', resolvedUrl);
            
            // Tambahkan listener error satu kali untuk mendeteksi cache rusak
            if (!imgElement.dataset.errorListenerAdded) {
                imgElement.dataset.errorListenerAdded = "true";
                imgElement.addEventListener('error', () => {
                    const fallbackUrl = imgElement.getAttribute('data-resolved-url');
                    // Jika saat ini sumbernya adalah data URI (cache), berarti cache rusak/invalid
                    if (imgElement.src.startsWith('data:') && fallbackUrl) {
                        console.warn("[CACHE-ENGINE] Cache gambar terdeteksi rusak, memulihkan ke URL asli:", fallbackUrl);
                        imgElement.src = fallbackUrl;
                        
                        // Hapus cache yang rusak dari IndexedDB agar bisa diunduh ulang dengan benar
                        if (localDB && localDB.objectStoreNames.contains("FOTO_CACHE")) {
                            try {
                                const tx = localDB.transaction("FOTO_CACHE", "readwrite");
                                tx.objectStore("FOTO_CACHE").delete(fallbackUrl);
                            } catch(e) {}
                        }
                        
                        // Coba unduh ulang di latar belakang
                        if (navigator.onLine) {
                            fetchAndCacheImage(fallbackUrl);
                        }
                    }
                });
            }
            
            // 1. Cari di FOTO_CACHE IndexedDB
            if (localDB && localDB.objectStoreNames.contains("FOTO_CACHE")) {
                try {
                    const tx = localDB.transaction("FOTO_CACHE", "readonly");
                    const store = tx.objectStore("FOTO_CACHE");
                    const req = store.get(resolvedUrl);
                    
                    req.onsuccess = () => {
                        if (req.result && req.result.data && req.result.data.length > 150) {
                            imgElement.src = req.result.data; // Data URI Base64
                        } else {
                            // Belum dicache, gunakan URL langsung lalu download di latar belakang
                            imgElement.src = resolvedUrl;
                            if (navigator.onLine) {
                                fetchAndCacheImage(resolvedUrl);
                            }
                        }
                    };
                    req.onerror = () => {
                        imgElement.src = resolvedUrl;
                    };
                } catch(e) {
                    imgElement.src = resolvedUrl;
                }
            } else {
                imgElement.src = resolvedUrl;
            }
        }

        async function fetchAndCacheImage(url) {
            if (!url || !url.startsWith("http")) return;
            try {
                let base64data = null;
                
                // Cari module Native Http Capacitor
                let nativeHttp = null;
                if (window.Capacitor) {
                    if (window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorHttp) {
                        nativeHttp = window.Capacitor.Plugins.CapacitorHttp;
                    } else if (window.Capacitor.Http) {
                        nativeHttp = window.Capacitor.Http;
                    }
                }
                
                // Coba gunakan CapacitorHttp jika tersedia (untuk memintas CORS di Android)
                if (nativeHttp) {
                    try {
                        console.log("[CACHE-ENGINE] Menggunakan Capacitor Native Http (ArrayBuffer) untuk gambar:", url);
                        const response = await nativeHttp.get({
                            url: url,
                            responseType: 'arraybuffer'
                        });
                        
                        if (response && response.status === 200 && response.data) {
                            let base64str = "";
                            if (response.data instanceof ArrayBuffer) {
                                const bytes = new Uint8Array(response.data);
                                let binary = "";
                                for (let i = 0; i < bytes.length; i++) {
                                    binary += String.fromCharCode(bytes[i]);
                                }
                                base64str = btoa(binary);
                            } else if (typeof response.data === 'string') {
                                // Jika dikembalikan sebagai string base64 atau teks mentah
                                base64str = response.data;
                            }
                            
                            if (base64str && base64str.length > 50) {
                                const contentType = response.headers['Content-Type'] || response.headers['content-type'] || '';
                                const finalType = contentType.includes("image") ? contentType : "image/jpeg";
                                base64data = `data:${finalType};base64,${base64str}`;
                                console.log("[CACHE-ENGINE] Gambar berhasil diunduh via Native Http (ArrayBuffer)");
                            }
                        }
                    } catch (nativeErr) {
                        console.warn("[CACHE-ENGINE] Native Http gagal, mencoba fallback fetch standard:", nativeErr);
                    }
                }
                
                // Fallback ke standard fetch jika Native Http tidak ada atau gagal
                if (!base64data) {
                    const res = await fetch(url);
                    if (res.status === 200) {
                        const contentType = res.headers.get("content-type") || "";
                        if (contentType.includes("image") || contentType.includes("octet-stream") || !contentType) {
                            const blob = await res.blob();
                            base64data = await new Promise((resolve, reject) => {
                                const reader = new FileReader();
                                reader.onloadend = () => resolve(reader.result);
                                reader.onerror = reject;
                                reader.readAsDataURL(blob);
                            });
                        }
                    }
                }
                
                if (base64data && base64data.length > 150 && localDB && localDB.objectStoreNames.contains("FOTO_CACHE")) {
                    const tx = localDB.transaction("FOTO_CACHE", "readwrite");
                    tx.objectStore("FOTO_CACHE").put({ url: url, data: base64data, timestamp: Date.now() });
                    console.log("[CACHE-ENGINE] Gambar berhasil disimpan di FOTO_CACHE:", url);
                }
            } catch(e) {
                console.warn("[CACHE-ENGINE] Gagal mengunduh gambar untuk cache:", url, e);
            }
        }

        // ==================== OVERLAY BLOCKING SINKRONISASI ====================
        function showSyncOverlay(message = "Sedang menyelaraskan data...") {
            let overlay = document.getElementById('syncOverlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'syncOverlay';
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(15, 23, 42, 0.85);
                    backdrop-filter: blur(8px);
                    -webkit-backdrop-filter: blur(8px);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 999999;
                    color: white;
                    font-family: 'Outfit', sans-serif;
                    transition: opacity 0.3s ease;
                    opacity: 0;
                `;
                overlay.innerHTML = `
                    <div style="background: var(--surface, #ffffff); color: #0f172a; padding: 30px 40px; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); text-align: center; max-width: 85%; width: 340px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; align-items: center; gap: 20px; transform: scale(0.9); transition: transform 0.3s ease;">
                        <div class="spinner-sync" style="width: 48px; height: 48px; border: 4px solid #f1f5f9; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <div style="font-weight: 800; font-size: 18px; line-height: 1.4; color: #0f172a;" id="syncOverlayTitle">Sinkronisasi Data</div>
                        <div style="font-size: 13.5px; font-weight: 600; color: #64748b; line-height: 1.5;" id="syncOverlayText">${message}</div>
                    </div>
                `;
                document.body.appendChild(overlay);
                
                // Add spin animation dynamically if not present
                if (!document.getElementById('spinStyle')) {
                    const style = document.createElement('style');
                    style.id = 'spinStyle';
                    style.innerHTML = `
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `;
                    document.head.appendChild(style);
                }
                
                // Trigger reflow & transition
                setTimeout(() => {
                    overlay.style.opacity = '1';
                    overlay.querySelector('div').style.transform = 'scale(1)';
                }, 50);
            } else {
                document.getElementById('syncOverlayText').innerText = message;
            }
        }

        function hideSyncOverlay() {
            const overlay = document.getElementById('syncOverlay');
            if (overlay) {
                overlay.style.opacity = '0';
                overlay.querySelector('div').style.transform = 'scale(0.9)';
                setTimeout(() => {
                    try { overlay.remove(); } catch(e) {}
                }, 300);
            }
        }

        async function triggerDeltaSync(showOverlay = false, syncType = 'full') {
            if (!state.user || !state.user.id || !localDB) return;
            if (!navigator.onLine) return;
            
            const lastSyncTime = localStorage.getItem("lastSyncTime") || "0";
            const isInitialSync = lastSyncTime === "0";
            
            // Initial sync selalu full
            if (isInitialSync) syncType = 'full';
            
            const shouldShowOverlay = showOverlay && navigator.onLine;
            if (shouldShowOverlay) {
                showSyncOverlay(isInitialSync ? "Mengunduh data awal dari server... Harap tunggu hingga proses sinkronisasi selesai." : "Menyelaraskan data terbaru...");
            }
            
            try {
                const res = await apiCall('getDeltas', { lastSyncTime: lastSyncTime, syncType: syncType, idKaryawan: state.user.id });
                if (res.success && res.deltas) {
                    const storeNames = Object.keys(res.deltas).filter(name => 
                        localDB.objectStoreNames.contains(name)
                    );
                    if (storeNames.length === 0) return;
                    
                    if (shouldShowOverlay) {
                        showSyncOverlay("Menyimpan data terbaru ke database lokal...");
                    }
                    
                    // Cek apakah ada upload pending di OUTBOX_QUEUE
                    let hasOutboxPending = false;
                    try {
                        const obTx = localDB.transaction("OUTBOX_QUEUE", "readonly");
                        const obStore = obTx.objectStore("OUTBOX_QUEUE");
                        const outboxItems = await new Promise((resolve, reject) => {
                            const req = obStore.getAll();
                            req.onsuccess = () => resolve(req.result || []);
                            req.onerror = () => reject(req.error);
                        });
                        hasOutboxPending = outboxItems.length > 0;
                    } catch(e) { /* abaikan */ }
                    
                    // Simpan ke IndexedDB per-store agar transaksi tidak expire
                    for (const sheetName of storeNames) {
                        // Skip ABSENSI & LEMBUR jika ada upload pending
                        // Mencegah data server (tanpa foto) menimpa data lokal (dengan foto)
                        if (hasOutboxPending && (sheetName === 'ABSENSI' || sheetName === 'LEMBUR')) {
                            console.log(`[SYNC] ⏸️ Skip ${sheetName} — ada upload pending di OUTBOX`);
                            continue;
                        }
                        
                        try {
                            const tx = localDB.transaction(sheetName, "readwrite");
                            const store = tx.objectStore(sheetName);
                            const rows = res.deltas[sheetName];
                            const keyPath = getPrimaryKey(sheetName);
                            
                            rows.forEach(row => {
                                if (row[keyPath]) {
                                    store.put(row);
                                }
                            });
                        } catch(e) {
                            console.warn(`[SYNC] Gagal menyimpan ${sheetName}:`, e);
                        }
                    }
                    
                    localStorage.setItem("lastSyncTime", res.serverTime);
                    console.log(`[SYNC] ${syncType.toUpperCase()} sync berhasil. ${storeNames.length} store diperbarui.`);
                    
                    // Update foto/data user jika ada perubahan MASTER_KARYAWAN
                    if (res.deltas.MASTER_KARYAWAN) {
                        const curr = res.deltas.MASTER_KARYAWAN.find(k => String(k.ID_Karyawan) === String(state.user.id));
                        if (curr) {
                            const newFotoUrl = curr.Foto_URL || curr.Foto_Profil || curr.fotoUrl || '';
                            setupUserUI(newFotoUrl);
                            const saved = loadLogin();
                            if (saved) {
                                saved.fotoUrl = newFotoUrl;
                                saveLogin(saved);
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn(`[SYNC] ${syncType} sync gagal:`, e.message);
            } finally {
                if (shouldShowOverlay) {
                    hideSyncOverlay();
                }
            }
        }
        window.manualSyncRefresh = async function() {
            if (!navigator.onLine) {
                tampilPicoModal('error', 'Koneksi internet terputus. Silakan hubungkan internet terlebih dahulu untuk menyelaraskan data terbaru.');
                return;
            }
            
            const btn = document.querySelector('.header-refresh');
            const svg = document.getElementById('refreshIconSvg');
            if (btn && svg) {
                svg.style.transition = 'transform 1s ease';
                svg.style.transform = 'rotate(360deg)';
                btn.disabled = true;
            }
            
            try {
                // Bersihkan FOTO_CACHE IndexedDB agar bisa mengunduh foto terbaru secara bersih
                if (window.localDB && window.localDB.objectStoreNames.contains("FOTO_CACHE")) {
                    try {
                        const tx = window.localDB.transaction("FOTO_CACHE", "readwrite");
                        tx.objectStore("FOTO_CACHE").clear();
                        console.log("[SYNC] FOTO_CACHE berhasil dibersihkan untuk penyegaran media.");
                    } catch (cacheErr) {
                        console.warn("[SYNC] Gagal membersihkan FOTO_CACHE:", cacheErr);
                    }
                }

                // Jalankan sinkronisasi penuh dengan overlay pemblokir
                await triggerDeltaSync(true);
                
                // Muat ulang data UI berdasarkan tab aktif saat ini
                const activeTab = state.activeTab || 'beranda';
                if (activeTab === 'chat') {
                    await loadChatMessages();
                } else if (activeTab === 'absensi') {
                    await checkAbsenStatus();
                } else if (activeTab === 'raport') {
                    await renderRaport();
                } else if (activeTab === 'berita') {
                    await renderBeritaList();
                } else if (activeTab === 'tugas') {
                    if (typeof renderTugas === 'function') await renderTugas();
                }
                
                // Selalu perbarui informasi karyawan & data toko/jadwal di beranda
                if (state.user && state.user.id) {
                    await checkAbsenStatus();
                    await updateMonthlyRecap();
                    await checkMyApprovals();
                }
                
                showToast('Penyelarasan data berhasil!', 'success');
            } catch (err) {
                console.error('[SYNC] Gagal melakukan penyegaran manual:', err);
                showToast('Gagal menyelaraskan data.', 'error');
            } finally {
                if (btn && svg) {
                    svg.style.transform = 'none';
                    btn.disabled = false;
                }
            }
        };

        window.toggleProfilePopover = function(event) {
            if (event) event.stopPropagation();
            const popover = document.getElementById('profilePopover');
            if (!popover) return;
            
            if (popover.style.display === 'none' || popover.style.display === '') {
                // Update text/image inside popover using current user state
                const popoverName = document.getElementById('popoverName');
                const popoverRole = document.getElementById('popoverRole');
                const popoverAvatarText = document.getElementById('popoverAvatarText');
                const popoverAvatarImg = document.getElementById('popoverAvatarImg');
                
                if (state.user) {
                    if (popoverName) popoverName.textContent = state.user.name || '-';
                    if (popoverRole) popoverRole.textContent = state.user.role || '-';
                    
                    // Avatar text
                    if (popoverAvatarText) {
                        popoverAvatarText.textContent = (state.user.name || 'U').charAt(0).toUpperCase();
                    }
                    
                    // Avatar image
                    const headerImg = document.getElementById('headerAvatarImg');
                    if (headerImg && headerImg.src && headerImg.style.display !== 'none') {
                        if (popoverAvatarImg) {
                            popoverAvatarImg.src = headerImg.src;
                            popoverAvatarImg.style.display = 'block';
                        }
                        if (popoverAvatarText) popoverAvatarText.style.display = 'none';
                    } else {
                        if (popoverAvatarImg) popoverAvatarImg.style.display = 'none';
                        if (popoverAvatarText) popoverAvatarText.style.display = 'flex';
                    }
                }
                
                popover.style.display = 'flex';
                // Listen to click outside to close popover
                document.addEventListener('click', closePopoverOutside);
            } else {
                popover.style.display = 'none';
                document.removeEventListener('click', closePopoverOutside);
            }
        };

        function closePopoverOutside(e) {
            const popover = document.getElementById('profilePopover');
            const headerAvatar = document.getElementById('headerAvatar');
            const headerInfo = document.querySelector('.header-info');
            
            if (popover && !popover.contains(e.target) && (!headerAvatar || !headerAvatar.contains(e.target)) && (!headerInfo || !headerInfo.contains(e.target))) {
                popover.style.display = 'none';
                document.removeEventListener('click', closePopoverOutside);
            }
        }

        window.openChangePinModal = function() {
            // Close popover first
            const popover = document.getElementById('profilePopover');
            if (popover) {
                popover.style.display = 'none';
                document.removeEventListener('click', closePopoverOutside);
            }
            
            // Clear inputs
            const pinLama = document.getElementById('pinLama');
            const pinBaru = document.getElementById('pinBaru');
            const errorDiv = document.getElementById('changePinError');
            if (pinLama) pinLama.value = '';
            if (pinBaru) pinBaru.value = '';
            if (errorDiv) {
                errorDiv.textContent = '';
                errorDiv.style.display = 'none';
            }
            
            openModal('modalChangePin');
        };

        window.submitChangePin = async function() {
            const pinLama = document.getElementById('pinLama');
            const pinBaru = document.getElementById('pinBaru');
            const errorDiv = document.getElementById('changePinError');
            
            if (!pinLama || !pinBaru || !errorDiv) return;
            
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
            
            const valLama = pinLama.value.trim();
            const valBaru = pinBaru.value.trim();
            
            if (!valLama || !valBaru) {
                errorDiv.textContent = 'Semua kolom PIN harus diisi!';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Verifikasi PIN lama di sisi klien
            const currentPin = String(state.user ? state.user.pin : '').trim().padStart(4, '0');
            const inputOldPin = String(valLama).trim().padStart(4, '0');
            if (currentPin !== inputOldPin) {
                errorDiv.textContent = 'PIN saat ini salah!';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Validasi format PIN baru (4-6 digit angka)
            if (!/^[0-9]{4,6}$/.test(valBaru)) {
                errorDiv.textContent = 'PIN baru harus terdiri dari 4-6 digit angka!';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Pastikan PIN baru tidak sama dengan PIN lama
            if (valLama === valBaru) {
                errorDiv.textContent = 'PIN baru tidak boleh sama dengan PIN saat ini!';
                errorDiv.style.display = 'block';
                return;
            }
            
            const btnSubmit = document.querySelector('#modalChangePin .btn-primary');
            const btnCancel = document.querySelector('#modalChangePin .btn-secondary');
            if (btnSubmit) btnSubmit.disabled = true;
            if (btnCancel) btnCancel.disabled = true;
            
            try {
                const res = await apiCall('changePin', {
                    idKaryawan: state.user.id,
                    newPin: valBaru
                });
                
                if (res && res.success) {
                    // Update pin di state & local storage
                    state.user.pin = valBaru;
                    saveLogin({
                        ...loadLogin(),
                        pin: valBaru
                    });
                    
                    closeModal('modalChangePin');
                    tampilPicoModal('sukses', '<b>PIN Berhasil Diubah! 🔑</b><br>PIN baru Anda telah berhasil diperbarui.');
                } else {
                    errorDiv.textContent = (res && res.error) ? res.error : 'Gagal mengubah PIN.';
                    errorDiv.style.display = 'block';
                }
            } catch (err) {
                console.error('[PIN] Error changing pin:', err);
                errorDiv.textContent = 'Terjadi kesalahan jaringan. Coba lagi.';
                errorDiv.style.display = 'block';
            } finally {
                if (btnSubmit) btnSubmit.disabled = false;
                if (btnCancel) btnCancel.disabled = false;
            }
        };



        function getPrimaryKey(sheetName) {
            const keys = {
                MASTER_KARYAWAN: "ID_Karyawan", MASTER_TOKO: "ID_Toko", SHIFT_TOKO: "ID_Shift",
                JADWAL_KARYAWAN: "ID_Jadwal", ABSENSI: "Timestamp", LEMBUR: "ID",
                IZIN_CUTI: "ID", MASTER_JENIS_IZIN: "ID_Jenis", SETTING_GLOBAL: "Parameter",
                LOG_ERROR: "Timestamp", CHAT: "ID_Pesan", TUKER_SHIFT: "ID_Tuker",
                TUGAS: "ID_Tugas", BERITA: "ID_Berita"
            };
            return keys[sheetName] || "ID";
        }

        function kompresSelfie(base64Str, callback) {
            if (!base64Str || !base64Str.startsWith('data:image')) {
                return callback(base64Str);
            }
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; // Kompres ke resolusi HD ringan
                let width = img.width, height = img.height;
                
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
                
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                callback(canvas.toDataURL('image/jpeg', 0.7)); // Kompres JPEG kualitas 70%
            };
            img.onerror = () => callback(base64Str);
        }

        function enkripsiDekripsiFoto(dataString, pinKunci) {
            let result = "";
            const key = String(pinKunci);
            for (let i = 0; i < dataString.length; i++) {
                result += String.fromCharCode(dataString.charCodeAt(i) ^ key.charCodeAt(i % key.length));
            }
            return btoa(result);
        }

        function addToOutbox(tipeAksi, dataPayload) {
            return new Promise((resolve, reject) => {
                if (!localDB) return reject(new Error("LocalDB tidak aktif"));
                const tx = localDB.transaction("OUTBOX_QUEUE", "readwrite");
                const store = tx.objectStore("OUTBOX_QUEUE");
                
                const item = {
                    tipe: tipeAksi,
                    payload: dataPayload,
                    createdAt: Date.now(),
                    status: "pending"
                };
                
                const request = store.add(item);
                request.onsuccess = () => {
                    console.log(`[OUTBOX] Aksi ${tipeAksi} ditambahkan ke antrean HP.`);
                    resolve(true);
                };
                request.onerror = (e) => reject(e.target.error);
            });
        }

        async function processOutboxQueue() {
            if (!navigator.onLine || !state.user || !localDB) return;
            
            // Langkah 1: Baca semua item dari antrean terlebih dahulu (sinkron)
            let allItems = [];
            try {
                const readTx = localDB.transaction("OUTBOX_QUEUE", "readonly");
                const readStore = readTx.objectStore("OUTBOX_QUEUE");
                allItems = await new Promise((resolve, reject) => {
                    const req = readStore.getAll();
                    req.onsuccess = () => resolve(req.result || []);
                    req.onerror = () => reject(req.error);
                });
            } catch (e) {
                console.error("[OUTBOX] Gagal membaca antrean:", e);
                return;
            }
            
            if (allItems.length === 0) return;
            console.log(`[OUTBOX] Ditemukan ${allItems.length} item dalam antrean.`);
            
            // Langkah 2: Reset item "uploading" yang sudah nyangkut > 2 menit
            const STUCK_TIMEOUT = 2 * 60 * 1000; // 2 menit
            for (const item of allItems) {
                if (item.status === "uploading" && item.uploadStartedAt) {
                    if (Date.now() - item.uploadStartedAt > STUCK_TIMEOUT) {
                        console.warn(`[OUTBOX] Item ID ${item.id} nyangkut, reset ke pending.`);
                        item.status = "pending";
                        delete item.uploadStartedAt;
                        try {
                            const resetTx = localDB.transaction("OUTBOX_QUEUE", "readwrite");
                            resetTx.objectStore("OUTBOX_QUEUE").put(item);
                        } catch (e) { /* abaikan */ }
                    }
                }
            }
            
            // Langkah 3: Proses setiap item "pending" secara berurutan
            const pendingItems = allItems.filter(i => i.status === "pending" || i.status === "failed");
            
            for (const item of pendingItems) {
                try {
                    // Tandai sebagai "uploading" dengan timestamp
                    item.status = "uploading";
                    item.uploadStartedAt = Date.now();
                    try {
                        const markTx = localDB.transaction("OUTBOX_QUEUE", "readwrite");
                        markTx.objectStore("OUTBOX_QUEUE").put(item);
                    } catch (e) { /* lanjutkan saja */ }
                    
                    console.log(`[OUTBOX] Memproses unggah: ${item.tipe} (ID: ${item.id})`);
                    
                    // Dekripsi foto sebelum diunggah ke Google Drive
                    let payloadToUpload = { ...item.payload };
                    if (payloadToUpload.isEncrypted && payloadToUpload.fotoBase64) {
                        try {
                            const encString = atob(payloadToUpload.fotoBase64);
                            const key = String(state.user.pin || '1234');
                            let rawDecrypted = "";
                            for (let i = 0; i < encString.length; i++) {
                                rawDecrypted += String.fromCharCode(encString.charCodeAt(i) ^ key.charCodeAt(i % key.length));
                            }
                            payloadToUpload.fotoBase64 = rawDecrypted;
                            delete payloadToUpload.isEncrypted;
                        } catch (decErr) {
                            console.error("[OUTBOX] Gagal mendekripsi foto:", decErr);
                        }
                    }
                    
                    const res = await apiCall(item.tipe, payloadToUpload);
                    
                    // Hapus dari antrean (baik sukses maupun gagal permanen dari server)
                    try {
                        const delTx = localDB.transaction("OUTBOX_QUEUE", "readwrite");
                        delTx.objectStore("OUTBOX_QUEUE").delete(item.id);
                    } catch (e) { /* abaikan */ }
                    
                    if (res.success) {
                        console.log(`[OUTBOX] ✅ ${item.tipe} ID ${item.id} berhasil dikirim ke server!`);
                        showToast(`✅ Data ${item.tipe} berhasil dikirim ke server`, 'success');
                    } else {
                        console.error(`[OUTBOX] ❌ ${item.tipe} ID ${item.id} ditolak server:`, res.error);
                        showToast(`❌ Gagal sinkron ${item.tipe}: ${res.error}`, 'error');
                    }
                    
                } catch (err) {
                    // Error jaringan / timeout - kembalikan ke pending untuk dicoba lagi nanti
                    console.warn(`[OUTBOX] ⏳ Koneksi buruk, coba lagi nanti:`, err.message);
                    try {
                        item.status = "pending";
                        delete item.uploadStartedAt;
                        const resetTx = localDB.transaction("OUTBOX_QUEUE", "readwrite");
                        resetTx.objectStore("OUTBOX_QUEUE").put(item);
                    } catch (e) { /* abaikan */ }
                }
            }
        }

        function resolveFotoUrl(url) {
            if (!url || !url.trim()) return '';
            
            // Jika berupa ID Google Drive langsung (alphanumeric panjang dan tidak mengandung slash/titik)
            const isGoogleDriveId = /^[a-zA-Z0-9_-]{25,45}$/.test(url);
            if (isGoogleDriveId) {
                return `https://drive.google.com/thumbnail?sz=w1000&id=${url}`;
            }
            
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
            const audioId = 
                type === 'success' ? 'soundSuccess' : 
                type === 'error' ? 'soundError' : 
                type === 'chatsent' ? 'soundChatSent' : 
                type === 'tagalert' ? 'soundTagAlert' : 
                'soundNotif';
            const audio = document.getElementById(audioId);
            if (audio) { 
                try {
                    audio.pause();
                    audio.currentTime = 0; 
                    // Gunakan promise play untuk mencegah exception autoplay browser
                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.warn("[AUDIO] Pemutaran suara terblokir autoplay:", error);
                        });
                    }
                } catch (e) {
                    console.warn("[AUDIO] Gagal memutar audio:", e);
                }
            }
        }

        function loadFaceFinderXHR(url) {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.responseType = 'arraybuffer';
                xhr.onload = function() {
                    if ((xhr.status >= 200 && xhr.status < 300) || (xhr.status === 0 && xhr.response && xhr.response.byteLength > 0)) {
                        resolve(xhr.response);
                    } else {
                        reject(new Error(`XHR Status: ${xhr.status}`));
                    }
                };
                xhr.onerror = function() {
                    reject(new Error('XHR Network Error'));
                };
                xhr.send();
            });
        }

        async function loadFaceFinder() {
            const urls = [
                'facefinder.bin',
                'facefinder',
                'https://raw.githubusercontent.com/nenadmarkus/picojs/master/cascade/facefinder'
            ];
            
            for (let url of urls) {
                try {
                    console.log(`[FACE] Attempting to load model from: ${url}`);
                    let buffer;
                    try {
                        const response = await fetch(url);
                        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
                        buffer = await response.arrayBuffer();
                    } catch (fetchErr) {
                        console.warn(`[FACE] Fetch failed for ${url}, trying XHR:`, fetchErr.message);
                        buffer = await loadFaceFinderXHR(url);
                    }
                    
                    const bytes = new Int8Array(buffer);
                    facefinderClassifyRegion = pico.unpack_cascade(bytes);
                    console.log(`[FACE] pico.js facefinder loaded successfully from ${url}!`);
                    return;
                } catch (err) {
                    console.error(`[FACE] Failed loading from ${url}:`, err.message);
                }
            }
            
            showToast("Gagal memuat modul deteksi wajah. Fitur kotak dinamis dinonaktifkan.", "error");
        }

        // ==================== INIT ====================
        document.addEventListener('DOMContentLoaded', async () => {
            // Load face detection model
            loadFaceFinder();
            
            // Trigger Snow effects
            createSnowEffect('splashScreen');
            createSnowEffect('loginScreen');

            updateDate();
            initGPS();
            const today = new Date().toISOString().split('T')[0];
            const tglMulai = document.getElementById('izinTglMulai');
            if (tglMulai) tglMulai.value = today;
            
            // Initialize static custom select dropdowns
            makeSelectCustom('lemburKeteranganType');

            // Initialize real-time Pusher WebSockets
            initPusher();
            initChatScrollListener();
            
            // Tentukan deteksi platform Web vs APK
            state.isNativeAPK = !!window.Capacitor;
            console.log('[PLATFORM] Running in Native APK:', state.isNativeAPK);
            
            // Inisialisasi Basis Data Replikasi IndexedDB & Delta Sync
            initLocalDatabase().then(async () => {
                // Jalankan Delta Sync & Outbox schedulers
                try {
                    await triggerDeltaSync(true);
                } catch (e) {
                    console.warn('[SYNC] Delta sync awal gagal:', e);
                }
                
                // Tiered Delta Sync: Hot (15s), Warm (2min), Full (5min)
                setInterval(() => triggerDeltaSync(false, 'hot'), 15000);     // Absensi + Lembur
                setInterval(() => triggerDeltaSync(false, 'warm'), 120000);   // Izin, Jadwal, Chat, dll
                setInterval(() => triggerDeltaSync(false, 'full'), 300000);   // Semua master data
                setInterval(processOutboxQueue, 10000);
                
                // ⚡ Muat data setelah Database DIJAMIN SIAP!
                loadCachedChatMessages();
                loadChatMessages();

                // Cek localStorage login
                const saved = loadLogin();
                if (saved && saved.id) {
                    // Auto login dari localStorage
                    state.user = { id: saved.id, name: saved.name, role: saved.role, tokoDefault: saved.tokoDefault, shiftDefault: saved.shiftDefault, pin: saved.pin };
                    
                    // Auto sync to preferences if opened
                    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
                        window.Capacitor.Plugins.Preferences.set({ key: 'userId', value: String(state.user.id || '') });
                        window.Capacitor.Plugins.Preferences.set({ key: 'userRole', value: String(state.user.role || '') });
                    }
                    state.currentUser = state.user;
                    unlockAudio();
                    showApp();
                    
                    if (state.isNativeAPK) {
                        try { registerWebpushrUser(saved.id); } catch(e) { }
                        try { checkNotificationStatus(); } catch(e) { }
                    }
                    setupUserUI(saved.fotoUrl || '');
                    
                    hideSplashScreen();

                    // Panggil API secara asinkron di background (Non-blocking!)
                    loadKaryawanDropdown();
                    
                    loadTokoData().then(async () => {
                        if (state.user.tokoDefault) {
                            const selToko = document.getElementById('selectToko');
                            if (selToko) {
                                selToko.value = state.user.tokoDefault;
                                await onTokoChange();
                                const selShift = document.getElementById('selectShift');
                                if (state.user.shiftDefault && selShift) {
                                    selShift.value = state.user.shiftDefault;
                                    updateShiftInfo();
                                }
                            }
                        }
                    });
                    checkAbsenStatus();
                    updateMonthlyRecap();
                    stopCamera();
                    showCameraOverlay();
                    checkMyApprovals();
                    startChatPolling();
                } else {
                    // Jika belum login, jalankan pemuatan secara asinkron (Non-blocking!)
                    loadKaryawanDropdown().then(() => {
                        console.log('[STARTUP] loadKaryawanDropdown selesai');
                    });
                    hideSplashScreen(); // Langsung hilangkan splash screen secara instan!
                }
            }).catch(e => {
                console.warn('[DB] Gagal inisialisasi basis data lokal IndexedDB (Aplikasi berjalan dalam mode tanpa IndexedDB cache):', e);
                
                // Cek localStorage login fallback
                const saved = loadLogin();
                if (saved && saved.id) {
                    state.user = { id: saved.id, name: saved.name, role: saved.role, tokoDefault: saved.tokoDefault, shiftDefault: saved.shiftDefault, pin: saved.pin };
                    state.currentUser = state.user;
                    unlockAudio();
                    showApp();
                    setupUserUI(saved.fotoUrl || '');
                } else {
                    // Jalankan pemuatan tanpa IndexedDB
                    loadKaryawanDropdown().then(() => {
                        console.log('[STARTUP] loadKaryawanDropdown selesai (mode fallback tanpa IndexedDB)');
                    });
                }
                hideSplashScreen();
            });
            
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

        function showApp() {
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('appContent').style.display = 'block';
            
            // Sync cached FCM token if present
            const cachedToken = localStorage.getItem('cached_fcm_token') || state.fcmToken;
            if (cachedToken && state.user && state.user.id) {
                try {
                    syncFCMTokenWithServer(state.user.id, cachedToken);
                } catch (e) {
                    console.warn("[PUSH] Gagal menyinkronkan token cached:", e);
                }
            }
            
            try { initNativePushNotifications(); } catch (e) { console.warn("[PUSH] Gagal inisialisasi push native:", e); }
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
            if (fotoUrl) {
                loadImageWithCache(imgEl, fotoUrl); imgEl.style.display = 'block'; textEl.style.display = 'none';
            } else {
                textEl.textContent = (name || 'U').charAt(0).toUpperCase();
                textEl.style.display = 'flex'; imgEl.style.display = 'none';
            }
        }

        // ==================== SINGLE DEVICE LOGIN ====================
        function getDeviceId() {
            let deviceId = localStorage.getItem('absen_device_id');
            if (!deviceId) {
                // Generate a random UUID-like string
                deviceId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('absen_device_id', deviceId);
            }
            return deviceId;
        }

        // ==================== LOGIN ====================
        async function doLogin(force = false) {
            const sel = document.getElementById('loginSelect');
            const manualIdInput = document.getElementById('loginManualId');
            let id = sel ? sel.value : '';
            let name = '';
            let role = 'Staff';
            let tokoId = '';
            let shiftId = '';
            let fotoUrl = '';

            // Jika ada input manual dan diisi, gunakan itu
            if (manualIdInput && manualIdInput.value.trim() !== '') {
                id = manualIdInput.value.trim();
                name = 'Debug User (' + id + ')';
            }

            const errBox = document.getElementById('loginError');
            const btn = document.getElementById('btnLogin');

            if (!id) {
                errBox.textContent = 'Pilih nama atau ketik ID karyawan terlebih dahulu!';
                errBox.classList.add('show'); return;
            }

            if (sel && sel.value && id === sel.value) {
                const opt = sel.options[sel.selectedIndex];
                name = opt.text;
                role = opt.getAttribute('data-role') || 'Staff';
                tokoId = opt.getAttribute('data-toko') || '';
                shiftId = opt.getAttribute('data-shift') || '';
                fotoUrl = opt.getAttribute('data-foto') || '';
            }

            const enteredPin = document.getElementById('loginPin') ? document.getElementById('loginPin').value.trim() : '';
            const isManualDebug = manualIdInput && manualIdInput.value.trim() !== '';
            
            if (!isManualDebug) {
                if (!enteredPin) {
                    errBox.textContent = 'Masukkan PIN Anda terlebih dahulu!';
                    errBox.classList.add('show');
                    return;
                }
            }

            btn.disabled = true;
            btn.innerHTML = '<div class="spinner"></div> Memuat...';
            errBox.classList.remove('show');

            let verifiedUser = null;
            
            // Coba verifikasi secara offline-first menggunakan data lokal (IndexedDB yang ter-load di state.karyawanList)
            if (!isManualDebug && state.karyawanList && state.karyawanList.length > 0 && !navigator.onLine) {
                const k = state.karyawanList.find(item => String(item.ID_Karyawan) === String(id));
                if (k) {
                    const localPin = String(k.PIN === undefined || k.PIN === null ? '' : k.PIN).trim().padStart(4, '0');
                    const enteredPinClean = String(enteredPin || '').trim().padStart(4, '0');
                    if (localPin !== enteredPinClean) {
                        errBox.textContent = 'PIN yang Anda masukkan salah!';
                        errBox.classList.add('show');
                        btn.disabled = false;
                        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg> Masuk`;
                        return;
                    }
                    verifiedUser = {
                        id: k.ID_Karyawan,
                        name: k.Nama,
                        role: k.Jabatan || 'Staff',
                        tokoDefault: k.Toko_Default || '',
                        shiftDefault: k.Shift_Default || '',
                        pin: localPin,
                        fotoUrl: k.Foto_Profil || k.Foto_URL || k.fotoUrl || ''
                    };
                }
            }
            
            // Fallback ke verifikasi server jika online
            if (!verifiedUser && !isManualDebug) {
                try {
                    console.log("[AUTH] Memverifikasi ke server...");
                    const res = await apiCall('login', { 
                        idKaryawan: id, 
                        pin: enteredPin,
                        deviceId: getDeviceId(),
                        force: force
                    });
                    
                    if (res.requireDeviceConfirmation) {
                        // User exists in another device, show popup confirmation
                        Swal.fire({
                            title: 'Perhatian!',
                            text: res.message,
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#3085d6',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Ya, Lanjut Login!',
                            cancelButtonText: 'Batal'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                // Call login again with force=true
                                doLogin(true);
                            } else {
                                // Reset button state
                                btn.disabled = false;
                                btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg> Masuk`;
                            }
                        });
                        return; // Stop current flow
                    }

                    if (res.success && res.user) {
                        verifiedUser = {
                            id: res.user.id,
                            name: res.user.nama,
                            role: res.user.jabatan || 'Staff',
                            tokoDefault: res.user.tokoDefault || '',
                            shiftDefault: res.user.shiftDefault || '',
                            pin: res.user.pin,
                            fotoUrl: res.user.fotoProfil || res.user.fotoUrl || res.user.Foto_Profil || ''
                        };
                        tokoId = res.user.tokoDefault || '';
                        shiftId = res.user.shiftDefault || '';
                    } else {
                        errBox.textContent = res.error || 'PIN yang Anda masukkan salah!';
                        errBox.classList.add('show');
                        btn.disabled = false;
                        btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg> Masuk`;
                        return;
                    }
                } catch (e) {
                    errBox.textContent = 'Gagal memverifikasi ke server: ' + e.message;
                    errBox.classList.add('show');
                    btn.disabled = false;
                    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg> Masuk`;
                    return;
                }
            }

            if (isManualDebug) {
                verifiedUser = { id, name, role, tokoDefault: tokoId, shiftDefault: shiftId, pin: '0000' };
            }

            if (verifiedUser && verifiedUser.fotoUrl && !fotoUrl) {
                fotoUrl = verifiedUser.fotoUrl;
            }

            state.user = { 
                id: verifiedUser.id, 
                name: verifiedUser.name, 
                role: verifiedUser.role, 
                tokoDefault: verifiedUser.tokoDefault, 
                shiftDefault: verifiedUser.shiftDefault,
                pin: verifiedUser.pin
            };
            state.currentUser = state.user;

            // Simpan ke localStorage
            saveLogin({ 
                id: verifiedUser.id, 
                name: verifiedUser.name, 
                role: verifiedUser.role, 
                tokoDefault: verifiedUser.tokoDefault, 
                shiftDefault: verifiedUser.shiftDefault, 
                fotoUrl,
                pin: verifiedUser.pin
            });

            // Daftarkan ke Webpushr agar bisa menerima notifikasi push latar belakang
            try { registerWebpushrUser(id); } catch(e) { }
            try { checkNotificationStatus(); } catch(e) { }

            // Unlock audio context (user gesture)
            unlockAudio();

            showApp();
            setupUserUI(fotoUrl);

            // Jalankan Delta Sync pasca-login dengan blocking overlay
            try {
                await triggerDeltaSync(true);
            } catch(e) {
                console.warn('[SYNC] Delta sync pasca-login gagal:', e);
            }

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
            // Tampilkan input manual jika di luar native APK (Browser Web / Debugging)
            const manualContainer = document.getElementById('manualLoginContainer');
            if (manualContainer && !window.Capacitor) {
                manualContainer.style.display = 'block';
            }

            // Daftarkan event listener untuk loginSelect jika belum terdaftar
            const selEl = document.getElementById('loginSelect');
            if (selEl && !selEl.dataset.listenerAdded) {
                selEl.dataset.listenerAdded = 'true';
                selEl.addEventListener('change', (e) => {
                    const pinContainer = document.getElementById('pinContainer');
                    const pinInput = document.getElementById('loginPin');
                    if (e.target.value) {
                        if (pinContainer) pinContainer.style.display = 'block';
                        if (pinInput) {
                            pinInput.value = '';
                            setTimeout(() => pinInput.focus(), 100);
                        }
                    } else {
                        if (pinContainer) pinContainer.style.display = 'none';
                        if (pinInput) pinInput.value = '';
                    }
                });
            }

            const populateDropdown = (list) => {
                const sel = document.getElementById('loginSelect');
                if (!sel) return;
                state.karyawanList = list.filter(k => k.Status === 'Aktif');
                sel.innerHTML = '<option value="">Pilih Nama...</option>';
                state.karyawanList.forEach(k => {
                    const fotoUrl = k.Foto_URL || k.Foto_Profil || k.fotoUrl || '';
                    sel.innerHTML += `<option value="${k.ID_Karyawan}" data-toko="${k.Toko_Default || ''}" data-shift="${k.Shift_Default || ''}" data-role="${k.Jabatan || 'Staff'}" data-foto="${fotoUrl}">${k.Nama}</option>`;
                });
                makeSelectCustom('loginSelect');
                // Sinkronisasi/perbarui foto profil user aktif jika datanya berubah di server
                if (state.user && state.user.id) {
                    const curr = state.karyawanList.find(k => String(k.ID_Karyawan) === String(state.user.id));
                    if (curr) {
                        const newFotoUrl = curr.Foto_URL || curr.Foto_Profil || curr.fotoUrl || '';
                        setupUserUI(newFotoUrl);
                        const saved = loadLogin();
                        if (saved) {
                            saved.fotoUrl = newFotoUrl;
                            saveLogin(saved);
                        }
                    }
                }
            };

            // 1. Ambil data dari IndexedDB lokal terlebih dahulu (Instan & Offline-First!)
            try {
                if (window.localDB) {
                    const localData = await new Promise((resolve) => {
                        const tx = localDB.transaction('MASTER_KARYAWAN', 'readonly');
                        const store = tx.objectStore('MASTER_KARYAWAN');
                        const req = store.getAll();
                        req.onsuccess = () => resolve(req.result || []);
                        req.onerror = () => resolve([]);
                    });
                    if (localData && localData.length > 0) {
                        console.log('[DROPDOWN] Menggunakan cache lokal:', localData.length, 'karyawan');
                        populateDropdown(localData);
                    }
                }
            } catch (e) {
                console.warn('[DROPDOWN] Gagal memuat dari IndexedDB lokal:', e);
            }

            // 2. Tarik data teranyar dari server secara asinkron (Non-blocking!)
            try {
                const res = await apiCall('getKaryawanList');
                if (res.success && Array.isArray(res.data)) {
                    populateDropdown(res.data);
                    
                    // Simpan data terbaru ke IndexedDB lokal untuk kunjungan berikutnya
                    if (window.localDB) {
                        const tx = localDB.transaction('MASTER_KARYAWAN', 'readwrite');
                        const store = tx.objectStore('MASTER_KARYAWAN');
                        store.clear(); // Bersihkan data lama
                        res.data.forEach(k => store.put(k));
                        console.log('[DROPDOWN] Sukses meng-cache data karyawan baru ke IndexedDB!');
                    }
                }
            } catch (e) {
                console.log('[DROPDOWN] Gagal sinkronisasi data dari server:', e);
            }
        }

        // ==================== TAB SWITCHING ====================
        function switchTab(tab) {
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.getElementById('navAbsensi').classList.remove('active');
            
            const labelAbsensi = document.getElementById('labelAbsensi');
            if (labelAbsensi) labelAbsensi.style.color = 'var(--text-secondary)';

            if (tab === 'beranda') {
                document.getElementById('tabBeranda').classList.add('active');
                document.getElementById('navBeranda').classList.add('active');
                // Reset absensi photo state when navigating away to Beranda
                state.photoData = null;
                const previewImg = document.getElementById('previewImg');
                const video = document.getElementById('video');
                const retakeBtn = document.getElementById('retakeBtn');
                if (previewImg) previewImg.style.display = 'none';
                if (video) video.style.display = 'block';
                if (retakeBtn) retakeBtn.style.display = 'none';
                stopCamera();
            } else if (tab === 'absensi') {
                document.getElementById('tabAbsensi').classList.add('active');
                document.getElementById('navAbsensi').classList.add('active');
                if (labelAbsensi) labelAbsensi.style.color = 'var(--primary)';
                
                // Clear photo and ensure we start in fullscreen camera mode
                state.photoData = null;
                const previewImg = document.getElementById('previewImg');
                const video = document.getElementById('video');
                const retakeBtn = document.getElementById('retakeBtn');
                if (previewImg) previewImg.style.display = 'none';
                if (video) video.style.display = 'block';
                if (retakeBtn) retakeBtn.style.display = 'none';
                openCameraFS();
                
                // Auto-start camera after tab switch animation
                setTimeout(() => autoStartCamera(), 350);
            } else if (tab === 'data') {
                document.getElementById('tabData').classList.add('active');
                document.getElementById('navData').classList.add('active');
                // Reset absensi photo state when navigating away to Data
                state.photoData = null;
                const previewImg = document.getElementById('previewImg');
                const video = document.getElementById('video');
                const retakeBtn = document.getElementById('retakeBtn');
                if (previewImg) previewImg.style.display = 'none';
                if (video) video.style.display = 'block';
                if (retakeBtn) retakeBtn.style.display = 'none';
                stopCamera();
            }
        }

        function toggleAbsensiTab() {
            // Blokir akses menu absensi jika sudah pulang (sehari hanya bisa sekali)
            if (state.absenStatus === 'sudah_pulang') {
                tampilPicoModal('sukses', '<b>Anda sudah menyelesaikan absen hari ini! 🎉</b><br>Absen masuk dan pulang sudah tercatat.<br>Selamat beristirahat, sampai jumpa besok!', () => {
                    switchTab('beranda');
                });
                return;
            }
            
            const tabAbsensi = document.getElementById('tabAbsensi');
            if (tabAbsensi.classList.contains('active')) {
                // Already on absensi tab -> go back to beranda (close)
                switchTab('beranda');
                showToast('Kembali ke Beranda', 'info');
            } else {
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

        function openCameraFS() {
            const container = document.getElementById('cameraContainer');
            if (container) {
                container.classList.add('fullscreen');
                const captureBtn = document.getElementById('captureBtn');
                if (captureBtn) {
                    captureBtn.style.display = 'none';
                    captureBtn.classList.remove('disabled');
                }
                const retakeBtn = document.getElementById('retakeBtn');
                if (retakeBtn) retakeBtn.style.display = 'none';
            }
        }

        function closeCameraFS(event) {
            if (event) event.stopPropagation();
            const container = document.getElementById('cameraContainer');
            if (container) {
                container.classList.remove('fullscreen');
            }
            stopCamera();
            if (!state.photoData) {
                switchTab('beranda');
            }
        }

        function startFaceDetection() {
            const video = document.getElementById('video');
            const container = document.getElementById('faceBoxesContainer');
            if (!container) return;
            
            if (typeof pico !== 'undefined') {
                updateMemory = pico.instantiate_detection_memory(5);
            }

            const detectCanvas = document.createElement('canvas');
            const detectCtx = detectCanvas.getContext('2d');
            const dWidth = 320;
            const dHeight = 240;
            detectCanvas.width = dWidth;
            detectCanvas.height = dHeight;
            
            const imagePixels = new Uint8Array(dWidth * dHeight);

            if (faceDetectionInterval) clearInterval(faceDetectionInterval);
            
            let stableFaceFrames = 0;
            const cameraStartTime = Date.now();
            const cameraWarmupDuration = 3000; // 3 seconds camera warmup/delay to stabilize focus/exposure
            
            faceDetectionInterval = setInterval(() => {
                if (!video || video.paused || video.ended || !facefinderClassifyRegion) {
                    return;
                }
                
                const helpText = document.getElementById('cameraFSHelpText');
                
                detectCtx.drawImage(video, 0, 0, dWidth, dHeight);
                const imgData = detectCtx.getImageData(0, 0, dWidth, dHeight);
                const rgba = imgData.data;
                
                for (let i = 0; i < dWidth * dHeight; i++) {
                    imagePixels[i] = (2 * rgba[i*4] + 7 * rgba[i*4+1] + rgba[i*4+2]) / 10;
                }

                const imageParams = {
                    "pixels": imagePixels,
                    "nrows": dHeight,
                    "ncols": dWidth,
                    "ldim": dWidth
                };
                
                const runParams = {
                    "shiftfactor": 0.1,
                    "minsize": 40,
                    "maxsize": 1000,
                    "scalefactor": 1.1
                };

                let detections = pico.run_cascade(imageParams, facefinderClassifyRegion, runParams);
                detections = pico.cluster_detections(detections, 0.2);
                
                if (updateMemory) {
                    detections = updateMemory(detections);
                    detections = pico.cluster_detections(detections, 0.2);
                }
                // Lowered threshold to 8.5 to detect side-lit or partially shadowed faces reliably
                const validDets = detections.filter(det => det[3] > 8.5);
                
                const anyOccluded = renderFaceBoxes(validDets, dWidth, dHeight, detectCtx);
                
                if (validDets.length > 0 && !anyOccluded) {
                    stableFaceFrames++;
                    
                    if (helpText) {
                        helpText.innerText = `📸 Wajah terdeteksi! Mengambil foto...`;
                        helpText.style.color = "#34C759";
                        helpText.style.textShadow = "0 2px 4px rgba(0,0,0,0.8)";
                    }
                    
                    const elapsed = Date.now() - cameraStartTime;
                    if (stableFaceFrames >= 5 && elapsed >= 3000) { // ~400ms stable green box, and 3s minimum warmup passed
                        if (faceDetectionInterval) {
                            clearInterval(faceDetectionInterval);
                            faceDetectionInterval = null;
                        }
                        console.log("[AUTO-CAPTURE] Face stable and 3s elapsed. Triggering capture...");
                        capturePhoto();
                    }
                } else {
                    stableFaceFrames = 0;
                }
            }, 80);
        }

        function checkFaceOcclusion(ctx, c, r, s) {
            if (!ctx) return false;
            
            // Calculate unclipped sampling regions based on actual face scale
            const upperYStart = r - s/2 + s * 0.15;
            const upperYEnd = r - s/2 + s * 0.35;
            const lowerYStart = r - s/2 + s * 0.60;
            const lowerYEnd = r - s/2 + s * 0.85;
            const xStart = c - s/2 + s * 0.20;
            const xEnd = c - s/2 + s * 0.80;
            
            // Clip to canvas boundaries (320x240)
            const safeUpperYStart = Math.max(0, Math.min(239, Math.floor(upperYStart)));
            const safeUpperYEnd = Math.max(0, Math.min(239, Math.floor(upperYEnd)));
            const safeLowerYStart = Math.max(0, Math.min(239, Math.floor(lowerYStart)));
            const safeLowerYEnd = Math.max(0, Math.min(239, Math.floor(lowerYEnd)));
            const safeXStart = Math.max(0, Math.min(319, Math.floor(xStart)));
            const safeXEnd = Math.max(0, Math.min(319, Math.floor(xEnd)));
            
            const upperHeight = safeUpperYEnd - safeUpperYStart;
            const lowerHeight = safeLowerYEnd - safeLowerYStart;
            const sampleWidth = safeXEnd - safeXStart;
            
            if (upperHeight < 2 || lowerHeight < 2 || sampleWidth < 2) {
                // Too close or too far off-screen, skip occlusion checks to prevent false positives
                return false;
            }
            
            let upperR = 0, upperG = 0, upperB = 0, upperCount = 0;
            let lowerR = 0, lowerG = 0, lowerB = 0, lowerCount = 0;
            
            try {
                // Get pixels for the upper region
                const upperData = ctx.getImageData(safeXStart, safeUpperYStart, sampleWidth, upperHeight).data;
                for (let i = 0; i < upperData.length; i += 4) {
                    upperR += upperData[i];
                    upperG += upperData[i+1];
                    upperB += upperData[i+2];
                    upperCount++;
                }
                
                // Get pixels for the lower region
                const lowerData = ctx.getImageData(safeXStart, safeLowerYStart, sampleWidth, lowerHeight).data;
                for (let i = 0; i < lowerData.length; i += 4) {
                    lowerR += lowerData[i];
                    lowerG += lowerData[i+1];
                    lowerB += lowerData[i+2];
                    lowerCount++;
                }
            } catch (e) {
                console.error("Error sampling face pixels:", e);
                return false;
            }
            
            if (upperCount === 0 || lowerCount === 0) return false;
            
            const avgUpperR = upperR / upperCount;
            const avgUpperG = upperG / upperCount;
            const avgUpperB = upperB / upperCount;
            
            const avgLowerR = lowerR / lowerCount;
            const avgLowerG = lowerG / lowerCount;
            const avgLowerB = lowerB / lowerCount;
            
            // Euclidean distance in RGB color space
            const colorDist = Math.sqrt(
                Math.pow(avgUpperR - avgLowerR, 2) +
                Math.pow(avgUpperG - avgLowerG, 2) +
                Math.pow(avgUpperB - avgLowerB, 2)
            );
            
            // Brightness (Luma) formula: Y = 0.299R + 0.587G + 0.114B
            const upperBright = 0.299 * avgUpperR + 0.587 * avgUpperG + 0.114 * avgUpperB;
            const lowerBright = 0.299 * avgLowerR + 0.587 * avgLowerG + 0.114 * avgLowerB;
            
            // Check for blue/green medical mask (common)
            // Relaxes matching threshold to avoid false alerts under cold/warm indoor lighting
            const isMedicalMask = (avgLowerB > avgLowerR + 15) || (avgLowerG > avgLowerR + 25);
            
            // Check for black/dark mask (brightness difference > 70 luma levels)
            const isDarkMask = (upperBright - lowerBright) > 70;
            
            // Check for white/light mask (brightness difference > 70 luma levels)
            const isWhiteMask = (lowerBright - upperBright) > 70;
            
            // General color shift (increased from 30 to 65 to be more lenient on lighting/shadows)
            const isColorShift = colorDist > 65;
            
            if (isMedicalMask || isDarkMask || isWhiteMask || isColorShift) {
                console.log(`[OCCLUSION DETECTED] colorDist: ${colorDist.toFixed(1)}, upperBr: ${upperBright.toFixed(1)}, lowerBr: ${lowerBright.toFixed(1)}, medMask: ${isMedicalMask}`);
                return true;
            }
            
            return false;
        }

        function renderFaceBoxes(dets, dWidth, dHeight, detectCtx) {
            const container = document.getElementById('faceBoxesContainer');
            const video = document.getElementById('video');
            const helpText = document.getElementById('cameraFSHelpText');
            if (!container || !video) return;
            container.innerHTML = '';
            
            if (dets.length === 0) {
                // Generate 3 confused red boxes scattered randomly
                for (let i = 0; i < 3; i++) {
                    const box = document.createElement('div');
                    box.className = 'confused-box';
                    
                    // Generate random positions (in percentages) and sizes
                    const w = Math.floor(Math.random() * 60) + 50;  // 50px to 110px
                    const h = Math.floor(Math.random() * 60) + 50;  // 50px to 110px
                    const x = Math.floor(Math.random() * 80);        // 0% to 80%
                    const y = Math.floor(Math.random() * 80);        // 0% to 80%
                    
                    box.style.width = `${w}px`;
                    box.style.height = `${h}px`;
                    box.style.left = `${x}%`;
                    box.style.top = `${y}%`;
                    
                    const errCodes = ["NO_FACE", "SCAN_ERR", "RETRYING", "FACE_LOST", "SYS_SRCH", "ALIGN_ERR", "ERR_109", "ERR_404"];
                    const randomCode = errCodes[Math.floor(Math.random() * errCodes.length)];
                    box.setAttribute('data-code', randomCode);
                    
                    container.appendChild(box);
                }
            }
            // Get actual dimensions of the video element (viewport size)
            const rect = video.getBoundingClientRect();
            const containerWidth = rect.width;
            const containerHeight = rect.height;
            if (!containerWidth || !containerHeight) return;
            
            // Get intrinsic dimensions of the video stream
            const videoWidth = video.videoWidth;
            const videoHeight = video.videoHeight;
            if (!videoWidth || !videoHeight) return;
            
            // Calculate scale factor matching object-fit: cover
            const scale = Math.max(containerWidth / videoWidth, containerHeight / videoHeight);
            
            // Calculate actual rendered dimensions of the video inside container
            const renderedWidth = videoWidth * scale;
            const renderedHeight = videoHeight * scale;
            
            // Calculate offset crops
            const offsetX = (containerWidth - renderedWidth) / 2;
            const offsetY = (containerHeight - renderedHeight) / 2;
            
            let anyOccluded = false;
            
            dets.forEach(det => {
                const [r, c, s, q] = det;
                
                // Detect occlusion (mask, glasses, hat, etc.)
                const isOccluded = checkFaceOcclusion(detectCtx, c, r, s);
                if (isOccluded) {
                    anyOccluded = true;
                }
                
                const box = document.createElement('div');
                box.className = 'face-track-box active';
                if (isOccluded) {
                    box.classList.add('occluded');
                }
                
                // 1. Calculate face center in normalized coordinates (0.0 to 1.0)
                const normCenterX = c / dWidth;
                const normCenterY = r / dHeight;
                
                // 2. Mirror the X coordinate because the video is mirrored (scaleX(-1))
                const normCenterXMirrored = 1 - normCenterX;
                
                // 3. Calculate box size in the rendered video area (based on width scale)
                const boxSize = (s / dWidth) * renderedWidth;
                
                // 4. Map the center coordinates to the rendered video area
                const centerX = normCenterXMirrored * renderedWidth;
                const centerY = normCenterY * renderedHeight;
                
                // 5. Calculate top-left corner of the square box centered at (centerX, centerY)
                const xInRendered = centerX - boxSize / 2;
                const yInRendered = centerY - boxSize / 2;
                
                // 6. Add offsets to get coordinates relative to the container
                const finalX = xInRendered + offsetX;
                const finalY = yInRendered + offsetY;
                const finalSize = boxSize;
                
                // Apply precise inline styles in pixels
                box.style.left = `${finalX}px`;
                box.style.top = `${finalY}px`;
                box.style.width = `${finalSize}px`;
                box.style.height = `${finalSize}px`;
                
                container.appendChild(box);
            });
            
            // Update help text style and text based on occlusion state
            if (helpText) {
                if (anyOccluded) {
                    helpText.innerText = "⚠️ Harap lepas kacamata, topi, atau masker Anda!";
                    helpText.style.color = "#FF3B30";
                    helpText.style.textShadow = "0 2px 4px rgba(0,0,0,0.8)";
                } else {
                    helpText.innerText = "Dilarang menggunakan kacamata, topi, atau masker yang menutupi wajah!";
                    helpText.style.color = "#FFFFFF";
                    helpText.style.textShadow = "0 2px 4px rgba(0,0,0,0.5)";
                }
            }
            return anyOccluded;
        }


        // Auto-start camera when tab opens - no manual button needed
        async function autoStartCamera() {
            // Small delay to let previous stream fully release
            await new Promise(r => setTimeout(r, 400));
            try {
                if (!state.photoData) {
                    openCameraFS();
                }
                await startCameraStream();
                hideCameraOverlay();
                startFaceDetection();
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
                        startFaceDetection();
                    } catch (err2) {
                        showCameraError('Kamera sedang dipakai aplikasi lain.');
                    }
                }
                else showCameraError('Gagal: ' + err.message);
            }
        }

        function stopCamera() {
            if (faceDetectionInterval) {
                clearInterval(faceDetectionInterval);
                faceDetectionInterval = null;
            }
            const container = document.getElementById('faceBoxesContainer');
            if (container) container.innerHTML = '';

            if (state.stream) {
                state.stream.getTracks().forEach(t => { t.stop(); });
                state.stream = null;
            }
            const video = document.getElementById('video');
            if (video) {
                video.classList.remove('playing');
                video.srcObject = null;
                video.pause();
                video.load(); // Force release
            }
            const loadingOverlay = document.getElementById('cameraLoadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.classList.remove('fade-out');
                loadingOverlay.style.display = 'none';
            }
            // Don't show "Kamera mati" text since we removed faceLabel
            document.getElementById('faceFrame').classList.remove('active');
        }

        async function startCameraStream() {
            const video = document.getElementById('video');
            stopCamera();
            
            const container = document.getElementById('cameraContainer');
            if (container) container.classList.remove('hidden');

            // Ensure video element is fully reset
            video.style.display = 'block';
            video.removeAttribute('src');

            const loadingOverlay = document.getElementById('cameraLoadingOverlay');
            if (loadingOverlay) {
                loadingOverlay.classList.remove('fade-out');
                loadingOverlay.style.display = 'flex';
            }

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
                const onPlaying = () => {
                    video.classList.add('playing');
                    if (loadingOverlay) {
                        loadingOverlay.classList.add('fade-out');
                        setTimeout(() => {
                            if (loadingOverlay.classList.contains('fade-out')) {
                                loadingOverlay.style.display = 'none';
                            }
                        }, 300);
                    }
                    resolve();
                };
                video.onplaying = onPlaying;
                const onLoaded = () => {
                    video.play().catch(reject);
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
            ctx.translate(canvas.width, 0); ctx.scale(-1, 1); ctx.drawImage(video, 0, 0, w, h);
            state.photoData = canvas.toDataURL('image/jpeg', 0.6);
            preview.src = state.photoData; preview.style.display = 'block';
            
            const container = document.getElementById('cameraContainer');
            if (container) {
                container.classList.remove('fullscreen');
            }
            
            video.style.display = 'none'; 
            document.getElementById('retakeBtn').style.display = 'block';
            document.getElementById('captureBtn').style.display = 'none';
            stopCamera();
            showToast('Foto berhasil diambil', 'success'); playSound('success');
        }

        function retakePhoto() {
            document.getElementById('previewImg').style.display = 'none';
            document.getElementById('video').style.display = 'block';
            document.getElementById('retakeBtn').style.display = 'none';
            state.photoData = null;
            stopCamera();
            openCameraFS();
            // Auto-restart camera after retake
            setTimeout(() => autoStartCamera(), 300);
        }

        function tutupKameraSelesaiAbsen() {
            state.photoData = null;
            document.getElementById('previewImg').style.display = 'none';
            document.getElementById('previewImg').src = '';
            document.getElementById('retakeBtn').style.display = 'none';
            
            // Sembunyikan container kamera dan overlay fullscreen
            document.getElementById('cameraOverlay').classList.add('hidden');
            const container = document.getElementById('cameraContainer');
            if (container) container.classList.remove('fullscreen');
            container.classList.add('hidden'); // Sembunyikan sama sekali agar hemat batre
            
            // Stop kamera sepenuhnya
            stopCamera();
        }

        // ==================== GPS ====================
        function parseKoordinat(val) {
            if (!val) return NaN;
            let str = String(val).trim();
            
            // Hapus tanda kutip tunggal/ganda (misal dari sheet format text)
            str = str.replace(/['"]/g, '');
            
            // Ganti koma dengan titik untuk standarisasi
            str = str.replace(/,/g, '.');
            
            // Jika ada lebih dari satu titik (misal -7.500.185), pertahankan yang pertama saja
            const parts = str.split('.');
            if (parts.length > 2) {
                str = parts[0] + '.' + parts.slice(1).join('');
            }
            
            return parseFloat(str);
        }

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
                    if (toko) {
                        if (!toko.Lat || !toko.Long) {
                            badge.className = 'gps-badge bad'; text.textContent = 'GPS Toko Kosong'; return;
                        }
                        const tLat = parseKoordinat(toko.Lat);
                        const tLng = parseKoordinat(toko.Long);
                        const tRad = parseKoordinat(toko.Radius_M) || 50;
                        
                        if (isNaN(tLat) || isNaN(tLng)) {
                            badge.className = 'gps-badge bad'; text.textContent = 'Format GPS Toko Salah'; return;
                        }

                        const jarak = hitungJarak(state.gps.lat, state.gps.lng, tLat, tLng);
                        state.gps.jarak = Math.round(jarak);
                        
                        if (jarak <= tRad) { 
                            badge.className = 'gps-badge ok'; 
                            text.textContent = `${Math.round(jarak)}m - Lokasi Sesuai`; 
                        } else { 
                            badge.className = 'gps-badge bad'; 
                            text.textContent = `${Math.round(jarak)}m - Jauh (Batas ${tRad}m)`; 
                        }
                    } else {
                        badge.className = 'gps-badge bad'; text.textContent = `Pilih Toko Dulu`;
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
            const handleData = (res) => {
                if (res.success && Array.isArray(res.data)) {
                    state.tokoList = res.data.filter(t => t.Status === 'Aktif');
                    const sel = document.getElementById('selectToko');
                    if (sel) {
                        sel.innerHTML = '<option value="">Pilih...</option>';
                        state.tokoList.forEach(t => { sel.innerHTML += `<option value="${t.ID_Toko}">${t.Nama_Toko}</option>`; });
                        makeSelectCustom('selectToko');
                    }
                    const selLembur = document.getElementById('lemburToko');
                    if (selLembur) {
                        selLembur.innerHTML = '';
                        state.tokoList.forEach(t => { selLembur.innerHTML += `<option value="${t.ID_Toko}">${t.Nama_Toko}</option>`; });
                        makeSelectCustom('lemburToko');
                    }
                }
            };
            try {
                await cachedApiCall('getTokoList', {}, handleData);
            } catch (e) { console.log('loadTokoData error:', e); }
        }

        async function onTokoChange() {
            const tokoId = document.getElementById('selectToko').value;
            const shiftSel = document.getElementById('selectShift');
            if (!tokoId) { 
                shiftSel.innerHTML = '<option value="">Pilih...</option>'; 
                makeSelectCustom('selectShift');
                updateShiftInfo(); 
                return; 
            }
            
            const handleData = (res) => {
                if (res.success && Array.isArray(res.data)) {
                    state.shiftList = res.data;
                    shiftSel.innerHTML = '<option value="">Pilih...</option>';
                    res.data.forEach(s => {
                        const jm = formatTimeFromResponse(s.Jam_Masuk);
                        const jp = formatTimeFromResponse(s.Jam_Pulang);
                        shiftSel.innerHTML += `<option value="${s.ID_Shift}">${s.Nama_Shift} (${jm} - ${jp})</option>`;
                    });
                    if (state.user.shiftDefault) { const ex = res.data.some(s => s.ID_Shift === state.user.shiftDefault); if (ex) shiftSel.value = state.user.shiftDefault; }
                    makeSelectCustom('selectShift');
                    updateShiftInfo();
                }
            };
            try {
                await cachedApiCall('getShiftByToko', { idToko: tokoId }, handleData);
            } catch (e) { console.log('onTokoChange error:', e); }
            initGPS();
            updateTokoCardInfo();
        }

        function updateShiftInfo() {
            const tokoId = document.getElementById('selectToko').value;
            const shiftId = document.getElementById('selectShift').value;
            const toko = state.tokoList ? state.tokoList.find(t => t.ID_Toko === tokoId) : null;
            const shift = state.shiftList ? state.shiftList.find(s => s.ID_Shift === shiftId) : null;
            
            const infoNamaTokoEl = document.getElementById('infoNamaToko');
            if (infoNamaTokoEl) {
                infoNamaTokoEl.textContent = toko ? toko.Nama_Toko : 'Umum';
            }
            
            if (shift) {
                document.getElementById('jamInfoCard').classList.remove('hidden');
                const jamMasuk = formatTimeFromResponse(shift.Jam_Masuk);
                const jamPulang = formatTimeFromResponse(shift.Jam_Pulang);
                document.getElementById('infoJamMasuk').textContent = 'Masuk: ' + jamMasuk;
                document.getElementById('infoJamPulang').textContent = 'Pulang: ' + jamPulang;
                document.getElementById('shiftNama').textContent = (shift.Nama_Shift || 'Reguler') + ' - ' + jamMasuk + ' - ' + jamPulang;
            } else {
                document.getElementById('jamInfoCard').classList.remove('hidden');
                document.getElementById('infoJamMasuk').textContent = 'Masuk: --:--';
                document.getElementById('infoJamPulang').textContent = 'Pulang: --:--';
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
            
            let isLemburDisabled = false;
            const hasSubmittedLembur = state.lemburStatus === 'Pending' || state.lemburStatus === 'Approved';
            
            if (state.absenStatus === 'belum_masuk') {
                bm.classList.remove('hidden');
                bp.classList.add('hidden');
                bl.classList.remove('hidden');
                isLemburDisabled = true;
                bl.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> MODE LEMBUR (BELUM ABSEN)`;
            } else if (state.absenStatus === 'sudah_masuk') {
                bm.classList.add('hidden');
                bp.classList.remove('hidden');
                
                if (hasSubmittedLembur) {
                    bl.classList.add('hidden');
                } else {
                    bl.classList.remove('hidden');
                    isLemburDisabled = false;
                    bl.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> AJUKAN LEMBUR`;
                }
            } else if (state.absenStatus === 'sudah_pulang') {
                bm.classList.add('hidden');
                bp.classList.add('hidden');
                bl.classList.add('hidden');
                isLemburDisabled = true;
            } else {
                bm.classList.add('hidden');
                bp.classList.add('hidden');
                bl.classList.add('hidden');
            }
            
            bl.disabled = isLemburDisabled;
            
            if (ml) {
                if (isLemburDisabled || hasSubmittedLembur) {
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
            if (toko) {
                if (!toko.Lat || !toko.Long) {
                    tampilPicoModal('gps_jauh', 'Koordinat GPS Toko belum diatur di sistem (Sheet MASTER_TOKO kolom D & E). Hubungi Admin.');
                    return;
                }
                const tLat = parseKoordinat(toko.Lat);
                const tLng = parseKoordinat(toko.Long);
                
                if (isNaN(tLat) || isNaN(tLng)) {
                    tampilPicoModal('gps_jauh', 'Format koordinat GPS toko salah. Hubungi Admin.');
                    return;
                }

                if (state.gps.lat === null || state.gps.lng === null) {
                    showToast('Menunggu lokasi GPS Anda... Pastikan GPS menyala.', 'error');
                    return;
                }
                const jarak = hitungJarak(state.gps.lat, state.gps.lng, tLat, tLng);
                const radius = parseKoordinat(toko.Radius_M) || 50;
                if (jarak > radius) { 
                    tampilPicoModal('gps_jauh', `<b>Terlalu Jauh!</b><br>Anda berjarak ${Math.round(jarak)} meter dari toko.<br>Batas toleransi adalah ${radius} meter.<br><br>Silakan mendekat ke lokasi toko.`); 
                    return; 
                }
            }

            const shiftSelect = document.getElementById('selectShift');
            const shiftName = shiftSelect.options[shiftSelect.selectedIndex].text.split(' (')[0];
            const btn = document.getElementById('btnMasuk');
            btn.disabled = true; btn.innerHTML = '<div class="spinner"></div> Memproses...';

            // Kompres & Enkripsi foto lokal, simpan ke Outbox (Instant 0-delay UI!)
            kompresSelfie(state.photoData, async (compressedBase64) => {
                const encryptedPhoto = enkripsiDekripsiFoto(compressedBase64, state.user.pin || '1234');
                const now = new Date();
                const localJam = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
                
                const payload = {
                    idKaryawan: state.user.id, nama: state.user.name,
                    idToko: document.getElementById('selectToko').value, namaToko: toko ? toko.Nama_Toko : '',
                    idShift: document.getElementById('selectShift').value, namaShift: shiftName,
                    fotoBase64: encryptedPhoto, lat: state.gps.lat, lng: state.gps.lng,
                    isEncrypted: true
                };
                
                try {
                    await addToOutbox('absenMasuk', payload);
                    
                    state.absenStatus = 'sudah_masuk'; 
                    updateButtonVisibility();
                    
                    tampilPicoModal('sukses', `<b>Absen Masuk Berhasil!</b><br>Jam: ${localJam}<br>Status: Ontime (Local)`, () => {
                        switchTab('beranda');
                    });
                    document.getElementById('statusMasuk').textContent = 'Masuk: ' + localJam;
                    document.getElementById('statusMasuk').className = 'status-masuk-capsule ok';
                    
                    tutupKameraSelesaiAbsen();
                    processOutboxQueue();
                } catch (e) {
                    tampilPicoModal('error', 'Gagal menyimpan absen lokal: ' + e.message);
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> ABSEN MASUK`;
                }
            });
        }

        async function absenPulang() {
            if (!state.photoData) { tampilPicoModal('wajah_gagal', 'Ambil foto selfie dulu ya!'); return; }
            if (!state.user || !state.user.id) { showToast('Login dulu!', 'error'); return; }

            // Validasi GPS untuk Absen Pulang
            if (state.gps.lat === null || state.gps.lng === null) {
                showToast('Koordinat GPS belum dimuat! Nyalakan GPS Anda dan tunggu sebentar.', 'error');
                return;
            }
            
            // Jarak ke Toko Asal Absen Masuk (Atau toko yang sedang dipilih jika state.absenTokoId kosong)
            let jarakAsal = Infinity;
            let radiusAsal = 50;
            const fallbackTokoId = document.getElementById('selectToko').value;
            const targetTokoId = state.absenTokoId || fallbackTokoId;
            
            const asalToko = state.tokoList.find(t => t.ID_Toko === targetTokoId);
            if (asalToko) {
                if (!asalToko.Lat || !asalToko.Long) {
                    tampilPicoModal('gps_jauh', 'Koordinat GPS Toko belum diatur di sistem. Hubungi Admin.');
                    return;
                }
                const tLat = parseKoordinat(asalToko.Lat);
                const tLng = parseKoordinat(asalToko.Long);
                
                if (!isNaN(tLat) && !isNaN(tLng)) {
                    jarakAsal = hitungJarak(state.gps.lat, state.gps.lng, tLat, tLng);
                    radiusAsal = parseKoordinat(asalToko.Radius_M) || 50;
                }
            }
            
            // Jarak ke Toko Lembur (jika ada lembur yang DISETUJUI / Approved)
            let jarakLembur = Infinity;
            let radiusLembur = 50;
            let lemburToko = null;
            const isLemburApproved = state.lemburStatus === 'Approved';
            
            if (isLemburApproved && state.lemburTokoId) {
                lemburToko = state.tokoList.find(t => t.ID_Toko === state.lemburTokoId);
                if (lemburToko && lemburToko.Lat && lemburToko.Long) {
                    const tLatL = parseKoordinat(lemburToko.Lat);
                    const tLngL = parseKoordinat(lemburToko.Long);
                    if (!isNaN(tLatL) && !isNaN(tLngL)) {
                        jarakLembur = hitungJarak(state.gps.lat, state.gps.lng, tLatL, tLngL);
                        radiusLembur = parseKoordinat(lemburToko.Radius_M) || 50;
                    }
                }
            }
            
            const isNearAsal = jarakAsal <= radiusAsal;
            const isNearLembur = isLemburApproved && (jarakLembur <= radiusLembur);
            
            if (!isNearAsal && !isNearLembur) {
                let msg = `<b>Terlalu Jauh!</b><br><br>Anda berada di luar radius toleransi toko:<br>`;
                if (asalToko) {
                    msg += `- <b>${Math.round(jarakAsal)}m</b> dari Toko Asal (Batas: ${radiusAsal}m)<br>`;
                }
                if (isLemburApproved && lemburToko) {
                    msg += `- <b>${Math.round(jarakLembur)}m</b> dari Toko Lembur (Batas: ${radiusLembur}m)<br>`;
                }
                msg += `<br><span style="color:#E53935;font-weight:800;">Silakan mendekat ke lokasi toko!</span>`;
                tampilPicoModal('gps_jauh', msg);
                return;
            }

            const btn = document.getElementById('btnPulang');
            btn.disabled = true; btn.innerHTML = '<div class="spinner"></div> Memproses...';
            
            // Kompres & Enkripsi foto lokal, simpan ke Outbox (Instant clock-out!)
            kompresSelfie(state.photoData, async (compressedBase64) => {
                const encryptedPhoto = enkripsiDekripsiFoto(compressedBase64, state.user.pin || '1234');
                const now = new Date();
                const localJam = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
                
                const payload = {
                    idKaryawan: state.user.id, nama: state.user.name,
                    fotoBase64: encryptedPhoto, lat: state.gps.lat, lng: state.gps.lng,
                    isEncrypted: true
                };
                
                try {
                    await addToOutbox('absenPulang', payload);
                    
                    state.absenStatus = 'sudah_pulang';
                    updateButtonVisibility();
                    
                    tampilPicoModal('izin_pulang', `<b>Absen Pulang Berhasil!</b><br>Jam: ${localJam}`, () => {
                        switchTab('beranda');
                    });
                    document.getElementById('statusPulang').textContent = 'Pulang: ' + localJam;
                    document.getElementById('statusPulang').className = 'status-pulang-capsule ok';
                    
                    tutupKameraSelesaiAbsen();
                    processOutboxQueue();
                } catch (e) {
                    tampilPicoModal('error', 'Gagal menyimpan absen lokal: ' + e.message);
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> ABSEN PULANG`;
                }
            });
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
                    await checkAbsenStatus();
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
            
            const handleData = (res) => {
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
            };
            
            try {
                await cachedApiCall('getJenisIzinAktif', { idKaryawan: state.user.id }, handleData);
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
                const refDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
                
                const handleData = (res) => {
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
                };
                
                await cachedApiCall('getJadwalMingguan', { idKaryawan: state.user.id, tanggalReferensi: refDate }, handleData);
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
                
                const handleData = (res) => {
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
                                    ? `<div class="photo-circle-wrapper" onclick="viewPhoto('${resolvedFotoMasuk}')"><img class="cacheable-img" data-src="${d.fotoMasuk}" alt="Check In"></div>`
                                    : `<div class="photo-circle-wrapper"><div class="photo-placeholder">👤</div></div>`;
                                    
                                const fotoPulangHtml = resolvedFotoPulang
                                    ? `<div class="photo-circle-wrapper" onclick="viewPhoto('${resolvedFotoPulang}')"><img class="cacheable-img" data-src="${d.fotoPulang}" alt="Check Out"></div>`
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
                                                    <img class="cacheable-img" data-src="${leave.lampiranUrl}" alt="Lampiran" style="width: 100%; height: 100%; object-fit: cover;">
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
                        
                        // Caching and rendering the local images using loadImageWithCache
                        tbody.querySelectorAll('.cacheable-img').forEach(img => {
                            loadImageWithCache(img, img.getAttribute('data-src'));
                        });
                    }
                };
                
                await cachedApiCall('getRaportBulanan', { idKaryawan: state.user.id, bulan: currentMonth + 1, tahun: currentYear }, handleData);
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
                state.chatLastReadId = localStorage.getItem('chatLastReadId') || '';
                state.hasShownNewMessagesDivider = false;
                
                loadCachedChatMessages().then(() => {
                    // Restore posisi scroll ke elemen spesifik jika ada
                    if (state._chatScrollSaved && state._lastVisibleChatId) {
                        renderChat(false);
                        const applyScroll = () => {
                            const msgEl = document.getElementById(state._lastVisibleChatId);
                            const container = document.getElementById('chatMessages');
                            if (msgEl && container) {
                                container.scrollTop = msgEl.offsetTop - container.offsetTop;
                                try { msgEl.scrollIntoView({ behavior: 'instant', block: 'start' }); } catch(e) {}
                            }
                        };
                        setTimeout(applyScroll, 50);
                        setTimeout(applyScroll, 350); // Setelah animasi modal selesai
                        state._chatScrollSaved = false;
                    } else {
                        renderChat(true);
                    }
    
                    loadChatMessages(); 
                    startChatPolling(); 
                });
                
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
        function getTopVisibleChatId() {
            const container = document.getElementById('chatMessages');
            if (!container) return null;
            
            const containerRect = container.getBoundingClientRect();
            const messages = container.querySelectorAll('[id^="chat-msg-"]');
            
            for (let i = 0; i < messages.length; i++) {
                const rect = messages[i].getBoundingClientRect();
                // Find first message that is visible at the top of the viewport
                if (rect.top >= containerRect.top - 30) {
                    return messages[i].id;
                }
            }
            return null;
        }

        function closeModal(id) {
            document.getElementById(id).classList.remove('active');
            document.body.style.overflow = '';
            if (id === 'modalChat') {
                // Simpan elemen chat spesifik yang sedang dilihat
                const visibleId = getTopVisibleChatId();
                if (visibleId) {
                    state._lastVisibleChatId = visibleId;
                    state._chatScrollSaved = true;
                }
                startChatPolling(); // Transisi ke polling latar belakang lambat
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
        
        function updateChatBadgeState(count) {
            const badge = document.getElementById('badgeChat');
            const badgeBottom = document.getElementById('badgeChatBottom');
            if (count > 0) {
                const text = count > 99 ? '99+' : count;
                if (badge) {
                    badge.textContent = text;
                    badge.classList.remove('hidden');
                }
                if (badgeBottom) {
                    badgeBottom.textContent = ''; // Cukup nyala merah berdenyut saja, tanpa angka!
                    badgeBottom.classList.remove('hidden');
                }
            } else {
                if (badge) badge.classList.add('hidden');
                if (badgeBottom) badgeBottom.classList.add('hidden');
            }
        }

        function updateChatActiveUsersHeader() {
            const headerEl = document.getElementById('chatActiveUsers');
            if (!headerEl || !state.user) return;

            // Hanya tampilkan orang yang kirim pesan dalam 5 menit terakhir
            const activeNames = [];
            const now = new Date();
            const seen = new Set();
            
            if (chatMessages && chatMessages.length > 0) {
                // Loop dari belakang untuk dapat yang terbaru
                for (let i = chatMessages.length - 1; i >= 0; i--) {
                    const m = chatMessages[i];
                    if (!m.nama || !m.idKaryawan) continue;
                    if (seen.has(m.idKaryawan)) continue;
                    seen.add(m.idKaryawan);
                    
                    const mDate = safeParseDate(m.waktu);
                    if (mDate) {
                        const diffMins = (now - mDate) / 60000;
                        if (diffMins < 5) {
                            const shortName = String(m.idKaryawan) === String(state.user.id) ? 'Anda' : m.nama.split(' ')[0];
                            if (!activeNames.includes(shortName)) {
                                activeNames.push(shortName);
                            }
                        }
                    }
                }
            }

            if (activeNames.length === 0) {
                headerEl.innerHTML = 'Obrolan Grup';
            } else {
                let displayText = 'Aktif: ' + activeNames.join(', ');
                if (displayText.length > 30) {
                    displayText = displayText.substring(0, 27) + '...';
                }
                headerEl.innerHTML = displayText;
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
        let chatCameraFacing = 'environment'; // 'user' = depan, 'environment' = belakang

        let chatPollTimeout = null;

        // Scientific WhatsApp-style read tracking & red dot badge management
        function checkUnreadChatState() {
            if (!chatMessages || chatMessages.length === 0 || !state.user || !state.user.id) {
                updateChatBadgeState(0);
                return;
            }
            const lastReadId = localStorage.getItem('chatLastReadId') || '';
            if (!lastReadId) {
                const count = chatMessages.filter(m => String(m.idKaryawan) !== String(state.user.id)).length;
                updateChatBadgeState(count);
                return;
            }
            const lastReadIndex = chatMessages.findIndex(m => m.idPesan === lastReadId);
            if (lastReadIndex === -1) {
                const count = chatMessages.filter(m => String(m.idKaryawan) !== String(state.user.id)).length;
                updateChatBadgeState(count);
                return;
            }
            const count = chatMessages.slice(lastReadIndex + 1).filter(m => String(m.idKaryawan) !== String(state.user.id)).length;
            updateChatBadgeState(count);
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
            // Disabled. Data disimpan langsung ke IndexedDB saat loadChatMessages atau getDeltas.
        }

        async function loadCachedChatMessages() {
            try {
                const dbMessages = await getAllLocal("CHAT");
                
                if (dbMessages && dbMessages.length > 0) {
                    const mapped = dbMessages.map(m => ({
                        idPesan: m.ID_Pesan || m.idPesan,
                        idKaryawan: m.ID_Karyawan || m.idKaryawan,
                        nama: m.Nama || m.nama,
                        waktu: (m.Timestamp ? formatDateTime(new Date(m.Timestamp)) : m.waktu) || '',
                        pesan: m.Pesan || m.pesan || '',
                        tipe: m.Tipe || m.tipe || 'text',
                        fileUrl: m.File_URL || m.fileUrl || '',
                        namaFile: m.Nama_File || m.namaFile || '',
                        status: 'sent',
                        tempId: m.ID_Pesan || m.idPesan
                    }));
                    
                    const pendingMessages = chatMessages.filter(m => m.status === 'sending' || m.status === 'failed');
                    
                    chatMessages = [...mapped, ...pendingMessages];
                    
                    // Hapus duplikat berdasarkan idPesan
                    const seen = new Set();
                    chatMessages = chatMessages.filter(m => {
                        if (!m.idPesan) return true;
                        if (seen.has(m.idPesan)) return false;
                        seen.add(m.idPesan);
                        return true;
                    });
                    
                    chatMessages.sort((a, b) => {
                        const ta = safeParseDate(a.waktu) || new Date(0);
                        const tb = safeParseDate(b.waktu) || new Date(0);
                        return ta - tb;
                    });
                }
                
                checkUnreadChatState();
            } catch(e) {
                console.error('[CHAT] Cache load error:', e);
            }
        }

        async function loadChatMessages() {
            if (!state.user || !state.user.id) return;
            
            const handleData = (res) => {
                if (res.success && Array.isArray(res.data)) {
                    // Simpan ID pesan lama sebelum digabung untuk mendeteksi pesan baru
                    const oldIds = new Set(chatMessages.map(m => m.idPesan).filter(Boolean));

                    // Merge server data with local pending/sending messages
                    const pendingMessages = chatMessages.filter(m => m.status === 'sending' || m.status === 'failed');
                    
                    // Build a set of server IDs for dedup
                    const serverIdSet = new Set(res.data.map(m => String(m.idPesan)).filter(Boolean));
                    
                    // Keep local messages that are NOT yet on server (pending/failed/just-sent without idPesan match)
                    const localOnly = chatMessages.filter(m => {
                        if (m.status === 'sending' || m.status === 'failed' || m.status === 'uploading') return true;
                        // Pesan 'sent' lokal yg idPesan-nya sudah ada di server → skip (server yg menang)
                        if (m.idPesan && serverIdSet.has(String(m.idPesan))) return false;
                        // Pesan lokal tanpa idPesan yg tempId-nya cocok dgn server → skip
                        if (m.tempId && res.data.some(s => s.tempId === m.tempId)) return false;
                        return true; // Keep older messages!
                    });
                    
                    // Pertahankan foto lokal (base64) jika server fileUrl kosong
                    const localFileMap = {};
                    chatMessages.forEach(m => {
                        const key = m.idPesan || m.tempId;
                        if (key && (m._localFileUrl || (m.fileUrl && m.fileUrl.startsWith('data:')))) {
                            localFileMap[key] = m._localFileUrl || m.fileUrl;
                        }
                    });
                    res.data.forEach(m => {
                        if (m.tipe === 'image' && !m.fileUrl && localFileMap[m.idPesan]) {
                            m._localFileUrl = localFileMap[m.idPesan];
                        }
                    });
                    
                    chatMessages = [...res.data, ...localOnly];
                    
                    // Sort by timestamp
                    chatMessages.sort((a, b) => {
                        const ta = safeParseDate(a.waktu) || new Date(0);
                        const tb = safeParseDate(b.waktu) || new Date(0);
                        return ta - tb;
                    });
                    
                    // saveChatMessagesToCache removed
                    
                    // Simpan ke IndexedDB
                    const saveToDB = async () => {
                        try {
                            const tx = localDB.transaction("CHAT", "readwrite");
                            const store = tx.objectStore("CHAT");
                            res.data.forEach(m => {
                                store.put({
                                    ID_Pesan: m.idPesan,
                                    ID_Karyawan: m.idKaryawan,
                                    Nama: m.nama,
                                    Pesan: m.pesan,
                                    Tipe: m.tipe,
                                    File_URL: m.fileUrl,
                                    Nama_File: m.namaFile,
                                    Timestamp: safeParseDate(m.waktu) ? safeParseDate(m.waktu).toISOString() : new Date().toISOString()
                                });
                            });
                        } catch(e) { console.warn("Gagal save chat ke DB", e); }
                    };
                    saveToDB();
                    
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
                    if (chatMessages.length === 0) renderChatEmpty();
                }
            };

            try {
                await cachedApiCall('getChatMessages', { limit: 50 }, handleData);
            } catch (e) {
                console.error('[CHAT] Load failed:', e);
                if (chatMessages.length === 0) renderChatEmpty();
            }
        }
        
        async function fetchOlderChatMessages() {
            if (!state.user || !state.user.id || state.isLoadingOlderChat) return;
            
            state.isLoadingOlderChat = true;
            
            // Tampilkan loading spinner di loader
            const loader = document.getElementById('chat-infinite-loader');
            if (loader) loader.style.visibility = 'visible';
            
            // Simpan posisi pesan teratas saat ini untuk anchoring scroll
            const container = document.getElementById('chatMessages');
            let firstMsgId = null;
            if (container) {
                const firstMsgEl = container.querySelector('[id^="chat-msg-"]');
                if (firstMsgEl) firstMsgId = firstMsgEl.id;
            }
            
            const validOffset = chatMessages.filter(m => m.idPesan).length;
            
            try {
                const res = await apiCall('getChatMessages', { limit: 50, offset: validOffset });
                if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                    
                    // Simpan ke IndexedDB
                    try {
                        const tx = localDB.transaction("CHAT", "readwrite");
                        const store = tx.objectStore("CHAT");
                        res.data.forEach(m => {
                            store.put({
                                ID_Pesan: m.idPesan,
                                ID_Karyawan: m.idKaryawan,
                                Nama: m.nama,
                                Pesan: m.pesan,
                                Tipe: m.tipe,
                                File_URL: m.fileUrl,
                                Nama_File: m.namaFile,
                                Timestamp: safeParseDate(m.waktu) ? safeParseDate(m.waktu).toISOString() : new Date().toISOString()
                            });
                        });
                    } catch(e) { console.warn("Gagal save chat lama ke DB", e); }
                    
                    // Filter duplicates
                    const existingIds = new Set(chatMessages.map(m => String(m.idPesan)).filter(Boolean));
                    const newMessages = res.data.filter(m => !existingIds.has(String(m.idPesan)));
                    
                    if (newMessages.length > 0) {
                        chatMessages = [...newMessages, ...chatMessages];
                        chatMessages.sort((a, b) => {
                            const ta = safeParseDate(a.waktu) || new Date(0);
                            const tb = safeParseDate(b.waktu) || new Date(0);
                            return ta - tb;
                        });
                        
                        renderChat(false);
                        
                        // Kembalikan posisi scroll ke pesan teratas yang lama
                        if (firstMsgId) {
                            setTimeout(() => {
                                const msgEl = document.getElementById(firstMsgId);
                                if (msgEl) {
                                    msgEl.scrollIntoView({ behavior: 'instant', block: 'start' });
                                    // Beri sedikit offset ke bawah agar terlihat tombolnya
                                    if (container) container.scrollTop -= 40; 
                                }
                            }, 50);
                        }
                    }
                } else {
                    // Sembunyikan loader jika sudah habis
                    if (loader) loader.style.display = 'none';
                }
            } catch (e) {
                console.error('[CHAT] Load older failed:', e);
                showToast('Gagal memuat pesan lama', 'error');
            } finally {
                state.isLoadingOlderChat = false;
                if (loader) loader.style.visibility = 'hidden';
            }
        }

        let pusher = null;
        let chatChannel = null;

        function initPusher() {
            try {
                // Pusher client keys (sandbox free tier, active)
                pusher = new Pusher('3c015a6e56c1e4beb0ea', {
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
                
                // Real-time listener: Lembur di-approve/reject oleh admin
                chatChannel.bind('lembur-alert', function(data) {
                    if (!state.user || !state.user.id) return;
                    // Hanya proses jika ini notifikasi approval (bukan pengajuan baru)
                    // dan ditujukan ke karyawan yang sedang login
                    if (data && String(data.idKaryawan) === String(state.user.id)) {
                        console.log('[PUSHER] 🔥 Lembur update diterima:', data.status);
                        // Refresh status absen & lembur dari server
                        checkAbsenStatus().then(() => {
                            updateButtonVisibility();
                            if (data.status === 'Approved') {
                                tampilPicoModal('sukses', '<b>Lembur Disetujui! 🔥</b><br>Pengajuan lembur Anda telah disetujui Bos.<br>Selamat bekerja lembur, tetap semangat & jaga kesehatan! 💪');
                            } else if (data.status === 'Rejected') {
                                tampilPicoModal('error', '<b>Lembur Ditolak ❌</b><br>Maaf, pengajuan lembur Anda ditolak oleh Bos.');
                            }
                        });
                    }
                });

                // Real-time listener: Single Device Login Force Logout
                chatChannel.bind('force-logout', function(data) {
                    if (!state.user || !state.user.id) return;
                    if (data && String(data.idKaryawan) === String(state.user.id)) {
                        const currentDeviceId = getDeviceId();
                        if (data.newDeviceId !== currentDeviceId) {
                            console.log('[AUTH] Menerima sinyal force-logout dari perangkat lain.');
                            Swal.fire({
                                title: 'Sesi Berakhir',
                                text: 'Akun Anda baru saja login di perangkat lain. Anda telah dikeluarkan dari perangkat ini.',
                                icon: 'warning',
                                confirmButtonText: 'OK',
                                allowOutsideClick: false,
                                allowEscapeKey: false
                            }).then(() => {
                                logout();
                            });
                        }
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
                    const idx = chatMessages.findIndex(m => (data.tempId && m.tempId === data.tempId) || (data.idPesan && String(m.idPesan) === String(data.idPesan)));
                    if (idx !== -1) {
                        // JANGAN timpa jika masih uploading — biarkan await di sendChat yg handle
                        if (chatMessages[idx].status === 'uploading') {
                            console.log('[CHAT] Pusher echo diabaikan: masih uploading');
                            return;
                        }
                        chatMessages[idx].status = 'sent';
                        if (data.idPesan) chatMessages[idx].idPesan = data.idPesan;
                        chatMessages[idx].waktu = data.waktu || 'Baru saja';
                        // Update fileUrl ke Drive URL jika ada
                        if (data.fileUrl && data.fileUrl.startsWith('https://')) {
                            if (chatMessages[idx].fileUrl && chatMessages[idx].fileUrl.startsWith('data:')) {
                                chatMessages[idx]._localFileUrl = chatMessages[idx].fileUrl;
                            }
                            chatMessages[idx].fileUrl = data.fileUrl;
                        }
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
            if (chatPollTimeout) {
                clearTimeout(chatPollTimeout);
                chatPollTimeout = null;
            }
            
            // Polling latar belakang tetap berjalan jika pengguna sudah login
            if (!state.user || !state.user.id) return;
            
            const modal = document.getElementById('modalChat');
            const isActive = modal && modal.classList.contains('active');
            
            // Polling cepat (3.5s) saat chat terbuka, polling santai (15s) di latar belakang saat ditutup
            const interval = isActive ? 3500 : 15000;
            
            chatPollTimeout = setTimeout(async () => {
                try {
                    await loadChatMessages();
                } catch (e) {
                    console.warn('[CHAT] Polling error:', e);
                }
                startChatPolling(); // Lanjutkan loop
            }, interval);
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
                return dateStr; // Fallback aman
            }
            
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;
            
            const now = new Date();
            const todayStr = now.toDateString();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toDateString();
            const dateStrDate = date.toDateString();
            
            // Hari ini -> "14:30"
            if (dateStrDate === todayStr) {
                return timeStr;
            }
            
            // Kemarin -> "Kemarin 14:30"
            if (dateStrDate === yesterdayStr) {
                return `Kemarin ${timeStr}`;
            }
            
            // Lusa atau lebih -> "dd/mm/yy 14:30"
            const d = String(date.getDate()).padStart(2, '0');
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const y = String(date.getFullYear()).slice(-2);
            return `${d}/${m}/${y} ${timeStr}`;
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

        let _lastChatHtml = '';
        function renderChat(forceScrollToBottom = false) {
            updateChatActiveUsersHeader();
            const container = document.getElementById('chatMessages');
            if (!chatMessages.length) { renderChatEmpty(); _lastChatHtml = ''; return; }
            
            const previousScrollTop = container.scrollTop;
            const previousScrollHeight = container.scrollHeight;
            const isAtBottom = previousScrollHeight - previousScrollTop - container.clientHeight < 80;
            
            let renderedDivider = false;
            
            const newHtml = chatMessages.map((m, index) => {
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

                if (m.tipe === 'image' && (m.fileUrl || m._localFileUrl)) {
                    // Gunakan foto lokal (base64) jika ada, atau fallback ke server URL
                    const displayUrl = m._localFileUrl || m.fileUrl;
                    const isBase64 = displayUrl.startsWith('data:');
                    content = `
                    ${replyBoxHtml}
                    <div style="position:relative; border-radius:12px; overflow:hidden; max-width:260px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); margin-top: 2px;">
                        ${isBase64 
                            ? `<img src="${displayUrl}" style="width:100%; max-height:220px; object-fit:cover; display:block; cursor:pointer;" onclick="viewPhoto('${displayUrl}')" alt="Foto">`
                            : `<img class="cacheable-img" data-src="${displayUrl}" style="width:100%; max-height:220px; object-fit:cover; display:block; cursor:pointer;" onclick="viewPhoto('${resolveFotoUrl(displayUrl)}')" alt="Foto">`
                        }
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
                    
                    const avatarColor = getHashCodeColor(m.nama || 'Karyawan');
                    const initial = m.nama ? m.nama.charAt(0).toUpperCase() : '?';
                    
                    let avatarBadge = '';
                    if (rawFotoUrl) {
                        avatarBadge = `<img class="cacheable-img" data-src="${rawFotoUrl}" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover; box-shadow: 0 3px 6px rgba(0,0,0,0.06); flex-shrink: 0;" alt="${m.nama}">`;
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
            
            // Tambahkan loader infinite scroll jika jumlah pesan cukup banyak
            let loadMoreHtml = '';
            if (chatMessages.length >= 50) {
                loadMoreHtml = `
                <div id="chat-infinite-loader" style="display: flex; justify-content: center; padding: 10px 0; margin-bottom: 10px; height: 30px; align-items: center; visibility: hidden;">
                    <span class="loading-spinner" style="width:16px;height:16px;border-width:2px;display:inline-block; border-color: rgba(59, 130, 246, 0.5) rgba(59, 130, 246, 0.1) rgba(59, 130, 246, 0.1) rgba(59, 130, 246, 0.1);"></span>
                </div>`;
            }
            
            // Anti-flicker: hanya update DOM jika konten berubah
            const finalHtml = loadMoreHtml + newHtml;
            if (finalHtml === _lastChatHtml && !forceScrollToBottom) {
                return;
            }
            _lastChatHtml = finalHtml;
            container.innerHTML = finalHtml;
            
            if (renderedDivider) {
                state.hasShownNewMessagesDivider = true;
            }
            
            if (forceScrollToBottom || isAtBottom) {
                container.scrollTop = container.scrollHeight;
            } else {
                container.scrollTop = previousScrollTop;
            }
            
            // Pasang scroll listener untuk infinite load
            if (!container._hasInfiniteScroll) {
                container._hasInfiniteScroll = true;
                container.addEventListener('scroll', () => {
                    if (container.scrollTop <= 10 && !state.isLoadingOlderChat && chatMessages.length >= 50) {
                        fetchOlderChatMessages();
                    }
                });
            }
            
            // Cache and render local images for chat messages and sender avatars
            container.querySelectorAll('.cacheable-img').forEach(img => {
                loadImageWithCache(img, img.getAttribute('data-src'));
            });
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
            compressImage(file, 0.5, 800).then(({ base64, name }) => {
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
                chatCameraStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: chatCameraFacing }, 
                    audio: false 
                });
                video.srcObject = chatCameraStream;
                // Mirror hanya untuk kamera depan
                video.style.transform = chatCameraFacing === 'user' ? 'scaleX(-1)' : 'none';
                await video.play();
            } catch (err) {
                showToast('Gagal nyalakan kamera: ' + err.message, 'error');
                closeChatCamera();
            }
        }

        async function flipChatCamera() {
            chatCameraFacing = chatCameraFacing === 'user' ? 'environment' : 'user';
            if (chatCameraStream) {
                chatCameraStream.getTracks().forEach(t => t.stop());
            }
            const video = document.getElementById('chatCameraVideo');
            try {
                chatCameraStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: chatCameraFacing }, 
                    audio: false 
                });
                video.srcObject = chatCameraStream;
                video.style.transform = chatCameraFacing === 'user' ? 'scaleX(-1)' : 'none';
                await video.play();
            } catch (err) {
                showToast('Gagal ganti kamera: ' + err.message, 'error');
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
            const maxDimension = 480;
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
            // Mirror hanya untuk kamera depan
            if (chatCameraFacing === 'user') {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }
            ctx.drawImage(video, 0, 0, w, h);
            const base64 = canvas.toDataURL('image/jpeg', 0.4);
            const sizeKB = Math.round(base64.length * 0.75 / 1024);
            console.log('[CHAT] Foto kamera: ' + w + 'x' + h + ', ~' + sizeKB + 'KB');
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

            const tempId = 'temp_' + Date.now();
            const isFile = !!chatAttachment;
            const now = new Date();
            const timeStr = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');

            // Prepend reply prefix if active
            if (state.replyingTo) {
                let snippet = state.replyingTo.messageText;
                snippet = snippet.replace(/^\{\{REPLY:.*?\}\}/, '');
                pesan = `{{REPLY:${state.replyingTo.idPesan}|${state.replyingTo.senderName}|${snippet}}}` + pesan;
            }

            // Build payload
            const payload = { idKaryawan: state.user.id, nama: state.user.name, pesan: pesan || '', tempId: tempId };
            if (chatAttachment) {
                payload.tipe = chatAttachment.type;
                payload.fileBase64 = chatAttachment.data;
                payload.namaFile = chatAttachment.name;
            }

            // Clear input segera
            input.value = '';
            const savedAttachment = chatAttachment;
            clearChatAttachment();
            window.clearChatReply();

            if (!isFile) {
                // ═══════════════════════════════════════════
                // ALUR 1: PESAN TEKS — Instan (fire-and-forget)
                // ═══════════════════════════════════════════
                const msgObj = {
                    tempId, idKaryawan: state.user.id, nama: state.user.name,
                    pesan: pesan, tipe: 'text', fileUrl: null, namaFile: null,
                    waktu: timeStr, status: 'sent'
                };
                chatMessages.push(msgObj);
                renderChat(true);
                playSound('chatsent');

                // Kirim di background — UI sudah selesai
                const sendStart = Date.now();
                apiCall('sendChatMessage', payload).then(res => {
                    const elapsed = ((Date.now() - sendStart) / 1000).toFixed(1);
                    console.log('[CHAT] Teks terkirim dalam ' + elapsed + 's');
                    const idx = chatMessages.findIndex(m => m.tempId === tempId);
                    if (idx === -1) return;
                    if (res.success) {
                        chatMessages[idx].idPesan = res.idPesan;
                    } else {
                        chatMessages[idx].status = 'failed';
                        chatMessages[idx].waktu = 'Gagal ✕';
                        renderChat();
                    }
                }).catch(e => {
                    const idx = chatMessages.findIndex(m => m.tempId === tempId);
                    if (idx !== -1) {
                        chatMessages[idx].status = 'failed';
                        chatMessages[idx].waktu = 'Gagal ✕';
                        renderChat();
                    }
                });

            } else {
                // ═══════════════════════════════════════════
                // ALUR 2: FOTO/FILE — Tunggu upload selesai
                // ═══════════════════════════════════════════
                const msgObj = {
                    tempId, idKaryawan: state.user.id, nama: state.user.name,
                    pesan: pesan || (savedAttachment.type === 'image' ? '[Foto]' : '[File]'),
                    tipe: savedAttachment.type,
                    fileUrl: savedAttachment.data,       // base64 lokal untuk preview
                    _localFileUrl: savedAttachment.data,  // backup base64
                    namaFile: savedAttachment.name,
                    waktu: '⏳ Mengupload...',
                    status: 'uploading'
                };
                chatMessages.push(msgObj);
                renderChat(true);

                const payloadKB = Math.round(JSON.stringify(payload).length / 1024);
                console.log('[CHAT] Upload foto: ~' + payloadKB + 'KB payload');
                const sendStart = Date.now();

                try {
                    // AWAIT — tunggu sampai server upload ke Drive selesai
                    const res = await apiCall('sendChatMessage', payload);
                    const elapsed = ((Date.now() - sendStart) / 1000).toFixed(1);
                    console.log('[CHAT] Upload selesai dalam ' + elapsed + 's, fileUrl=' + (res.fileUrl || 'KOSONG'));

                    const idx = chatMessages.findIndex(m => m.tempId === tempId);
                    if (idx === -1) return;

                    if (res.success) {
                        chatMessages[idx].status = 'sent';
                        chatMessages[idx].idPesan = res.idPesan;
                        chatMessages[idx].waktu = timeStr;

                        // Update ke Drive URL (penerima akan dapat ini via Pusher)
                        if (res.fileUrl) {
                            chatMessages[idx].fileUrl = res.fileUrl;
                            console.log('[CHAT] Drive URL: ' + res.fileUrl);
                        } else {
                            console.warn('[CHAT] WARNING: fileUrl kosong! Drive upload mungkin gagal.');
                        }

                        renderChat();
                        playSound('chatsent');
                    } else {
                        chatMessages[idx].status = 'failed';
                        chatMessages[idx].waktu = 'Gagal ✕ Tap untuk kirim ulang';
                        renderChat();
                        showToast('Gagal mengirim: ' + (res.error || 'Server error'), 'error');
                    }
                } catch (e) {
                    const idx = chatMessages.findIndex(m => m.tempId === tempId);
                    if (idx !== -1) {
                        chatMessages[idx].status = 'failed';
                        chatMessages[idx].waktu = 'Gagal ✕ Tap untuk kirim ulang';
                        renderChat();
                    }
                    showToast('Gagal upload: ' + e.message, 'error');
                }
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
            if (fotoUrl) {
                loadImageWithCache(avatarImg, fotoUrl);
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
            makeSelectCustom('tukerKaryawan');
            
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
                if (colFoto) {
                    loadImageWithCache(avatarImg, colFoto);
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
            if (container && (container.innerHTML === '' || container.innerHTML.includes('history-empty'))) {
                container.innerHTML = '<div class="history-empty">Memuat data...</div>';
            }
            const handleData = (res) => {
                if (res.success && Array.isArray(res.data)) {
                    izinHistoryData = res.data;
                    renderIzinList();
                } else {
                    if (container) container.innerHTML = '<div class="history-empty">Belum ada pengajuan izin</div>';
                }
            };
            try {
                await cachedApiCall('getIzinHistory', { idKaryawan: state.user.id }, handleData);
            } catch (e) {
                if (container) container.innerHTML = '<div class="history-empty">Gagal memuat data</div>';
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
            const chips = document.querySelectorAll('#modalDataIzin .filter-chip');
            if (chips) chips.forEach(c => c.classList.remove('active'));
            if (el) el.classList.add('active');
            renderIzinList();
        }

        async function renderDataLembur() {
            if (!state.user || !state.user.id) { showToast('Login dulu!', 'error'); return; }
            const container = document.getElementById('lemburHistoryList');
            if (container && (container.innerHTML === '' || container.innerHTML.includes('history-empty'))) {
                container.innerHTML = '<div class="history-empty">Memuat data...</div>';
            }
            const handleData = (res) => {
                if (res.success && Array.isArray(res.data)) {
                    lemburHistoryData = res.data;
                    renderLemburList();
                } else {
                    if (container) container.innerHTML = '<div class="history-empty">Belum ada pengajuan lembur</div>';
                }
            };
            try {
                await cachedApiCall('getLemburHistory', { idKaryawan: state.user.id }, handleData);
            } catch (e) {
                if (container) container.innerHTML = '<div class="history-empty">Gagal memuat data</div>';
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
            if (container && (container.innerHTML === '' || container.innerHTML.includes('history-empty'))) {
                container.innerHTML = '<div class="history-empty">Memuat tugas...</div>';
            }
            const handleData = (res) => {
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
                    if (container) container.innerHTML = '<div class="history-empty">Belum ada tugas</div>';
                }
            };
            try {
                await cachedApiCall('getTugasList', { idKaryawan: state.user.id, idToko: state.user.tokoDefault || '' }, handleData);
            } catch (e) {
                if (container) container.innerHTML = '<div class="history-empty">Gagal memuat tugas</div>';
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
            if (container && (container.innerHTML === '' || container.innerHTML.includes('history-empty'))) {
                container.innerHTML = '<div class="history-empty">Memuat info...</div>';
            }
            
            const handleData = (res) => {
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
                                    <img class="cacheable-img berita-img" data-src="${b.gambarUrl}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s;" alt="${escapeHtml(b.judul)}">
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
                    
                    // Caching and rendering the local images using loadImageWithCache
                    container.querySelectorAll('.cacheable-img').forEach(img => {
                        loadImageWithCache(img, img.getAttribute('data-src'));
                    });
                    
                    // Update badge
                    const badge = document.getElementById('badgeBerita');
                    if (badge) {
                        badge.textContent = res.data.length;
                        badge.classList.remove('hidden');
                    }
                } else {
                    if (container) container.innerHTML = '<div class="history-empty">Belum ada info</div>';
                }
            };

            try {
                await cachedApiCall('getBeritaList', { limit: 10 }, handleData);
            } catch (e) {
                if (container) container.innerHTML = '<div class="history-empty">Gagal memuat info</div>';
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

        function syncFCMTokenWithServer(idKaryawan, token) {
            if (!idKaryawan || !token) return;
            console.log("[PUSH] Menyinkronkan Token FCM dengan Google Sheets untuk:", idKaryawan);
            apiCall('registerFCMToken', {
                idKaryawan: idKaryawan,
                token: token
            }).then(res => {
                if (res.success) {
                    console.log("[PUSH] Token FCM sukses disimpan di Google Sheets!");
                    showToast('Token FCM sukses disimpan di Google Sheets!', 'success');
                } else {
                    console.error("[PUSH] Server gagal menyimpan token:", res.error);
                    showToast('Gagal simpan token ke server: ' + (res.error || 'Unknown Error'), 'error');
                }
            }).catch(err => {
                console.error("[PUSH] Gagal mengirim Token FCM ke server:", err);
                showToast('Koneksi gagal mengirim token: ' + err.message, 'error');
            });
        }

        let hasAttemptedPushInit = false;
        let pushInitRetries = 0;
        function initNativePushNotifications() {
            // 1. Cek apakah berjalan di Capacitor
            if (!window.Capacitor) {
                console.log("[PUSH] Tidak berjalan di Capacitor native context, skip Native Push.");
                showToast("Aplikasi mendeteksi mode Web Browser (Notifikasi native nonaktif)", "warning");
                return;
            }
            
            // 2. Jika plugin belum ter-injeksi oleh Capacitor, tunggu 1 detik lalu coba lagi (mengatasi race-condition)
            if (!window.Capacitor.Plugins || !window.Capacitor.Plugins.PushNotifications) {
                console.log("[PUSH] Plugin PushNotifications belum siap, mencoba kembali dalam 1 detik...");
                pushInitRetries++;
                if (pushInitRetries > 5) {
                    showToast("Gagal mendeteksi modul PushNotifications di HP! Cek instalasi plugin.", "error");
                    return;
                }
                setTimeout(initNativePushNotifications, 1000);
                return;
            }
            
            // Mencegah inisialisasi ganda
            if (hasAttemptedPushInit) return;
            hasAttemptedPushInit = true;
            
            showToast("Menginisialisasi Layanan Notifikasi HP...", "info");
            
            const PushNotifications = window.Capacitor.Plugins.PushNotifications;
            
            // 3. Buat Channel Notifikasi (Sesuai Kategori)
            try {
                PushNotifications.createChannel({
                    id: 'chat',
                    name: 'Pesan Obrolan',
                    description: 'Pesan antar karyawan',
                    importance: 5,
                    visibility: 1,
                    vibration: true
                });
                PushNotifications.createChannel({
                    id: 'absen',
                    name: 'Absensi',
                    description: 'Notifikasi absensi & kehadiran',
                    importance: 4,
                    visibility: 1,
                    vibration: true
                });
                PushNotifications.createChannel({
                    id: 'general',
                    name: 'General',
                    description: 'Notifikasi aktivitas apk umum (Lembur, Izin)',
                    importance: 4,
                    visibility: 1,
                    vibration: true
                });
                PushNotifications.createChannel({
                    id: 'emergency',
                    name: 'Emergency',
                    description: 'Peringatan penting / darurat',
                    importance: 5,
                    visibility: 1,
                    vibration: true
                });
                console.log("[PUSH] Semua Channel Notifikasi berhasil dibuat.");
            } catch (e) {
                console.warn("[PUSH] Gagal buat channel:", e);
            }
            
            // 4. Daftarkan Listener TERLEBIH DAHULU (Wajib sebelum memanggil register!)
            PushNotifications.addListener('registration', (token) => {
                console.log('[PUSH] Token registrasi FCM didapat:', token.value);
                showToast('FCM Token berhasil didapat!', 'success');
                
                // Simpan token ke cache lokal agar bisa disinkronkan saat login atau retry
                localStorage.setItem('cached_fcm_token', token.value);
                state.fcmToken = token.value;
                
                if (state.user && state.user.id) {
                    syncFCMTokenWithServer(state.user.id, token.value);
                } else {
                    showToast('Token didapat, tapi user belum login.', 'warning');
                }
            });
            
            PushNotifications.addListener('registrationError', (error) => {
                console.error('[PUSH] Registrasi FCM error:', error);
                showToast('FCM Register Error: ' + (error.error || JSON.stringify(error)), 'error');
            });
            
            PushNotifications.addListener('pushNotificationReceived', (notification) => {
                console.log('[PUSH] Notifikasi diterima:', notification);
                if (notification.title && notification.body) {
                    showToast(`🔔 ${notification.title}: ${notification.body}`, 'info');
                    playSound('pop');
                }
            });
            
            PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                console.log('[PUSH] Aksi notifikasi diklik:', notification);
                if (notification.notification.title && notification.notification.title.includes('💬')) {
                    openModal('modalChat');
                }
            });
            
            // 5. Cek izin & daftarkan ke Firebase
            try {
                showToast("Memeriksa izin notifikasi HP...", "info");
                PushNotifications.checkPermissions().then(result => {
                    console.log("[PUSH] Status izin saat ini:", result.receive);
                    if (result.receive === 'granted') {
                        registerFCMDevice();
                    } else if (result.receive === 'prompt') {
                        showToast("Meminta izin notifikasi ke HP...", "info");
                        PushNotifications.requestPermissions().then(reqResult => {
                            showToast("Status Izin HP: " + (reqResult.receive === 'granted' ? 'DIIZINKAN' : 'DITOLAK'), "info");
                            if (reqResult.receive === 'granted') {
                                registerFCMDevice();
                            } else {
                                console.warn("[PUSH] Izin push notifikasi native ditolak.");
                                showToast("Izin notifikasi ditolak oleh HP!", "error");
                            }
                        }).catch(e => {
                            showToast("Gagal meminta izin async: " + e.message, "error");
                        });
                    } else {
                        showToast("Izin notifikasi diblokir HP. Harap aktifkan manual di Pengaturan.", "warning");
                        registerFCMDevice();
                    }
                }).catch(errCheck => {
                    console.warn("[PUSH] Gagal cek izin, langsung meminta izin...", errCheck);
                    PushNotifications.requestPermissions().then(reqResult => {
                        if (reqResult.receive === 'granted') {
                            registerFCMDevice();
                        }
                    }).catch(e => {
                        showToast("Gagal fallback izin async: " + e.message, "error");
                    });
                });
            } catch (err) {
                showToast("Exception requestPermission: " + err.toString(), "error");
            }

            function registerFCMDevice() {
                showToast("Mendaftarkan ke Firebase (FCM)...", "info");
                try {
                    PushNotifications.register().then(() => {
                        showToast("Proses registrasi FCM dikirim ke OS...", "info");
                    }).catch(errReg => {
                        showToast("Error register async: " + errReg.message, "error");
                    });
                } catch(eReg) {
                    showToast("Exception register sync: " + eReg.toString(), "error");
                }
            }
        }

        async function forceRegisterFCM() {
            hasAttemptedPushInit = false;
            pushInitRetries = 0;
            showToast("Memulai ulang registrasi FCM...", "info");
            
            // Cek manual Capacitor
            if (!window.Capacitor) {
                tampilPicoModal('default', 'Aplikasi mendeteksi mode Web Browser. Fitur Push Notifikasi Native hanya berfungsi saat aplikasi dijalankan sebagai APK Android asli.');
                return;
            }
            
            if (!window.Capacitor.Plugins || !window.Capacitor.Plugins.PushNotifications) {
                tampilPicoModal('default', 'Gagal memuat modul PushNotifications. Silakan hubungi admin untuk memeriksa kelengkapan plugin APK.');
                return;
            }
            
            tampilPicoModal('sukses', 'Memulai registrasi FCM di HP. Silakan klik OK untuk mendaftarkan ulang perangkat Anda.', () => {
                initNativePushNotifications();
            });
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

        // ===== HELPER: CUSTOM DROPDOWN COMPONENT =====
        function makeSelectCustom(selectId) {
            const selectEl = document.getElementById(selectId);
            if (!selectEl) return;
            
            // Avoid double initialization
            if (selectEl.dataset.customInitialized === "true") {
                refreshCustomDropdown(selectId);
                return;
            }
            selectEl.dataset.customInitialized = "true";
            
            // Hide the native select
            selectEl.style.display = "none";
            
            // Create wrapper
            const wrapper = document.createElement("div");
            wrapper.className = "custom-select-wrapper";
            wrapper.id = `customWrapper_${selectId}`;
            
            // Insert wrapper right before select
            selectEl.parentNode.insertBefore(wrapper, selectEl);
            wrapper.appendChild(selectEl);
            
            // Create trigger button
            const trigger = document.createElement("div");
            trigger.className = "custom-select-trigger";
            
            const triggerText = document.createElement("span");
            triggerText.className = "trigger-text";
            triggerText.textContent = selectEl.options[selectEl.selectedIndex] ? selectEl.options[selectEl.selectedIndex].text : "Pilih...";
            
            trigger.appendChild(triggerText);
            
            // Arrow SVG
            trigger.innerHTML += `
                <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            `;
            
            wrapper.appendChild(trigger);
            
            // Create options panel
            const optionsContainer = document.createElement("div");
            optionsContainer.className = "custom-select-options";
            wrapper.appendChild(optionsContainer);
            
            // Toggle open on trigger click
            trigger.addEventListener("click", function(e) {
                e.stopPropagation();
                // Close all other open custom selects
                document.querySelectorAll(".custom-select-wrapper").forEach(w => {
                    if (w !== wrapper) w.classList.remove("open");
                });
                wrapper.classList.toggle("open");
            });
            
            // Populate options helper
            function populateOptions() {
                optionsContainer.innerHTML = "";
                Array.from(selectEl.options).forEach((opt, idx) => {
                    const optDiv = document.createElement("div");
                    optDiv.className = "custom-select-option";
                    if (idx === selectEl.selectedIndex) optDiv.classList.add("selected");
                    optDiv.textContent = opt.text;
                    optDiv.dataset.value = opt.value;
                    optDiv.dataset.index = idx;
                    
                    optDiv.addEventListener("click", function(e) {
                        e.stopPropagation();
                        selectEl.selectedIndex = idx;
                        // Trigger native change event
                        selectEl.dispatchEvent(new Event("change"));
                        
                        wrapper.classList.remove("open");
                    });
                    
                    optionsContainer.appendChild(optDiv);
                });
            }
            
            populateOptions();
            
            // Watch native select for changes (updates trigger display)
            selectEl.addEventListener("change", function() {
                const selectedOpt = selectEl.options[selectEl.selectedIndex];
                wrapper.querySelector(".trigger-text").textContent = selectedOpt ? selectedOpt.text : "Pilih...";
                
                // Update selected class
                optionsContainer.querySelectorAll(".custom-select-option").forEach((optDiv, idx) => {
                    if (idx === selectEl.selectedIndex) {
                        optDiv.classList.add("selected");
                    } else {
                        optDiv.classList.remove("selected");
                    }
                });
            });
        }
        
        function refreshCustomDropdown(selectId) {
            const selectEl = document.getElementById(selectId);
            const wrapper = document.getElementById(`customWrapper_${selectId}`);
            if (!selectEl || !wrapper) return;
            
            const optionsContainer = wrapper.querySelector(".custom-select-options");
            if (!optionsContainer) return;
            
            optionsContainer.innerHTML = "";
            Array.from(selectEl.options).forEach((opt, idx) => {
                const optDiv = document.createElement("div");
                optDiv.className = "custom-select-option";
                if (idx === selectEl.selectedIndex) optDiv.classList.add("selected");
                optDiv.textContent = opt.text;
                optDiv.dataset.value = opt.value;
                optDiv.dataset.index = idx;
                
                optDiv.addEventListener("click", function(e) {
                    e.stopPropagation();
                    selectEl.selectedIndex = idx;
                    selectEl.dispatchEvent(new Event("change"));
                    wrapper.classList.remove("open");
                });
                
                optionsContainer.appendChild(optDiv);
            });
            
            const selectedOpt = selectEl.options[selectEl.selectedIndex];
            wrapper.querySelector(".trigger-text").textContent = selectedOpt ? selectedOpt.text : "Pilih...";
        }
        
        // Close all dropdowns when clicking outside
        document.addEventListener("click", function() {
            document.querySelectorAll(".custom-select-wrapper").forEach(w => w.classList.remove("open"));
        });
