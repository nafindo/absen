import os

with open(r'd:\absen\absen-native\app\src\main\java\com\pinguincell\absen\MainActivity.kt', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('fun UpdateScreen')
if start != -1:
    # Also find the @Composable above it
    start_composable = content.rfind('@Composable', 0, start)
    if start_composable != -1 and (start - start_composable) < 50:
        start = start_composable

    end = content.find('fun LoginScreen', start)
    end = content.rfind('@OptIn', start, end)
    
    new_overlay_code = """@Composable
fun AutoUpdateOverlay(updateUrl: String) {
    val context = androidx.compose.ui.platform.LocalContext.current
    var downloadState by androidx.compose.runtime.remember { 
        androidx.compose.runtime.mutableStateOf<com.pinguincell.absen.api.ApkDownloader.DownloadState>(
            com.pinguincell.absen.api.ApkDownloader.DownloadState.Idle
        ) 
    }

    androidx.compose.runtime.LaunchedEffect(updateUrl) {
        com.pinguincell.absen.api.ApkDownloader.downloadApk(context, updateUrl).collect { state ->
            downloadState = state
            if (state is com.pinguincell.absen.api.ApkDownloader.DownloadState.Success) {
                com.pinguincell.absen.api.ApkDownloader.installApk(context, state.file)
            }
        }
    }

    // Show a small overlay at the top or bottom
    if (downloadState !is com.pinguincell.absen.api.ApkDownloader.DownloadState.Idle && downloadState !is com.pinguincell.absen.api.ApkDownloader.DownloadState.Success) {
        androidx.compose.foundation.layout.Box(
            modifier = androidx.compose.ui.Modifier.fillMaxSize(),
            contentAlignment = androidx.compose.ui.Alignment.BottomCenter
        ) {
            androidx.compose.foundation.layout.Row(
                modifier = androidx.compose.ui.Modifier
                    .padding(16.dp)
                    .fillMaxWidth()
                    .androidx.compose.foundation.background(
                        androidx.compose.ui.graphics.Color(0xFF333333), 
                        androidx.compose.foundation.shape.RoundedCornerShape(8.dp)
                    )
                    .padding(16.dp),
                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
            ) {
                androidx.compose.material3.CircularProgressIndicator(
                    modifier = androidx.compose.ui.Modifier.size(24.dp),
                    color = androidx.compose.ui.graphics.Color.White,
                    strokeWidth = 2.dp
                )
                androidx.compose.foundation.layout.Spacer(modifier = androidx.compose.ui.Modifier.width(16.dp))
                androidx.compose.material3.Text(
                    text = when (val state = downloadState) {
                        is com.pinguincell.absen.api.ApkDownloader.DownloadState.Downloading -> "Mengunduh pembaruan... ${state.progress}%"
                        is com.pinguincell.absen.api.ApkDownloader.DownloadState.Error -> "Gagal mengunduh: ${state.message}"
                        else -> "Memproses pembaruan..."
                    },
                    color = androidx.compose.ui.graphics.Color.White,
                    fontSize = 14.sp
                )
            }
        }
    }
}

"""
    content = content[:start] + new_overlay_code + content[end:]
    with open(r'd:\absen\absen-native\app\src\main\java\com\pinguincell\absen\MainActivity.kt', 'w', encoding='utf-8') as f:
        f.write(content)
    print('UpdateScreen replaced with AutoUpdateOverlay.')
else:
    print('fun UpdateScreen not found')
