# PRD: Review Kinerja Karyawan (Raport Bulanan)
## Absensi Pro — Fitur Tambahan (Read-Only dari Sistem Existing)
### Versi 5.0 — Zero Risk Integration

---

## 1. EXECUTIVE SUMMARY

### Situasi Saat Ini
- Sistem Absensi: BERJALAN (clock-in/out, foto, geotag, face recognition)
- Sistem Tugas: BERJALAN (assign, submit, approve, evidence)
- Review Kinerja: BELUM ADA (raport bulanan per karyawan)

### Tujuan PRD Ini
Tambahkan fitur Review Kinerja yang:
1. Hanya membaca data dari Sheet Absensi + Task yang sudah ada
2. Menghitung score otomatis dari data tersebut
3. Menampilkan raport bulanan per karyawan
4. Tidak mengubah sistem absensi/tugas yang berjalan
5. Tidak mengubah struktur Sheet yang sudah ada
6. Bisa di-disable kapan saja tanpa ganggu sistem

---

## 2. PRINSIP ZERO-RISK

1. READ-ONLY dari Sheet existing
   - Hanya SELECT/READ dari Absensi, Task_Assignments, dll.
   - TIDAK PERNAH INSERT/UPDATE/DELETE ke Sheet existing

2. WRITE hanya ke Sheet BARU
   - Semua hasil kalkulasi disimpan di Sheet baru (Monthly_Scores)
   - Jika fitur ini dihapus, Sheet baru dihapus = sistem aman

3. TIDAK ADA perubahan endpoint existing
   - doPost() yang lama tetap sama, tidak ditambah apa-apa
   - Fitur review pakai endpoint TERPISAH (bisa di-disable)

4. TIDAK ADA perubahan UI existing
   - Screen absensi/tugas tetap sama
   - Screen review adalah screen BARU (bisa diakses atau tidak)

5. BISA DI-DISABLE kapan saja
   - Hapus menu "Review Kinerja" dari sidebar = fitur hilang
   - Sistem absensi + tugas tetap jalan normal

6. TIDAK ADA cron job yang ganggu existing
   - Cron job review berjalan terpisah
   - Jika cron gagal, sistem absensi tetap jalan

---

## 3. ARSITEKTUR DATA (Sheet Baru SAJA)

### Sheet yang Sudah Ada (READ-ONLY)

- Data_Karyawan    -> Baca: id, nama, role, store_id, join_date
- Data_Toko        -> Baca: id, nama, lat, lng
- Absensi          -> Baca: employee_id, date, clock_in, status
- Shift_Jadwal     -> Baca: employee_id, date, shift_type
- Task_Assignments -> Baca: employee_id, task_id, status, deadline
- Tasks            -> Baca: task_id, type, difficulty, points

TIDAK BOLEH INSERT/UPDATE/DELETE ke Sheet ini!
TIDAK BOLEH TAMBAH/HAPUS KOLOM!
TIDAK BOLEH UBAH NAMA SHEET!

### Sheet BARU (Write-Only untuk Review)

Tambahkan HANYA 2 Sheet baru:

#### Sheet 1: Monthly_Scores (Hasil Kalkulasi)
A: score_id         (auto: SCR-YYYYMM-EMPID)
B: employee_id      (FK — READ dari Data_Karyawan)
C: store_id         (FK — READ dari Data_Karyawan)
D: year_month       (YYYY-MM)
E: attendance_score (0-500, hasil kalkulasi dari Absensi)
F: task_score       (0-1000, hasil kalkulasi dari Task_Assignments + Tasks)
G: total_score      (0-500, hasil normalisasi 50:50)
H: grade            (A+/A/B+/B/C/D/E)
I: recommendation   (BONUS_ELIGIBLE/RETAIN/WATCH/REVIEW/NOT_RECOMMENDED)
J: generated_at     (timestamp)
K: status           (ACTIVE/ARCHIVED)

#### Sheet 2: Score_Audit (Audit Trail Review)
A: audit_id
B: timestamp
C: action           (GENERATE/RECALCULATE/VIEW/EXPORT)
D: employee_id
E: year_month
F: old_score        (jika recalculate)
G: new_score        (jika recalculate)
H: triggered_by     (SYSTEM / OWNER / MANAGER)

---

## 4. SISTEM KALKULASI (Read-Only dari Existing)

### 4.1 Alur Kalkulasi

Step 1: CRON JOB jalan (tanggal 1, jam 01:00)
Step 2: Baca Sheet "Absensi" (READ-ONLY)
        -> Hitung: Hadir, Terlambat, Izin, Alpa
        -> Kalkulasi: Attendance Score (0-500)
Step 3: Baca Sheet "Task_Assignments" + "Tasks" (READ-ONLY)
        -> Hitung: Completion Rate, On-Time Rate, Quality Rate
        -> Kalkulasi: Task Score (0-1000)
Step 4: Normalisasi 50:50
        -> Total Score (0-500)
        -> Grade (A+ sampai E)
        -> Recommendation
Step 5: Simpan ke Sheet "Monthly_Scores" (WRITE — Sheet BARU)
Step 6: Tampilkan di UI "Review Kinerja" (Screen BARU)

### 4.2 Formula Kalkulasi

A. ATTENDANCE SCORE (0-500) — dari Sheet "Absensi"

Hadir Tepat Waktu     : +15 poin/hari
Terlambat <=15 menit  : +8 poin/hari
Terlambat >15 menit   : +3 poin/hari
Izin (dengan bukti)   : +10 poin/hari
Alpa                  : -20 poin/hari
Full Month Bonus      : +50 poin
Perfect Month Bonus   : +100 poin (di atas Full Month)

Attendance_Raw = SUM(poin harian) + bonus
Attendance_Raw = MIN(500, MAX(0, Attendance_Raw))

B. TASK SCORE (0-1000) — dari Sheet "Task_Assignments" + "Tasks"

Completion Rate = Selesai / Assigned x 100%
On-Time Rate    = On-Time / Selesai x 100%
Quality Rate    = Approved / Submitted x 100%

Base Score      = MIN(Completion Rate, 100%) x 600
On-Time Bonus   = On-Time Rate x 200
Quality Bonus   = Quality Rate x 200

Task_Raw = Base + On-Time + Quality
Task_Raw = MIN(1000, MAX(0, Task_Raw))

C. TOTAL SCORE (0-500)

