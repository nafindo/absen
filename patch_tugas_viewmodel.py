import os

file_path = r'd:\absen\absen-native\app\src\main\java\com\pinguincell\absen\TugasViewModel.kt'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

func = '''
    fun forceRefreshTugas() {
        viewModelScope.launch {
            try {
                val res = RetrofitClient.instance.getTugasList(TugasRequest(idKaryawan = ""))
                if (res.success && res.data != null) {
                    com.pinguincell.absen.api.CacheManager.saveCache("tugas_list", res.data)
                }
            } catch (e: Exception) {
                // Silent catch
            }
        }
    }
'''

if 'fun forceRefreshTugas' not in content:
    content = content.replace('fun kerjakanTugas', func + '\n    fun kerjakanTugas')
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully patched TugasViewModel.kt")
else:
    print("forceRefreshTugas already exists")
