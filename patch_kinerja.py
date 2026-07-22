import re
import sys

def patch_code_gs():
    with open('d:/absen/code.gs', 'r', encoding='utf-8') as f:
        content = f.read()

    # Restore the getKinerja route
    content = content.replace("case 'getKinerja': return jsonResponse(getMyScorecard(data));", "case 'getKinerja': return jsonResponse(getKinerja(data));")
    
    # Also fix success inside getOwnerReport, getTeamScores, calculateMonthlyScores
    # We will do a generic replacement: status: 'success' -> success: true, status: 'success'
    content = content.replace("status: 'success'", "success: true, status: 'success'")
    # And status: 'error', message -> success: false, status: 'error', error
    content = content.replace("status: 'error', message", "success: false, status: 'error', error")

    # Now we inject getKinerja implementation at the end of the file
    get_kinerja_code = """
// ============================================
// REAL getKinerja FOR ANDROID COMPATIBILITY
// ============================================
function getKinerja(data) {
  try {
    var idKaryawan = data.idKaryawan;
    var bulan = data.bulan || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');

    var ss = getSpreadsheetReview();
    var scoresSheet = ss.getSheetByName('Monthly_Scores');
    var karyawanSheet = ss.getSheetByName('Data_Karyawan');
    
    if (!scoresSheet) {
      return { success: false, error: 'Monthly_Scores not found. Harap hitung kinerja terlebih dahulu.' };
    }

    var scoresData = scoresSheet.getDataRange().getValues();
    var karyawanData = karyawanSheet.getDataRange().getValues();

    var monthlyScores = [];
    var scorecard = null;

    for (var i = 1; i < scoresData.length; i++) {
      if (scoresData[i][3] == bulan && scoresData[i][10] == 'ACTIVE') {
        var empId = scoresData[i][1];
        
        var empName = '';
        var storeName = '';
        var storeId = scoresData[i][2];
        
        for (var j = 1; j < karyawanData.length; j++) {
          if (karyawanData[j][0] == empId) {
            empName = karyawanData[j][1];
            // Cari nama toko dari storesSheet jika ada, untuk saat ini pakai storeId
            storeName = storeId;
            break;
          }
        }

        var item = {
          idKaryawan: empId,
          nama: empName,
          fotoProfil: null,
          idToko: storeId,
          namaToko: storeName,
          bulan: bulan,
          skorKehadiran: scoresData[i][4],
          skorTugas: scoresData[i][5],
          skorTotal: scoresData[i][6],
          grade: scoresData[i][7],
          rekomendasi: scoresData[i][8]
        };

        monthlyScores.push(item);

        if (idKaryawan && idKaryawan == empId) {
          scorecard = {
            idKaryawan: item.idKaryawan,
            nama: item.nama,
            bulan: item.bulan,
            skorKehadiran: item.skorKehadiran,
            skorTugas: item.skorTugas,
            skorTotal: item.skorTotal,
            grade: item.grade,
            rekomendasi: item.rekomendasi,
            detailKehadiran: { hadirTepat: 0, terlambatRingan: 0, terlambatBerat: 0, izin: 0, alpa: 0, bonusFullMonth: false, bonusPerfect: false },
            detailTugas: { totalDitugaskan: 0, totalSelesai: 0, totalTepatWaktu: 0, totalApproved: 0, completionRate: 0, onTimeRate: 0, qualityRate: 0 }
          };
        }
      }
    }

    return {
      success: true,
      monthlyScores: monthlyScores,
      scorecard: scorecard,
      error: null
    };

  } catch (e) {
    return { success: false, error: e.toString() };
  }
}
"""
    if "function getKinerja(" not in content:
        content += get_kinerja_code

    with open('d:/absen/code.gs', 'w', encoding='utf-8') as f:
        f.write(content)

    print("Patched code.gs successfully!")

if __name__ == '__main__':
    patch_code_gs()