Attendance_Pct = Attendance_Raw / 500 x 100%
Task_Pct       = Task_Raw / 1000 x 100%

Total_Pct = (Attendance_Pct x 0.50) + (Task_Pct x 0.50)
Total_Score = Total_Pct x 5  // skala 0-500

D. GRADE

A+ : >= 450    | A : 400-449    | B+ : 350-399
B  : 300-349   | C : 250-299    | D  : 200-249
E  : < 200

E. RECOMMENDATION

BONUS_ELIGIBLE  : A+ 2 bulan berturut + Attendance >= 80%
RETAIN          : Grade >= B+ 3 bulan berturut
WATCH           : Grade B/C atau turun 2 bulan
REVIEW          : Grade D atau Attendance < 60%
NOT_RECOMMENDED : Grade E 2 bulan berturut

---

## 5. CODE.GS — FILE TERPISAH

### 5.1 Struktur File

project/
|
├── Code.gs              <- FILE EXISTING (JANGAN UBAH!)
│   ├── doPost()         <- Endpoint absensi, tugas, chat, dll.
│   ├── clockIn()        <- Function absensi
│   ├── getTasks()       <- Function tugas
│   └── ...              <- Semua function existing
│
└── ReviewKinerja.gs     <- FILE BARU (Tambahkan ke project)
    ├── doGetReview()    <- Endpoint terpisah untuk review
    ├── calculateMonthlyScores()  <- Kalkulasi otomatis
    ├── getMyScorecard() <- Ambil raport karyawan
    ├── getTeamScores()  <- Ambil semua score tim
    ├── getOwnerReport() <- Dashboard owner
    └── ...              <- Helper functions

### 5.2 File Baru: ReviewKinerja.gs

