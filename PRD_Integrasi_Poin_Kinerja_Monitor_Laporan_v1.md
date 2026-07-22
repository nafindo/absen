# PRD: Integrasi Poin Kinerja ke Menu Monitor & Laporan
### Absensi Pro — Admin APK (`absen-admin`)
### Versi: 1.0 | Tanggal: 12 Juli 2026

---

## 1. RINGKASAN

### Tujuan
Menambahkan fitur **Poin Kinerja** dari [PRD_Review_Kinerja_v5_0_Zero_Risk.md](file:///d:/absen/PRD_Review_Kinerja_v5_0_Zero_Risk.md) ke dalam 2 menu **yang sudah ada** di APK Admin:
- **Menu Monitor** — tambah tab/section "Poin Kinerja" per toko
- **Menu Laporan** — tambah tab/section "Raport Kinerja" per karyawan

### Prinsip Zero-Risk
1. ❌ **TIDAK** menambah screen baru / route baru
2. ❌ **TIDAK** mengubah navigasi (bottom bar, drawer, NavHost)
3. ❌ **TIDAK** mengubah `Code.gs` yang sudah ada
4. ✅ **HANYA** menambah tab/section di dalam screen yang sudah ada
5. ✅ **HANYA** menambah endpoint baru di `GasApi` interface
6. ✅ **HANYA** menambah ViewModel & model data baru
7. ✅ Backend menggunakan endpoint baru yang ditambahkan ke `doPost()` switch-case

---

## 2. MAPPING SHEET EXISTING → KALKULASI

### Sheet yang Dibaca (READ-ONLY)

| Sheet Existing | Nama di `code.gs` | Field yang Dibaca |
|---|---|---|
| `ABSENSI` | `SHEET_NAMES.ABSENSI` | ID_Karyawan, Tanggal, Status, Menit_Telat |
| `TUGAS` | `SHEET_NAMES.TUGAS` | ID_Tugas, Status, Deadline, Ditugaskan_Ke |
| `LOG_TUGAS` | `SHEET_NAMES.LOG_TUGAS` | ID_Karyawan, Status_Verifikasi, Timestamp |
| `MASTER_KARYAWAN` | `SHEET_NAMES.MASTER_KARYAWAN` | ID_Karyawan, Nama, Toko_Default, Status |
| `MASTER_TOKO` | `SHEET_NAMES.MASTER_TOKO` | ID_Toko, Nama_Toko |

### Sheet BARU (Write-Only)

| Sheet Baru | Fungsi |
|---|---|
| `MONTHLY_SCORES` | Hasil kalkulasi poin kinerja bulanan |
| `SCORE_AUDIT` | Audit trail setiap kalkulasi/view |

### Kolom `MONTHLY_SCORES`

```
A: ID_Score       (auto: SCR-YYYYMM-IDKaryawan)
B: ID_Karyawan    (FK → MASTER_KARYAWAN)
C: ID_Toko        (FK → dari Toko_Default karyawan)
D: Bulan          (YYYY-MM)
E: Skor_Kehadiran (0-500)
F: Skor_Tugas     (0-1000)
G: Skor_Total     (0-500, normalisasi 50:50)
H: Grade          (A+/A/B+/B/C/D/E)
I: Rekomendasi    (BONUS_ELIGIBLE/RETAIN/WATCH/REVIEW/NOT_RECOMMENDED)
J: Generated_At   (timestamp)
K: Status         (ACTIVE/ARCHIVED)
```

---

## 3. FORMULA KALKULASI

### 3.1 Skor Kehadiran (0–500) — dari sheet `ABSENSI`

| Status di ABSENSI | Poin |
|---|---|
| Hadir / Tepat Waktu (Menit_Telat = 0) | +15/hari |
| Terlambat ≤ 15 menit | +8/hari |
| Terlambat > 15 menit | +3/hari |
| Izin / Sakit / Cuti (dari `IZIN_CUTI` approved) | +10/hari |
| Alpa / Tanpa Keterangan | -20/hari |
| **Bonus Full Month** (0 alpa, ≤2 izin, ≤2 telat) | +50 |
| **Bonus Perfect Month** (100% hadir tepat waktu) | +100 (di atas full month) |

```
Skor_Kehadiran = CLAMP(0, 500, SUM(poin_harian) + bonus)
```

### 3.2 Skor Tugas (0–1000) — dari sheet `TUGAS` + `LOG_TUGAS`

```
Completion_Rate = Tugas_Selesai / Tugas_Ditugaskan × 100%
OnTime_Rate     = Selesai_Tepat_Waktu / Tugas_Selesai × 100%
Quality_Rate    = Tugas_Approved / Tugas_Submitted × 100%

Base_Score    = MIN(Completion_Rate, 100%) × 600
OnTime_Bonus  = OnTime_Rate × 200
Quality_Bonus = Quality_Rate × 200

Skor_Tugas = CLAMP(0, 1000, Base + OnTime + Quality)
```

### 3.3 Skor Total (0–500)

```
Pct_Kehadiran = Skor_Kehadiran / 500 × 100%
Pct_Tugas     = Skor_Tugas / 1000 × 100%

Total_Pct   = (Pct_Kehadiran × 0.50) + (Pct_Tugas × 0.50)
Skor_Total  = Total_Pct × 5   // skala 0–500
```

### 3.4 Grade

| Grade | Rentang Skor |
|---|---|
| A+ | ≥ 450 |
| A | 400–449 |
| B+ | 350–399 |
| B | 300–349 |
| C | 250–299 |
| D | 200–249 |
| E | < 200 |

### 3.5 Rekomendasi

| Rekomendasi | Syarat |
|---|---|
| 🏆 `BONUS_ELIGIBLE` | A+ 2 bulan berturut + Kehadiran ≥ 80% |
| ✅ `RETAIN` | Grade ≥ B+ 3 bulan berturut |
| ⚠️ `WATCH` | Grade B/C atau turun 2 bulan berturut |
| 🚨 `REVIEW` | Grade D atau Kehadiran < 60% |
| ❌ `NOT_RECOMMENDED` | Grade E 2 bulan berturut |

---

## 4. PERUBAHAN DI BACKEND (`code.gs`)

### 4.1 Endpoint Baru (ditambah di switch-case `doPost`)

Tambahkan case berikut **di bawah** case existing, sebelum `default:`:

```javascript
// === POIN KINERJA ===
case 'calculateMonthlyScores': return jsonResponse(calculateMonthlyScores(data));
case 'getMonthlyScores': return jsonResponse(getMonthlyScores(data));
case 'getKaryawanScorecard': return jsonResponse(getKaryawanScorecard(data));
case 'getTokoScoreSummary': return jsonResponse(getTokoScoreSummary(data));
```

### 4.2 API Contracts

#### `calculateMonthlyScores`
**Trigger**: Tombol "Generate Skor" di Monitor, atau cron tanggal 1
```json
// Request
{ "action": "calculateMonthlyScores", "bulan": "2026-07" }

// Response
{
  "success": true,
  "bulan": "2026-07",
  "generated": 15,
  "errors": []
}
```

#### `getMonthlyScores`
**Digunakan di**: Monitor → Tab Kinerja (semua karyawan)
```json
// Request
{ "action": "getMonthlyScores", "bulan": "2026-07", "idToko": "T001" }

// Response
{
  "success": true,
  "data": [
    {
      "idKaryawan": "K001",
      "nama": "Abel",
      "fotoProfil": "https://...",
      "idToko": "T001",
      "namaToko": "Toko A",
      "bulan": "2026-07",
      "skorKehadiran": 430,
      "skorTugas": 850,
      "skorTotal": 460,
      "grade": "A+",
      "rekomendasi": "BONUS_ELIGIBLE"
    }
  ]
}
```

#### `getKaryawanScorecard`
**Digunakan di**: Laporan → Tab Raport Kinerja (per karyawan)
```json
// Request
{ "action": "getKaryawanScorecard", "idKaryawan": "K001", "bulan": "2026-07" }

// Response
{
  "success": true,
  "scorecard": {
    "idKaryawan": "K001",
    "nama": "Abel",
    "bulan": "2026-07",
    "skorKehadiran": 430,
    "skorTugas": 850,
    "skorTotal": 460,
    "grade": "A+",
    "rekomendasi": "BONUS_ELIGIBLE",
    "detailKehadiran": {
      "hadirTepat": 22,
      "terlambatRingan": 3,
      "terlambatBerat": 0,
      "izin": 1,
      "alpa": 0,
      "bonusFullMonth": true,
      "bonusPerfect": false
    },
    "detailTugas": {
      "totalDitugaskan": 10,
      "totalSelesai": 10,
      "totalTepatWaktu": 9,
      "totalApproved": 10,
      "completionRate": 100,
      "onTimeRate": 90,
      "qualityRate": 100
    }
  },
  "trend": [
    { "bulan": "2026-02", "skorTotal": 380, "grade": "B+" },
    { "bulan": "2026-03", "skorTotal": 410, "grade": "A" },
    { "bulan": "2026-04", "skorTotal": 430, "grade": "A" },
    { "bulan": "2026-05", "skorTotal": 455, "grade": "A+" },
    { "bulan": "2026-06", "skorTotal": 460, "grade": "A+" },
    { "bulan": "2026-07", "skorTotal": 460, "grade": "A+" }
  ]
}
```

#### `getTokoScoreSummary`
**Digunakan di**: Monitor → Ringkasan per toko
```json
// Request
{ "action": "getTokoScoreSummary", "bulan": "2026-07" }

// Response
{
  "success": true,
  "data": [
    {
      "idToko": "T001",
      "namaToko": "Toko A",
      "totalKaryawan": 5,
      "rataRataSkor": 420,
      "distribusiGrade": { "A+": 1, "A": 2, "B+": 1, "B": 1, "C": 0, "D": 0, "E": 0 },
      "bonusEligible": 1,
      "watchList": 0,
      "redFlag": 0
    }
  ]
}
```

---

## 5. PERUBAHAN DI APK ADMIN

### 5.1 File yang TIDAK Diubah

| File | Status |
|---|---|
| `AdminMainScreen.kt` | ❌ TIDAK DIUBAH (tidak ada route/navigasi baru) |
| `Screen.kt` | ❌ TIDAK DIUBAH (tidak ada route baru) |
| `AdminDashboardScreen.kt` | ❌ TIDAK DIUBAH |
| `AdminJadwalScreen.kt` | ❌ TIDAK DIUBAH |
| Semua file lain yang tidak disebut | ❌ TIDAK DIUBAH |

### 5.2 File yang Diubah

| File | Perubahan |
|---|---|
| `AdminMonitorScreen.kt` | Tambah Tab "Kinerja" di dalam TabRow |
| `AdminReportScreen.kt` | Tambah Tab "Raport Kinerja" di dalam TabRow |
| `ApiService.kt` | Tambah model data & endpoint baru |

### 5.3 File BARU

| File | Fungsi |
|---|---|
| `ui/viewmodels/KinerjaViewModel.kt` | [NEW] ViewModel untuk data poin kinerja |

---

## 6. DETAIL PERUBAHAN UI

### 6.1 AdminMonitorScreen.kt — Tambah Tab "Kinerja"

**SEBELUM** (tab structure saat ini):
```
┌──────────────────────────────┐
│ Monitor                       │
│ [Monitoring Toko real-time]  │
│ List toko + karyawan         │
└──────────────────────────────┘
```

**SESUDAH** (tambah TabRow):
```
┌──────────────────────────────┐
│ Monitor                       │
│ ┌─────────┬──────────┐       │
│ │ Realtime │ Kinerja  │       │
│ └─────────┴──────────┘       │
│                               │
│ Tab 0: Realtime (existing)   │
│ Tab 1: Kinerja (BARU)        │
└──────────────────────────────┘
```

#### Tab "Kinerja" — Konten:

```
┌────────────────────────────────────────┐
│  📊 Poin Kinerja — Juli 2026          │
│  ┌──────┐  ┌──────────────────┐       │
│  │ ◄ ►  │  │ [Generate Skor]  │       │
│  │ Bulan │  └──────────────────┘       │
│  └──────┘                              │
│                                        │
│  ┌── Ringkasan Per Toko ──────────┐   │
│  │ Toko A     Avg: 420  ⭐ A       │   │
│  │ Toko B     Avg: 380  ⭐ B+      │   │
│  │ Toko C     Avg: 310  ⭐ B       │   │
│  └────────────────────────────────┘   │
│                                        │
│  ┌── Filter: [Semua▾] [Toko A▾] ──┐  │
│  │                                  │  │
│  │ #1 🏆 Abel    460  A+  BONUS    │  │
│  │ #2 ✅ Budi    430  A   RETAIN   │  │
│  │ #3 ✅ Citra   410  A   RETAIN   │  │
│  │ #4 ⚠️ Dedi    290  C   WATCH    │  │
│  │ #5 🚨 Eko     180  E   REVIEW   │  │
│  │                                  │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

**Komponen dalam Tab Kinerja:**

1. **Header**: Bulan selector (< Juli 2026 >) + tombol "Generate Skor"
2. **Ringkasan Per Toko**: Card horizontal per toko — rata-rata skor, grade dominan
3. **Leaderboard**: List karyawan sorted by skor (rank, foto, nama, skor, grade, badge rekomendasi)
4. **Filter**: Dropdown pilih toko, atau "Semua"

---

### 6.2 AdminReportScreen.kt — Tambah Tab "Raport Kinerja"

**SEBELUM** (tab structure saat ini):
```
┌──────────────────────────────┐
│ Laporan & Analitik            │
│ ┌────────┬────────┐          │
│ │ Harian │Bulanan │          │
│ └────────┴────────┘          │
│ [Existing report content]    │
└──────────────────────────────┘
```

**SESUDAH** (tambah tab):
```
┌──────────────────────────────┐
│ Laporan & Analitik            │
│ ┌────────┬────────┬─────────┐│
│ │ Harian │Bulanan │ Kinerja ││
│ └────────┴────────┴─────────┘│
│                               │
│ Tab 2: Raport Kinerja (BARU) │
└──────────────────────────────┘
```

#### Tab "Raport Kinerja" — Konten:

```
┌────────────────────────────────────────┐
│  📋 Raport Kinerja                     │
│  ┌──────┐  ┌────────────────────┐     │
│  │ ◄ ►  │  │ Pilih Karyawan ▾   │     │
│  │ Bulan │  └────────────────────┘     │
│  └──────┘                              │
│                                        │
│  ┌── Score Card ──────────────────┐   │
│  │  ┌───────┐                      │   │
│  │  │  A+   │  Abel               │   │
│  │  │  460  │  Toko A — Juli 2026  │   │
│  │  │ /500  │  🏆 BONUS ELIGIBLE   │   │
│  │  └───────┘                      │   │
│  └─────────────────────────────────┘   │
│                                        │
│  ┌── Breakdown ───────────────────┐   │
│  │ Kehadiran (50%)                 │   │
│  │ ████████████████████░░░ 430/500 │   │
│  │ Hadir:22 Telat:3 Izin:1 Alpa:0 │   │
│  │                                 │   │
│  │ Tugas (50%)                     │   │
│  │ █████████████████████░░ 850/1000│   │
│  │ Done:10/10 OnTime:90% Qual:100% │   │
│  └─────────────────────────────────┘   │
│                                        │
│  ┌── Trend 6 Bulan ───────────────┐   │
│  │     ★                           │   │
│  │    ╱ ╲         ★                │   │
│  │   ╱   ★    ★╱                   │   │
│  │  ★       ╱                      │   │
│  │ Feb Mar Apr Mei Jun Jul         │   │
│  └─────────────────────────────────┘   │
│                                        │
│  ┌── Riwayat ─────────────────────┐   │
│  │ Bulan    Hadir  Tugas  Total G │   │
│  │ Jul-26   430    850    460  A+ │   │
│  │ Jun-26   410    800    455  A+ │   │
│  │ Mei-26   400    750    430  A  │   │
│  └─────────────────────────────────┘   │
└────────────────────────────────────────┘
```

**Komponen dalam Tab Raport Kinerja:**

1. **Header**: Bulan selector + dropdown pilih karyawan (dengan foto)
2. **Score Card**: Grade besar (lingkaran), nama, toko, rekomendasi badge
3. **Breakdown**: 2 progress bar (Kehadiran & Tugas) dengan detail angka
4. **Trend**: Grafik garis 6 bulan (bisa pakai composable Canvas sederhana)
5. **Riwayat**: Tabel riwayat bulanan

---

## 7. MODEL DATA (Tambah di `ApiService.kt`)

```kotlin
// === POIN KINERJA ===

data class CalculateMonthlyScoresRequest(
    val action: String = "calculateMonthlyScores",
    val bulan: String  // "2026-07"
)
data class CalculateMonthlyScoresResponse(
    val success: Boolean,
    val bulan: String?,
    val generated: Int?,
    val errors: List<String>?,
    val error: String?
)

data class MonthlyScoreItem(
    val idKaryawan: String,
    val nama: String,
    val fotoProfil: String?,
    val idToko: String,
    val namaToko: String,
    val bulan: String,
    val skorKehadiran: Double,
    val skorTugas: Double,
    val skorTotal: Double,
    val grade: String,
    val rekomendasi: String
)

data class GetMonthlyScoresRequest(
    val action: String = "getMonthlyScores",
    val bulan: String,
    val idToko: String = ""  // kosong = semua toko
)
data class GetMonthlyScoresResponse(
    val success: Boolean,
    val data: List<MonthlyScoreItem>?,
    val error: String?
)

data class DetailKehadiran(
    val hadirTepat: Int,
    val terlambatRingan: Int,
    val terlambatBerat: Int,
    val izin: Int,
    val alpa: Int,
    val bonusFullMonth: Boolean,
    val bonusPerfect: Boolean
)

data class DetailTugas(
    val totalDitugaskan: Int,
    val totalSelesai: Int,
    val totalTepatWaktu: Int,
    val totalApproved: Int,
    val completionRate: Double,
    val onTimeRate: Double,
    val qualityRate: Double
)

data class KaryawanScorecardData(
    val idKaryawan: String,
    val nama: String,
    val bulan: String,
    val skorKehadiran: Double,
    val skorTugas: Double,
    val skorTotal: Double,
    val grade: String,
    val rekomendasi: String,
    val detailKehadiran: DetailKehadiran?,
    val detailTugas: DetailTugas?
)

data class ScoreTrendItem(
    val bulan: String,
    val skorTotal: Double,
    val grade: String
)

data class GetKaryawanScorecardRequest(
    val action: String = "getKaryawanScorecard",
    val idKaryawan: String,
    val bulan: String
)
data class GetKaryawanScorecardResponse(
    val success: Boolean,
    val scorecard: KaryawanScorecardData?,
    val trend: List<ScoreTrendItem>?,
    val error: String?
)

data class TokoScoreSummaryItem(
    val idToko: String,
    val namaToko: String,
    val totalKaryawan: Int,
    val rataRataSkor: Double,
    val distribusiGrade: Map<String, Int>?,
    val bonusEligible: Int,
    val watchList: Int,
    val redFlag: Int
)

data class GetTokoScoreSummaryRequest(
    val action: String = "getTokoScoreSummary",
    val bulan: String
)
data class GetTokoScoreSummaryResponse(
    val success: Boolean,
    val data: List<TokoScoreSummaryItem>?,
    val error: String?
)
```

### Endpoint GasApi (tambah di interface)

```kotlin
@POST("exec")
suspend fun calculateMonthlyScores(@Body request: CalculateMonthlyScoresRequest): CalculateMonthlyScoresResponse

@POST("exec")
suspend fun getMonthlyScores(@Body request: GetMonthlyScoresRequest): GetMonthlyScoresResponse

@POST("exec")
suspend fun getKaryawanScorecard(@Body request: GetKaryawanScorecardRequest): GetKaryawanScorecardResponse

@POST("exec")
suspend fun getTokoScoreSummary(@Body request: GetTokoScoreSummaryRequest): GetTokoScoreSummaryResponse
```

---

## 8. VIEWMODEL BARU

### `KinerjaViewModel.kt` [NEW]

```kotlin
class KinerjaViewModel : ViewModel() {
    // === Monitor Tab: Kinerja ===
    private val _monthlyScores = MutableStateFlow<List<MonthlyScoreItem>>(emptyList())
    val monthlyScores: StateFlow<List<MonthlyScoreItem>> = _monthlyScores

    private val _tokoSummary = MutableStateFlow<List<TokoScoreSummaryItem>>(emptyList())
    val tokoSummary: StateFlow<List<TokoScoreSummaryItem>> = _tokoSummary

    // === Report Tab: Raport Kinerja ===
    private val _scorecard = MutableStateFlow<KaryawanScorecardData?>(null)
    val scorecard: StateFlow<KaryawanScorecardData?> = _scorecard

    private val _trend = MutableStateFlow<List<ScoreTrendItem>>(emptyList())
    val trend: StateFlow<List<ScoreTrendItem>> = _trend

    // === Shared ===
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    private val _selectedBulan = MutableStateFlow(getCurrentBulan())
    val selectedBulan: StateFlow<String> = _selectedBulan

    fun setSelectedBulan(bulan: String) { _selectedBulan.value = bulan }

    // Functions:
    fun loadMonthlyScores(bulan: String, idToko: String = "") { ... }
    fun loadTokoSummary(bulan: String) { ... }
    fun loadKaryawanScorecard(idKaryawan: String, bulan: String) { ... }
    fun generateScores(bulan: String) { ... }

    private fun getCurrentBulan(): String { ... }
}
```

---

## 9. IMPLEMENTASI STEP-BY-STEP

### Phase 1: Backend (code.gs) — Tambah 4 function

| # | Task | File | Risiko |
|---|---|---|---|
| 1 | Tambah sheet `MONTHLY_SCORES` + `SCORE_AUDIT` di spreadsheet | Spreadsheet | Tidak ada |
| 2 | Tambah 4 case di `doPost()` switch | `code.gs` | Rendah — hanya tambah case baru |
| 3 | Buat function `calculateMonthlyScores()` | `code.gs` | Tidak ganggu — READ dari sheet existing |
| 4 | Buat function `getMonthlyScores()` | `code.gs` | Tidak ganggu — READ dari sheet baru |
| 5 | Buat function `getKaryawanScorecard()` | `code.gs` | Tidak ganggu — READ only |
| 6 | Buat function `getTokoScoreSummary()` | `code.gs` | Tidak ganggu — READ only |
| 7 | (Opsional) Setup time trigger tanggal 1 | `code.gs` | Terpisah dari trigger lain |

### Phase 2: APK — Model Data

| # | Task | File |
|---|---|---|
| 8 | Tambah model data (7 data class) | `ApiService.kt` |
| 9 | Tambah 4 endpoint di `GasApi` interface | `ApiService.kt` |

### Phase 3: APK — ViewModel

| # | Task | File |
|---|---|---|
| 10 | Buat `KinerjaViewModel.kt` | [NEW] `ui/viewmodels/KinerjaViewModel.kt` |

### Phase 4: APK — UI Monitor

| # | Task | File |
|---|---|---|
| 11 | Wrap konten existing di `AdminMonitorScreen` dalam TabRow | `AdminMonitorScreen.kt` |
| 12 | Tab 0: "Realtime" → konten existing (pindah ke dalam tab) | `AdminMonitorScreen.kt` |
| 13 | Tab 1: "Kinerja" → konten baru (leaderboard + ringkasan toko) | `AdminMonitorScreen.kt` |

### Phase 5: APK — UI Laporan

| # | Task | File |
|---|---|---|
| 14 | Tambah tab "Kinerja" di TabRow existing | `AdminReportScreen.kt` |
| 15 | Konten tab: scorecard + breakdown + trend + riwayat | `AdminReportScreen.kt` |

### Phase 6: Verifikasi

| # | Task |
|---|---|
| 16 | Build APK → pastikan compile sukses |
| 17 | Test tab Monitor → Kinerja → tampil leaderboard |
| 18 | Test tab Laporan → Kinerja → tampil scorecard per karyawan |
| 19 | Test generate skor → data tersimpan |
| 20 | Test tab Realtime (existing) → tetap berfungsi normal |

---

## 10. WARNA & VISUAL

### Grade Color Palette

| Grade | Background | Text |
|---|---|---|
| A+ | `#10B981` (emerald) | White |
| A | `#34D399` (green) | White |
| B+ | `#F59E0B` (amber) | White |
| B | `#FBBF24` (yellow) | `#92400E` |
| C | `#F97316` (orange) | White |
| D | `#EF4444` (red) | White |
| E | `#991B1B` (dark red) | White |

### Rekomendasi Badge

| Rekomendasi | Background | Text | Emoji |
|---|---|---|---|
| BONUS_ELIGIBLE | `#D1FAE5` | `#065F46` | 🏆 |
| RETAIN | `#DBEAFE` | `#1E40AF` | ✅ |
| WATCH | `#FEF3C7` | `#92400E` | ⚠️ |
| REVIEW | `#FEE2E2` | `#991B1B` | 🚨 |
| NOT_RECOMMENDED | `#FCA5A5` | `#7F1D1D` | ❌ |

### Score Circle (Composable)
- Lingkaran besar 80dp dengan Canvas arc
- Arc fill berdasarkan persentase (skorTotal/500)
- Grade text besar di tengah
- Warna gradient sesuai grade

### Progress Bar Breakdown
- Height 8dp, rounded corners
- Background: `Color(0xFFE5E7EB)`
- Fill: gradient sesuai grade color
- Animasi `animateFloatAsState` saat pertama load

---

## 11. CARA DISABLE JIKA BERMASALAH

| Aksi | Efek | Risiko |
|---|---|---|
| Hapus tab "Kinerja" dari TabRow di `AdminMonitorScreen.kt` | Tab hilang, monitor realtime tetap | Tidak ada |
| Hapus tab "Kinerja" dari TabRow di `AdminReportScreen.kt` | Tab hilang, laporan harian/bulanan tetap | Tidak ada |
| Hapus 4 case dari `doPost()` switch di `code.gs` | Endpoint tidak bisa dipanggil | Tidak ada |
| Hapus ViewModel `KinerjaViewModel.kt` | — | Tidak ada |
| Hapus model data dari `ApiService.kt` | — | Tidak ada |

**Sistem absensi, jadwal, tugas, chat, gaji → TETAP BERFUNGSI NORMAL.**

---

## 12. RINGKASAN PERUBAHAN

| Komponen | Sebelum | Sesudah | Jenis |
|---|---|---|---|
| Sheet Spreadsheet | 17 sheet | 19 sheet (+2 baru) | TAMBAH |
| `code.gs` endpoint | ~60 endpoint | ~64 endpoint (+4 baru) | TAMBAH case |
| `ApiService.kt` | model existing | +7 data class, +4 endpoint | TAMBAH |
| `KinerjaViewModel.kt` | — | [NEW] | FILE BARU |
| `AdminMonitorScreen.kt` | tanpa tab | +TabRow (Realtime \| Kinerja) | MODIFIKASI |
| `AdminReportScreen.kt` | tab Harian/Bulanan | +tab Kinerja | MODIFIKASI |
| `AdminMainScreen.kt` | — | — | TIDAK DIUBAH |
| `Screen.kt` | — | — | TIDAK DIUBAH |
| Bottom bar / Drawer | — | — | TIDAK DIUBAH |

---

*End of PRD Integrasi Poin Kinerja — Monitor & Laporan v1.0*
*Zero-Risk: Hanya tambah tab di screen existing, tidak ada screen/route baru.*
