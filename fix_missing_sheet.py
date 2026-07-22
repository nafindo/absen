import sys

def fix_code_gs():
    with open('d:/absen/code.gs', 'r', encoding='utf-8') as f:
        content = f.read()

    replacement = """
    if (!scoresSheet) {
      scoresSheet = ss.insertSheet('Monthly_Scores');
      scoresSheet.appendRow(['score_id', 'employee_id', 'store_id', 'year_month', 'attendance_score', 'task_score', 'total_score', 'grade', 'recommendation', 'generated_at', 'status']);
    }
"""

    # Fix getOwnerReport
    content = content.replace("if (!scoresSheet) {\n      return jsonResponse({success: false, status: 'error', error: 'Monthly_Scores not found'});\n    }", replacement)
    content = content.replace("if (!scoresSheet) {\n      return {status: 'error', message: 'Monthly_Scores not found'};\n    }", replacement)
    content = content.replace("if (!scoresSheet) {\n      return jsonResponse({status: 'error', message: 'Monthly_Scores not found'});\n    }", replacement)
    
    # Fix getTeamScores
    content = content.replace("if (!scoresSheet) {\n      return jsonResponse({success: false, status: 'error', error: 'Monthly_Scores not found'});\n    }", replacement)
    
    # Fix getKinerja
    content = content.replace("if (!scoresSheet) {\n      return { success: false, error: 'Monthly_Scores not found. Harap hitung kinerja terlebih dahulu.' };\n    }", replacement)

    # Some of the replacements above might overlap, so I will do a regex replacement just in case
    import re
    content = re.sub(r"if \(!scoresSheet\) \{\s+return.*?Monthly_Scores not found.*?;\s+\}", replacement, content)

    with open('d:/absen/code.gs', 'w', encoding='utf-8') as f:
        f.write(content)

    print("Fixed Monthly_Scores not found error.")

if __name__ == '__main__':
    fix_code_gs()