```javascript
// ============================================
// FILE: ReviewKinerja.gs (BARU — Tambah ke project)
// ============================================
// FILE INI TERPISAH dari Code.gs existing
// Jika ada error di file ini, Code.gs existing tetap jalan
// ============================================

/**
 * Web App URL terpisah untuk Review Kinerja
 * Deploy sebagai web app terpisah atau gunakan doGet terpisah
 */
function doGetReview(e) {
  var action = e.parameter.action;

  if (action == 'getMyScorecard') return getMyScorecard(e);
  if (action == 'getTeamScores') return getTeamScores(e);
  if (action == 'getOwnerReport') return getOwnerReport(e);
  if (action == 'getScoreTrend') return getScoreTrend(e);

  return jsonResponseReview({status: 'error', message: 'Unknown action'});
}

/**
 * POST handler untuk Review Kinerja (terpisah dari doPost existing)
 */
function doPostReview(e) {
  var action = e.parameter.action;

  if (action == 'calculateMonthlyScores') return calculateMonthlyScores(e);
  if (action == 'recalculateScore') return recalculateScore(e);
  if (action == 'exportScorecard') return exportScorecard(e);
  if (action == 'triggerMonthlyCalculation') return triggerMonthlyCalculation(e);

  return jsonResponseReview({status: 'error', message: 'Unknown action: ' + action});
}

/**
 * JSON response helper (terpisah, tidak ganggu existing)
 */
function jsonResponseReview(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Get spreadsheet (sama spreadsheet, sheet berbeda)
 */
function getSpreadsheetReview() {
  // Ganti dengan ID spreadsheet Anda
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ============================================
// KALKULASI UTAMA (CRON JOB)
// ============================================

/**
 * Kalkulasi score bulanan untuk SEMUA karyawan
 * Jalan otomatis tanggal 1 jam 01:00 via cron
 * Baca dari Sheet existing, tulis ke Sheet Monthly_Scores (BARU)
 */
function calculateMonthlyScores(e) {
  try {
    var yearMonth = e && e.parameter && e.parameter.year_month 
      ? e.parameter.year_month 
      : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');

    var ss = getSpreadsheetReview();

    // READ dari Sheet existing (TIDAK DIUBAH!)
    var absensiSheet = ss.getSheetByName('Absensi');
    var taskAssignmentsSheet = ss.getSheetByName('Task_Assignments');
    var tasksSheet = ss.getSheetByName('Tasks');
    var karyawanSheet = ss.getSheetByName('Data_Karyawan');

    // WRITE ke Sheet baru
    var scoresSheet = ss.getSheetByName('Monthly_Scores');
    if (!scoresSheet) {
      // Buat sheet baru jika belum ada
      scoresSheet = ss.insertSheet('Monthly_Scores');
      scoresSheet.appendRow([
        'score_id', 'employee_id', 'store_id', 'year_month',
        'attendance_score', 'task_score', 'total_score', 'grade', 'recommendation',
        'generated_at', 'status'
      ]);
    }

    var karyawanData = karyawanSheet.getDataRange().getValues();
    var generated = 0;
    var errors = [];

    // Loop semua karyawan (skip header row 0)
    for (var i = 1; i < karyawanData.length; i++) {
      try {
        var employeeId = karyawanData[i][0];  // kolom A: id
        var employeeName = karyawanData[i][1]; // kolom B: nama
        var storeId = karyawanData[i][5];     // kolom F: store_id (sesuaikan)
        var role = karyawanData[i][3];        // kolom D: role
        var status = karyawanData[i][10];     // kolom K: status (sesuaikan)

        // Skip karyawan non-aktif
        if (status == 'NONAKTIF' || status == 'RESIGNED') continue;

        // === KALKULASI ATTENDANCE (baca dari Absensi) ===
        var attScore = calculateAttendanceFromSheet(absensiSheet, employeeId, yearMonth);

        // === KALKULASI TASK (baca dari Task_Assignments + Tasks) ===
        var taskScore = calculateTaskFromSheet(taskAssignmentsSheet, tasksSheet, employeeId, yearMonth);

        // === NORMALISASI 50:50 ===
        var attPct = (attScore.raw / 500) * 100;
        var taskPct = (taskScore.raw / 1000) * 100;
        var totalPct = (attPct * 0.50) + (taskPct * 0.50);
        var totalScore = totalPct * 5; // skala 0-500

        // === GRADE ===
        var grade = getGrade(totalScore);

        // === RECOMMENDATION ===
        var recommendation = getRecommendation(employeeId, grade, attPct, yearMonth, scoresSheet);

        // === SIMPAN KE Sheet BARU ===
        var scoreId = 'SCR-' + yearMonth.replace('-', '') + '-' + employeeId;

        // Cek apakah sudah ada score untuk bulan ini
        var existingRow = findExistingScore(scoresSheet, employeeId, yearMonth);

        if (existingRow > 0) {
          // Update existing
          scoresSheet.getRange(existingRow, 5).setValue(attScore.raw);
          scoresSheet.getRange(existingRow, 6).setValue(taskScore.raw);
          scoresSheet.getRange(existingRow, 7).setValue(totalScore);
          scoresSheet.getRange(existingRow, 8).setValue(grade);
          scoresSheet.getRange(existingRow, 9).setValue(recommendation);
          scoresSheet.getRange(existingRow, 10).setValue(new Date());
        } else {
          // Insert new
          scoresSheet.appendRow([
            scoreId,
            employeeId,
            storeId,
            yearMonth,
            attScore.raw,
            taskScore.raw,
            totalScore,
            grade,
            recommendation,
            new Date(),
            'ACTIVE'
          ]);
        }

        generated++;

      } catch (empError) {
        errors.push({employee_id: karyawanData[i][0], error: empError.toString()});
      }
    }

    // Log ke Score_Audit
    logScoreAudit('SYSTEM', 'GENERATE', '', yearMonth, '', '', 'Generated ' + generated + ' scores');

    return jsonResponseReview({
      status: 'success',
      year_month: yearMonth,
      generated_count: generated,
      errors: errors
    });

  } catch (error) {
    return jsonResponseReview({status: 'error', message: error.toString()});
  }
}

/**
 * Kalkulasi Attendance dari Sheet "Absensi" (READ-ONLY)
 */
function calculateAttendanceFromSheet(absensiSheet, employeeId, yearMonth) {
  var absensiData = absensiSheet.getDataRange().getValues();

  var totalPoints = 0;
  var hadirTepat = 0;
  var terlambatRingan = 0;
  var terlambatBerat = 0;
  var izin = 0;
  var alpa = 0;
  var lateCount = 0;

  for (var i = 1; i < absensiData.length; i++) {
    var row = absensiData[i];

    // Asumsi kolom: A=id, B=employee_id, C=store_id, D=date, E=clock_in, F=clock_out, G=status
    // SESUAIKAN dengan struktur Sheet Absensi Anda!
    var rowEmployeeId = row[1];  // kolom B
    var rowDate = row[3];         // kolom D
    var rowStatus = row[6];      // kolom G

    // Format date ke YYYY-MM
    var rowYearMonth = '';
    if (rowDate instanceof Date) {
      rowYearMonth = Utilities.formatDate(rowDate, Session.getScriptTimeZone(), 'yyyy-MM');
    } else {
      rowYearMonth = rowDate.toString().substring(0, 7);
    }

    if (rowEmployeeId == employeeId && rowYearMonth == yearMonth) {
      var status = rowStatus ? rowStatus.toString().toUpperCase().trim() : '';

      if (status == 'HADIR' || status == 'HADIR_TEPAT' || status == 'TEPAT_WAKTU') {
        totalPoints += 15;
        hadirTepat++;
      } else if (status == 'TERLAMBAT_RINGAN' || status == 'TERLAMBAT') {
        totalPoints += 8;
        terlambatRingan++;
        lateCount++;
      } else if (status == 'TERLAMBAT_BERAT') {
        totalPoints += 3;
        terlambatBerat++;
        lateCount++;
      } else if (status == 'IZIN' || status == 'SAKIT' || status == 'CUTI') {
        totalPoints += 10;
        izin++;
      } else if (status == 'ALPA' || status == 'TANPA_KETERANGAN') {
        totalPoints -= 20;
        alpa++;
      }
    }
  }

  // Full Month Bonus
  if (alpa == 0 && izin <= 2 && lateCount <= 2 && hadirTepat > 0) {
    totalPoints += 50;
  }

  // Perfect Month (100% hadir tepat waktu, 0 izin, 0 terlambat, 0 alpa)
  var totalHari = hadirTepat + terlambatRingan + terlambatBerat + izin + alpa;
  if (totalHari > 0 && hadirTepat == totalHari) {
    totalPoints += 50; // tambahan di atas full month
  }

  // Cap 0-500
  totalPoints = Math.max(0, Math.min(500, totalPoints));

  return {
    raw: totalPoints,
    hadir_tepat: hadirTepat,
    terlambat_ringan: terlambatRingan,
    terlambat_berat: terlambatBerat,
    izin: izin,
    alpa: alpa,
    late_count: lateCount
  };
}

/**
 * Kalkulasi Task dari Sheet "Task_Assignments" + "Tasks" (READ-ONLY)
 */
function calculateTaskFromSheet(taskAssignmentsSheet, tasksSheet, employeeId, yearMonth) {
  var assignmentsData = taskAssignmentsSheet.getDataRange().getValues();
  var tasksData = tasksSheet.getDataRange().getValues();

  var totalAssigned = 0;
  var totalSelesai = 0;
  var totalOnTime = 0;
  var totalSubmitted = 0;
  var totalApproved = 0;

  // Loop Task_Assignments
  for (var i = 1; i < assignmentsData.length; i++) {
    var row = assignmentsData[i];

    // Asumsi kolom: A=assignment_id, B=task_id, C=employee_id, D=store_id, 
    //               E=assigned_at, F=deadline, G=status, H=submitted_at
    // SESUAIKAN dengan struktur Sheet Task_Assignments Anda!
    var rowEmployeeId = row[2];  // kolom C
    var rowAssignedAt = row[4];  // kolom E
    var rowStatus = row[6];      // kolom G
    var rowSubmittedAt = row[7]; // kolom H
    var rowDeadline = row[5];    // kolom F

    // Format date ke YYYY-MM
    var rowYearMonth = '';
    if (rowAssignedAt instanceof Date) {
      rowYearMonth = Utilities.formatDate(rowAssignedAt, Session.getScriptTimeZone(), 'yyyy-MM');
    } else {
      rowYearMonth = rowAssignedAt.toString().substring(0, 7);
    }

    if (rowEmployeeId == employeeId && rowYearMonth == yearMonth) {
      totalAssigned++;

      var status = rowStatus ? rowStatus.toString().toUpperCase().trim() : '';

      if (status == 'SUBMITTED' || status == 'APPROVED' || status == 'AUTO_APPROVED') {
        totalSelesai++;
        totalSubmitted++;

        // Check on-time
        if (rowSubmittedAt && rowDeadline) {
          var submittedDate = rowSubmittedAt instanceof Date ? rowSubmittedAt : new Date(rowSubmittedAt);
          var deadlineDate = rowDeadline instanceof Date ? rowDeadline : new Date(rowDeadline);

          if (submittedDate <= deadlineDate) {
            totalOnTime++;
          }
        }
      }

      if (status == 'APPROVED') {
        totalApproved++;
      }

      if (status == 'REJECTED') {
        totalSubmitted++;
      }
    }
  }

  // Hitung Rate
  var completionRate = totalAssigned > 0 ? (totalSelesai / totalAssigned) : 0;
  var onTimeRate = totalSelesai > 0 ? (totalOnTime / totalSelesai) : 0;
  var qualityRate = totalSubmitted > 0 ? (totalApproved / totalSubmitted) : 0;

  // Kalkulasi Score
  var baseScore = Math.min(completionRate, 1.0) * 600;
  var onTimeBonus = onTimeRate * 200;
  var qualityBonus = qualityRate * 200;

  var taskRaw = baseScore + onTimeBonus + qualityBonus;
  taskRaw = Math.max(0, Math.min(1000, taskRaw));

  return {
    raw: taskRaw,
    completion_rate: completionRate * 100,
    ontime_rate: onTimeRate * 100,
    quality_rate: qualityRate * 100,
    total_assigned: totalAssigned,
    total_selesai: totalSelesai,
    total_ontime: totalOnTime,
    total_approved: totalApproved
  };
}

/**
 * Get Grade dari Total Score
 */
function getGrade(totalScore) {
  if (totalScore >= 450) return 'A+';
  if (totalScore >= 400) return 'A';
  if (totalScore >= 350) return 'B+';
  if (totalScore >= 300) return 'B';
  if (totalScore >= 250) return 'C';
  if (totalScore >= 200) return 'D';
  return 'E';
}

/**
 * Get Recommendation
 */
function getRecommendation(employeeId, grade, attPct, yearMonth, scoresSheet) {
  // Cek history 2 bulan terakhir
  var scoresData = scoresSheet.getDataRange().getValues();
  var prevGrades = [];

  for (var i = 1; i < scoresData.length; i++) {
    if (scoresData[i][1] == employeeId && scoresData[i][3] != yearMonth) {
      prevGrades.push({
        year_month: scoresData[i][3],
        grade: scoresData[i][7]
      });
    }
  }

  // Sort by year_month descending
  prevGrades.sort(function(a, b) { return b.year_month.localeCompare(a.year_month); });

  var lastGrade = prevGrades.length > 0 ? prevGrades[0].grade : '';
  var secondLastGrade = prevGrades.length > 1 ? prevGrades[1].grade : '';

  // Logic recommendation
  if (grade == 'A+' && lastGrade == 'A+' && attPct >= 80) {
    return 'BONUS_ELIGIBLE';
  }
  if ((grade == 'A+' || grade == 'A' || grade == 'B+') && 
      (lastGrade == 'A+' || lastGrade == 'A' || lastGrade == 'B+') &&
      (secondLastGrade == 'A+' || secondLastGrade == 'A' || secondLastGrade == 'B+')) {
    return 'RETAIN';
  }
  if (grade == 'B' || grade == 'C' || (lastGrade != '' && isLowerGrade(grade, lastGrade))) {
    return 'WATCH';
  }
  if (grade == 'D' || attPct < 60) {
    return 'REVIEW';
  }
  if (grade == 'E' || (lastGrade == 'E' && grade == 'E')) {
    return 'NOT_RECOMMENDED';
  }

  return 'RETAIN';
}

function isLowerGrade(current, previous) {
  var grades = ['E', 'D', 'C', 'B', 'B+', 'A', 'A+'];
  return grades.indexOf(current) < grades.indexOf(previous);
}

/**
 * Cari existing score di Monthly_Scores
 */
function findExistingScore(scoresSheet, employeeId, yearMonth) {
  var scoresData = scoresSheet.getDataRange().getValues();
  for (var i = 1; i < scoresData.length; i++) {
    if (scoresData[i][1] == employeeId && scoresData[i][3] == yearMonth) {
      return i + 1; // return row number (1-based)
    }
  }
  return 0;
}

// ============================================
// API ENDPOINTS untuk UI
// ============================================

/**
 * Get My Scorecard (untuk Karyawan)
 * GET/POST: action=getMyScorecard&employee_id=XXX&year_month=YYYY-MM
 */
function getMyScorecard(e) {
  try {
    var employeeId = e.parameter.employee_id;
    var yearMonth = e.parameter.year_month || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');

    var ss = getSpreadsheetReview();
    var scoresSheet = ss.getSheetByName('Monthly_Scores');
    var karyawanSheet = ss.getSheetByName('Data_Karyawan');

    if (!scoresSheet) {
      return jsonResponseReview({status: 'error', message: 'Monthly_Scores not found. Run calculation first.'});
    }

    var scoresData = scoresSheet.getDataRange().getValues();
    var karyawanData = karyawanSheet.getDataRange().getValues();

    // Cari score
    var scoreRow = null;
    for (var i = 1; i < scoresData.length; i++) {
      if (scoresData[i][1] == employeeId && scoresData[i][3] == yearMonth) {
        scoreRow = scoresData[i];
        break;
      }
    }

    if (!scoreRow) {
      return jsonResponseReview({status: 'error', message: 'Scorecard not found for ' + yearMonth});
    }

    // Get employee info
    var employeeName = '';
    var storeId = '';
    for (var j = 1; j < karyawanData.length; j++) {
      if (karyawanData[j][0] == employeeId) {
        employeeName = karyawanData[j][1];
        storeId = karyawanData[j][5]; // sesuaikan kolom
        break;
      }
    }

    // Get trend (6 bulan terakhir)
    var trend = [];
    for (var k = 1; k < scoresData.length; k++) {
      if (scoresData[k][1] == employeeId) {
        trend.push({
          year_month: scoresData[k][3],
          total_score: scoresData[k][6],
          grade: scoresData[k][7]
        });
      }
    }
    trend.sort(function(a, b) { return a.year_month.localeCompare(b.year_month); });

    return jsonResponseReview({
      status: 'success',
      employee: {
        id: employeeId,
        name: employeeName,
        store_id: storeId
      },
      scorecard: {
        year_month: scoreRow[3],
        attendance_score: scoreRow[4],
        task_score: scoreRow[5],
        total_score: scoreRow[6],
        grade: scoreRow[7],
        recommendation: scoreRow[8],
        generated_at: scoreRow[9]
      },
      trend: trend.slice(-6) // 6 bulan terakhir
    });

  } catch (error) {
    return jsonResponseReview({status: 'error', message: error.toString()});
  }
}

/**
 * Get Team Scores (untuk Manager)
 * GET/POST: action=getTeamScores&store_id=XXX&year_month=YYYY-MM
 */
function getTeamScores(e) {
  try {
    var storeId = e.parameter.store_id;
    var yearMonth = e.parameter.year_month || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');

    var ss = getSpreadsheetReview();
    var scoresSheet = ss.getSheetByName('Monthly_Scores');
    var karyawanSheet = ss.getSheetByName('Data_Karyawan');

    if (!scoresSheet) {
      return jsonResponseReview({status: 'error', message: 'Monthly_Scores not found'});
    }

    var scoresData = scoresSheet.getDataRange().getValues();
    var karyawanData = karyawanSheet.getDataRange().getValues();

    var teamScores = [];

    for (var i = 1; i < scoresData.length; i++) {
      if (scoresData[i][2] == storeId && scoresData[i][3] == yearMonth) {
        // Get employee name
        var empName = '';
        for (var j = 1; j < karyawanData.length; j++) {
          if (karyawanData[j][0] == scoresData[i][1]) {
            empName = karyawanData[j][1];
            break;
          }
        }

        teamScores.push({
          employee_id: scoresData[i][1],
          employee_name: empName,
          attendance_score: scoresData[i][4],
          task_score: scoresData[i][5],
          total_score: scoresData[i][6],
          grade: scoresData[i][7],
          recommendation: scoresData[i][8]
        });
      }
    }

    // Sort by total_score descending
    teamScores.sort(function(a, b) { return b.total_score - a.total_score; });

    // Add rank
    for (var k = 0; k < teamScores.length; k++) {
      teamScores[k].rank = k + 1;
    }

    return jsonResponseReview({
      status: 'success',
      store_id: storeId,
      year_month: yearMonth,
      total_employees: teamScores.length,
      scores: teamScores
    });

  } catch (error) {
    return jsonResponseReview({status: 'error', message: error.toString()});
  }
}

/**
 * Get Owner Report (untuk Owner — semua toko)
 * GET/POST: action=getOwnerReport&year_month=YYYY-MM
 */
function getOwnerReport(e) {
  try {
    var yearMonth = e.parameter.year_month || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');

    var ss = getSpreadsheetReview();
    var scoresSheet = ss.getSheetByName('Monthly_Scores');
    var karyawanSheet = ss.getSheetByName('Data_Karyawan');

    if (!scoresSheet) {
      return jsonResponseReview({status: 'error', message: 'Monthly_Scores not found'});
    }

    var scoresData = scoresSheet.getDataRange().getValues();
    var karyawanData = karyawanSheet.getDataRange().getValues();

    var summary = {
      total_karyawan: 0,
      avg_score: 0,
      a_plus: 0, a: 0, b_plus: 0, b: 0, c: 0, d: 0, e: 0,
      bonus_eligible: 0,
      retain: 0,
      watch: 0,
      review: 0,
      not_recommended: 0
    };

    var allScores = [];
    var totalScoreSum = 0;

    for (var i = 1; i < scoresData.length; i++) {
      if (scoresData[i][3] == yearMonth && scoresData[i][10] == 'ACTIVE') {
        summary.total_karyawan++;
        totalScoreSum += scoresData[i][6];

        var grade = scoresData[i][7];
        var rec = scoresData[i][8];

        if (grade == 'A+') summary.a_plus++;
        else if (grade == 'A') summary.a++;
        else if (grade == 'B+') summary.b_plus++;
        else if (grade == 'B') summary.b++;
        else if (grade == 'C') summary.c++;
        else if (grade == 'D') summary.d++;
        else if (grade == 'E') summary.e++;

        if (rec == 'BONUS_ELIGIBLE') summary.bonus_eligible++;
        else if (rec == 'RETAIN') summary.retain++;
        else if (rec == 'WATCH') summary.watch++;
        else if (rec == 'REVIEW') summary.review++;
        else if (rec == 'NOT_RECOMMENDED') summary.not_recommended++;

        // Get employee name
        var empName = '';
        var storeId = '';
        for (var j = 1; j < karyawanData.length; j++) {
          if (karyawanData[j][0] == scoresData[i][1]) {
            empName = karyawanData[j][1];
            storeId = karyawanData[j][5];
            break;
          }
        }

        allScores.push({
          employee_id: scoresData[i][1],
          employee_name: empName,
          store_id: storeId,
          total_score: scoresData[i][6],
          grade: grade,
          recommendation: rec
        });
      }
    }

    summary.avg_score = summary.total_karyawan > 0 ? Math.round(totalScoreSum / summary.total_karyawan) : 0;

    // Sort by score
    allScores.sort(function(a, b) { return b.total_score - a.total_score; });

    return jsonResponseReview({
      status: 'success',
      year_month: yearMonth,
      summary: summary,
      all_scores: allScores,
      top_performers: allScores.slice(0, 10),
      red_flags: allScores.filter(function(s) { return s.recommendation == 'WATCH' || s.recommendation == 'REVIEW' || s.recommendation == 'NOT_RECOMMENDED'; })
    });

  } catch (error) {
    return jsonResponseReview({status: 'error', message: error.toString()});
  }
}

// ============================================
// AUDIT LOG
// ============================================

function logScoreAudit(actor, action, employeeId, yearMonth, oldScore, newScore, reason) {
  try {
    var ss = getSpreadsheetReview();
    var auditSheet = ss.getSheetByName('Score_Audit');

    if (!auditSheet) {
      auditSheet = ss.insertSheet('Score_Audit');
      auditSheet.appendRow(['audit_id', 'timestamp', 'action', 'employee_id', 'year_month', 'old_score', 'new_score', 'triggered_by']);
    }

    auditSheet.appendRow([
      'AUD-' + new Date().getTime(),
      new Date(),
      action,
      employeeId,
      yearMonth,
      oldScore,
      newScore,
      actor
    ]);

  } catch (e) {
    Logger.log('Audit log error: ' + e);
  }
}

// ============================================
// CRON JOB SETUP
// ============================================

/**
 * Setup cron job untuk kalkulasi bulanan
 * Jalankan INI SEKALI untuk setup trigger
 */
function setupReviewCronJob() {
  // Hapus trigger lama jika ada
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() == 'calculateMonthlyScores') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Buat trigger baru: tanggal 1, jam 01:00
  ScriptApp.newTrigger('calculateMonthlyScores')
    .timeBased()
    .onMonthDay(1)
    .atHour(1)
    .nearMinute(0)
    .create();

  Logger.log('Review Kinerja cron job setup complete!');
  Logger.log('Trigger: Setiap tanggal 1 jam 01:00');
}

/**
 * Trigger manual untuk testing
 * Bisa dijalankan dari Apps Script editor
 */
function triggerMonthlyCalculation() {
  var result = calculateMonthlyScores({parameter: {}});
  Logger.log(result.getContent());
}
```

