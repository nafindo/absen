import sys

def fix_sheet_names():
    with open('d:/absen/code.gs', 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace sheet names in the ReviewKinerja section to match global constants
    content = content.replace("getSheetByName('Data_Karyawan')", "getSheetByName('MASTER_KARYAWAN')")
    content = content.replace("getSheetByName('Absensi')", "getSheetByName('ABSENSI')")
    content = content.replace("getSheetByName('Tasks')", "getSheetByName('TUGAS')")
    content = content.replace("getSheetByName('Task_Assignments')", "getSheetByName('LOG_TUGAS')")

    with open('d:/absen/code.gs', 'w', encoding='utf-8') as f:
        f.write(content)

    print("Fixed sheet names in code.gs successfully!")

if __name__ == '__main__':
    fix_sheet_names()