---

## 6. FRONTEND — SCREEN BARU (Tidak Ganggu Screen Existing)

### 6.1 Menu Sidebar (Tambahkan, tidak ubah yang ada)

```html
<!-- TAMBAHKAN INI ke sidebar karyawan (TIDAK UBAH yang ada) -->

<!-- EXISTING MENU (JANGAN UBAH) -->
<nav class="sidebar">
  <a href="#absensi" class="menu-item">
    <i class="icon-camera"></i> Absensi
  </a>
  <a href="#jadwal" class="menu-item">
    <i class="icon-calendar"></i> Jadwal
  </a>
  <a href="#chat" class="menu-item">
    <i class="icon-chat"></i> Chat
  </a>
  <a href="#tugas" class="menu-item">
    <i class="icon-tasks"></i> Tugas
  </a>
  <a href="#setting" class="menu-item">
    <i class="icon-settings"></i> Setting
  </a>

  <!-- NEW: Review Kinerja (TAMBAH INI SAJA) -->
  <div class="menu-divider"></div>
  <a href="#review-kinerja" class="menu-item menu-new" id="menu-review-kinerja">
    <i class="icon-chart"></i> 
    <span>Review Kinerja</span>
    <span class="badge badge-new">NEW</span>
  </a>
</nav>
```

### 6.2 Screen Review Kinerja — Karyawan

```html
<!-- SCREEN: Review Kinerja (Karyawan) -->
<div id="screen-review-kinerja" class="screen hidden">

  <!-- Header -->
  <div class="review-header">
    <h2>Review Kinerja</h2>
    <select id="review-month-select">
      <option value="2026-07">Juli 2026</option>
      <option value="2026-06">Juni 2026</option>
      <option value="2026-05">Mei 2026</option>
    </select>
  </div>

  <!-- Score Card -->
  <div class="score-card">
    <div class="score-circle grade-a-plus">
      <span class="score-grade">A+</span>
      <span class="score-total">480</span>
      <span class="score-max">/ 500</span>
    </div>
    <div class="score-info">
      <p class="score-recommendation recommendation-bonus">
        BONUS ELIGIBLE
      </p>
      <p class="score-date">Periode: Juli 2026</p>
    </div>
  </div>

  <!-- Breakdown -->
  <div class="score-breakdown">
    <h3>Breakdown Score</h3>

    <div class="breakdown-item">
      <div class="breakdown-label">
        <span>Kehadiran</span>
        <span class="breakdown-weight">50%</span>
      </div>
      <div class="breakdown-bar">
        <div class="breakdown-fill" style="width: 92%"></div>
      </div>
      <div class="breakdown-value">
        <span>460 / 500</span>
        <span class="breakdown-pct">92%</span>
      </div>
      <div class="breakdown-detail">
        Hadir: 26 | Izin: 2 | Alpa: 0 | Terlambat: 2
      </div>
    </div>

    <div class="breakdown-item">
      <div class="breakdown-label">
        <span>Tugas</span>
        <span class="breakdown-weight">50%</span>
      </div>
      <div class="breakdown-bar">
        <div class="breakdown-fill" style="width: 100%"></div>
      </div>
      <div class="breakdown-value">
        <span>1000 / 1000</span>
        <span class="breakdown-pct">100%</span>
      </div>
      <div class="breakdown-detail">
        Completion: 100% | On-Time: 100% | Quality: 100%
      </div>
    </div>
  </div>

  <!-- Trend Chart -->
  <div class="score-trend">
    <h3>Trend 6 Bulan Terakhir</h3>
    <canvas id="trend-chart"></canvas>
  </div>

  <!-- History Table -->
  <div class="score-history">
    <h3>Riwayat Bulanan</h3>
    <table class="history-table">
      <thead>
        <tr>
          <th>Bulan</th>
          <th>Kehadiran</th>
          <th>Tugas</th>
          <th>Total</th>
          <th>Grade</th>
        </tr>
      </thead>
      <tbody id="history-tbody">
        <!-- Diisi oleh JavaScript -->
      </tbody>
    </table>
  </div>

</div>
```

### 6.3 Screen Review Kinerja — Manager/Owner

```html
<!-- SCREEN: Review Kinerja — Team (Manager/Owner) -->
<div id="screen-team-kinerja" class="screen hidden">

  <div class="review-header">
    <h2>Kinerja Tim</h2>
    <div class="filter-bar">
      <select id="team-store-select">
        <option value="all">Semua Toko</option>
        <option value="toko-a">Toko A</option>
        <option value="toko-b">Toko B</option>
      </select>
      <select id="team-month-select">
        <option value="2026-07">Juli 2026</option>
        <option value="2026-06">Juni 2026</option>
      </select>
      <button id="btn-export-team" class="btn-export">Export</button>
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="summary-cards">
    <div class="summary-card card-green">
      <span class="summary-number">5</span>
      <span class="summary-label">Bonus Eligible</span>
    </div>
    <div class="summary-card card-blue">
      <span class="summary-number">28</span>
      <span class="summary-label">Retain</span>
    </div>
    <div class="summary-card card-yellow">
      <span class="summary-number">7</span>
      <span class="summary-label">Watch</span>
    </div>
    <div class="summary-card card-red">
      <span class="summary-number">2</span>
      <span class="summary-label">Review</span>
    </div>
  </div>

  <!-- Team Table -->
  <div class="team-table-container">
    <table class="team-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Karyawan</th>
          <th>Kehadiran</th>
          <th>Tugas</th>
          <th>Total</th>
          <th>Grade</th>
          <th>Rekomendasi</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody id="team-tbody">
        <!-- Diisi oleh JavaScript -->
      </tbody>
    </table>
  </div>

</div>
```

### 6.4 JavaScript untuk Review Kinerja (Tambah file baru)

```javascript
// ============================================
// FILE: review-kinerja.js (BARU — tambah ke project)
// ============================================

const REVIEW_API_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

const ReviewKinerja = {

  // Current user info (ambil dari session/login yang sudah ada)
  currentUser: null,

  init() {
    this.currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    this.bindEvents();
  },

  bindEvents() {
    // Menu click
    document.getElementById('menu-review-kinerja').addEventListener('click', () => {
      this.showScreen('review-kinerja');
      this.loadMyScorecard();
    });

    // Month selector change
    document.getElementById('review-month-select').addEventListener('change', (e) => {
      this.loadMyScorecard(e.target.value);
    });
  },

  showScreen(screenId) {
    // Sembunyikan semua screen (yang existing + yang baru)
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById('screen-' + screenId).classList.remove('hidden');
  },

  async loadMyScorecard(yearMonth) {
    try {
      const month = yearMonth || this.getCurrentYearMonth();

      const response = await fetch(REVIEW_API_URL + '?action=getMyScorecard' + 
        '&employee_id=' + encodeURIComponent(this.currentUser.id) +
        '&year_month=' + encodeURIComponent(month));

      const data = await response.json();

      if (data.status === 'success') {
        this.renderScorecard(data.scorecard);
        this.renderTrend(data.trend);
        this.renderHistory(data.trend);
      } else {
        this.showError(data.message);
      }

    } catch (error) {
      this.showError('Gagal memuat scorecard: ' + error.message);
    }
  },

  renderScorecard(scorecard) {
    // Update score circle
    const gradeEl = document.querySelector('.score-grade');
    const totalEl = document.querySelector('.score-total');
    const recEl = document.querySelector('.score-recommendation');

    gradeEl.textContent = scorecard.grade;
    gradeEl.className = 'score-grade grade-' + scorecard.grade.toLowerCase().replace('+', '-plus');
    totalEl.textContent = Math.round(scorecard.total_score);

    recEl.textContent = this.getRecommendationEmoji(scorecard.recommendation) + ' ' + scorecard.recommendation;
    recEl.className = 'score-recommendation recommendation-' + scorecard.recommendation.toLowerCase().replace('_', '-');

    // Update breakdown
    document.querySelector('.breakdown-item:nth-child(1) .breakdown-fill').style.width = (scorecard.attendance_score / 500 * 100) + '%';
    document.querySelector('.breakdown-item:nth-child(2) .breakdown-fill').style.width = (scorecard.task_score / 1000 * 100) + '%';
  },

  renderTrend(trend) {
    // Gunakan Chart.js atau canvas manual
    const canvas = document.getElementById('trend-chart');
    const ctx = canvas.getContext('2d');

    // Simple line chart
    // ... (implementasi chart)
  },

  renderHistory(trend) {
    const tbody = document.getElementById('history-tbody');
    tbody.innerHTML = trend.map(t => `
      <tr>
        <td>${this.formatMonth(t.year_month)}</td>
        <td>${t.attendance_score || '-'}</td>
        <td>${t.task_score || '-'}</td>
        <td><strong>${Math.round(t.total_score)}</strong></td>
        <td><span class="badge-grade grade-${t.grade.toLowerCase().replace('+', '-plus')}">${t.grade}</span></td>
      </tr>
    `).join('');
  },

  getRecommendationEmoji(rec) {
    const emojis = {
      'BONUS_ELIGIBLE': '🏆',
      'RETAIN': '✅',
      'WATCH': '⚠️',
      'REVIEW': '🚨',
      'NOT_RECOMMENDED': '❌'
    };
    return emojis[rec] || '';
  },

  getCurrentYearMonth() {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  },

  formatMonth(yearMonth) {
    const [year, month] = yearMonth.split('-');
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return months[parseInt(month)] + ' ' + year;
  },

  showError(message) {
    // Tampilkan error toast/alert
    alert(message);
  }
};

// Initialize saat DOM ready
document.addEventListener('DOMContentLoaded', () => {
  ReviewKinerja.init();
});
```

---

## 7. CSS untuk Review Kinerja (Tambah file baru atau append)

```css
/* ============================================ */
/* FILE: review-kinerja.css (BARU — tambah ke project) */
/* ============================================ */

/* Score Circle */
.score-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: white;
  margin-bottom: 20px;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid rgba(255,255,255,0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.score-grade {
  font-size: 32px;
  font-weight: bold;
}

.score-total {
  font-size: 24px;
  font-weight: bold;
}

.score-max {
  font-size: 14px;
  opacity: 0.8;
}

/* Grade Colors */
.grade-a-plus { background: linear-gradient(135deg, #11998e, #38ef7d); }
.grade-a { background: linear-gradient(135deg, #56ab2f, #a8e063); }
.grade-b-plus { background: linear-gradient(135deg, #f7971e, #ffd200); }
.grade-b { background: linear-gradient(135deg, #f6d365, #fda085); }
.grade-c { background: linear-gradient(135deg, #ff9966, #ff5e62); }
.grade-d { background: linear-gradient(135deg, #eb3349, #f45c43); }
.grade-e { background: linear-gradient(135deg, #8e0e00, #1f1c18); }

/* Breakdown */
.breakdown-item {
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.breakdown-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 500;
}

.breakdown-bar {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}

.breakdown-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.breakdown-value {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6c757d;
}

/* Recommendation Badges */
.recommendation-bonus { background: #d4edda; color: #155724; }
.recommendation-retain { background: #d1ecf1; color: #0c5460; }
.recommendation-watch { background: #fff3cd; color: #856404; }
.recommendation-review { background: #f8d7da; color: #721c24; }
.recommendation-not-recommended { background: #f5c6cb; color: #721c24; }

/* Team Table */
.team-table {
  width: 100%;
  border-collapse: collapse;
}

.team-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
}

.team-table td {
  padding: 12px;
  border-bottom: 1px solid #e9ecef;
}

.table-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 8px;
  vertical-align: middle;
}

.badge-grade {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.badge-rec {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.summary-card {
  padding: 16px;
  border-radius: 12px;
  text-align: center;
}

.summary-number {
  display: block;
  font-size: 32px;
  font-weight: bold;
  color: white;
}

.summary-label {
  font-size: 12px;
  color: rgba(255,255,255,0.9);
}

.card-green { background: linear-gradient(135deg, #11998e, #38ef7d); }
.card-blue { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.card-yellow { background: linear-gradient(135deg, #f6d365, #fda085); }
.card-red { background: linear-gradient(135deg, #ff9966, #ff5e62); }
```

---

## 8. IMPLEMENTATION CHECKLIST (Zero Risk)

### Phase 1: Backend (ReviewKinerja.gs) — 1 Hari
- [ ] Buat file baru ReviewKinerja.gs (JANGAN ubah Code.gs existing)
- [ ] Copy-paste semua function dari section 5
- [ ] SESUAIKAN NOMOR KOLOM dengan struktur Sheet Anda (lihat catatan di bawah)
- [ ] Buat Sheet Monthly_Scores dan Score_Audit manual di spreadsheet
- [ ] Test function calculateMonthlyScores() dengan data dummy
- [ ] Test function getMyScorecard() dengan Postman

### Phase 2: Frontend (HTML/CSS/JS) — 1 Hari
- [ ] Tambah menu "Review Kinerja" di sidebar (copy-paste dari section 6.1)
- [ ] Buat screen review-kinerja (copy-paste dari section 6.2)
- [ ] Tambah file review-kinerja.js (copy-paste dari section 6.4)
- [ ] Tambah file review-kinerja.css (copy-paste dari section 7)
- [ ] Test buka screen Review Kinerja

### Phase 3: Integrasi — 1 Hari
- [ ] Hubungkan frontend dengan backend (ganti YOUR_SCRIPT_ID)
- [ ] Test end-to-end: login -> buka Review Kinerja -> lihat scorecard
- [ ] Test dengan data real (1 karyawan)
- [ ] Jika error, cek console log

### Phase 4: Deployment — 1 Hari
- [ ] Deploy ReviewKinerja.gs sebagai web app terpisah (atau gabung)
- [ ] Setup cron job: jalankan setupReviewCronJob() sekali
- [ ] Monitor 1 minggu
- [ ] Jika ada masalah: hapus menu "Review Kinerja" dari sidebar = fitur hilang, sistem aman

---

## 9. CATATAN PENTING: SESUAIKAN KOLOM!

### Anda HARUS sesuaikan nomor kolom di ReviewKinerja.gs dengan struktur Sheet Anda!

```javascript
// ============================================
// SESUAIKAN INI dengan struktur Sheet Anda!
// ============================================

// Sheet "Absensi" — sesuaikan nomor kolom:
var rowEmployeeId = row[1];  // kolom B = index 1
var rowDate = row[3];         // kolom D = index 3
var rowStatus = row[6];      // kolom G = index 6

// Jika struktur Sheet Anda BEDA, ubah nomor index-nya!
// Contoh: jika status di kolom H (index 7):
// var rowStatus = row[7];

// Sheet "Task_Assignments" — sesuaikan nomor kolom:
var rowEmployeeId = row[2];   // kolom C = index 2
var rowAssignedAt = row[4];   // kolom E = index 4
var rowStatus = row[6];       // kolom G = index 6
var rowSubmittedAt = row[7];  // kolom H = index 7
var rowDeadline = row[5];     // kolom F = index 5

// Sheet "Data_Karyawan" — sesuaikan nomor kolom:
var employeeId = karyawanData[i][0];   // kolom A = index 0
var employeeName = karyawanData[i][1]; // kolom B = index 1
var storeId = karyawanData[i][5];      // kolom F = index 5
var role = karyawanData[i][3];         // kolom D = index 3
var status = karyawanData[i][10];      // kolom K = index 10
```

### Cara Cek Nomor Kolom:
1. Buka spreadsheet Anda
2. Lihat Sheet "Absensi" — catat: status ada di kolom mana?
3. Lihat Sheet "Task_Assignments" — catat: status, deadline, submitted_at ada di kolom mana?
4. Lihat Sheet "Data_Karyawan" — catat: store_id, role, status ada di kolom mana?
5. Ubah nomor index di ReviewKinerja.gs sesuai catatan Anda

---

## 10. CARA DISABLE (Jika Ada Masalah)

Jika fitur ini bermasalah, cukup lakukan ini:

1. Hapus menu "Review Kinerja" dari sidebar HTML
2. Hapus file ReviewKinerja.gs (jika deploy terpisah)
3. Hapus trigger cron: ScriptApp.getProjectTriggers() -> delete trigger calculateMonthlyScores
4. Sistem absensi + tugas Anda TETAP JALAN NORMAL

---

## 11. RINGKASAN PERUBAHAN

| Komponen | Sebelum | Sesudah | Status |
|----------|---------|---------|--------|
| Sheet | 6 sheet | 8 sheet (+2 baru) | Tambah |
| File Code.gs | 1 file | 2 file (+1 baru) | Tambah |
| Endpoint | ~15 endpoint | ~20 endpoint (+5 baru) | Tambah |
| Cron Job | ~3 cron | ~4 cron (+1 baru) | Tambah |
| Menu Karyawan | 5 menu | 6 menu (+1 baru) | Tambah |
| Menu Admin | ~5 menu | ~6 menu (+1 baru) | Tambah |
| Screen Karyawan | ~8 screen | ~9 screen (+1 baru) | Tambah |
| Screen Admin | ~10 screen | ~11 screen (+1 baru) | Tambah |
| CSS/JS | existing | + review-kinerja.js, + review-kinerja.css | Tambah |

Tidak ada yang diubah atau dihapus dari sistem existing.

---

## 12. TESTING CHECKLIST

- [ ] Test 1: Buka screen Review Kinerja -> lihat scorecard -> tidak error
- [ ] Test 2: Jalankan calculateMonthlyScores() manual -> score tersimpan di Monthly_Scores
- [ ] Test 3: Ganti bulan di dropdown -> score berubah sesuai bulan
- [ ] Test 4: Buka screen Kinerja Tim (manager) -> lihat semua karyawan -> tidak error
- [ ] Test 5: Buka Dashboard Owner -> lihat summary -> tidak error
- [ ] Test 6: Cron job jalan otomatis tanggal 1 -> score generate otomatis
- [ ] Test 7: Hapus menu Review Kinerja dari sidebar -> sistem absensi tetap jalan

---

*End of PRD Review Kinerja v5.0 — Zero Risk Integration*
*Absensi Pro (C) 2026*
*Total: 12 sections, 2 new sheets, 1 new file, 5 new endpoints, 1 new cron job, 2 new screens*
