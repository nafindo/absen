import os

with open(r'd:\absen\absen-native\app\src\main\java\com\pinguincell\absen\MainActivity.kt', 'r', encoding='utf-8') as f:
    original_content = f.read()

# The file contains duplicated class MainActivity and getDeviceId/getDeviceName.
# We will split the file by 'class MainActivity'
parts = original_content.split('class MainActivity : ComponentActivity() {')

if len(parts) > 2:
    # There are duplicates!
    # parts[0] is imports
    # parts[1] is the first MainActivity
    # parts[2] is the second MainActivity
    
    # We want to keep parts[0] and parts[2] (because parts[2] might have the composables attached at the end, wait!)
    # Actually, the FIRST MainActivity was inserted by restore.py, and the SECOND was already there.
    # But wait, restore.py inserted it before LoginScreen, which means the SECOND one is the one that has LoginScreen inside it!
    # Let's verify by just using parts[0] + 'class MainActivity : ComponentActivity() {' + parts[2] ? NO!
    # The first one from restore.py was just a block of code, followed by the rest of the file which contains the old MainActivity!
    pass

# Better approach: Just use original recovered_lines.txt and inject carefully!
with open(r'd:\absen\recovered_lines.txt', 'r', encoding='utf-8') as f:
    recovered_content = f.read()
    
# From recovered_content, everything before @OptIn(ExperimentalMaterial3Api::class) is imports
optin_idx = recovered_content.find('@OptIn(ExperimentalMaterial3Api::class, androidx.compose.ui.ExperimentalComposeUiApi::class)')
imports_code = recovered_content[:optin_idx]
composables_code = recovered_content[optin_idx:]

# The imports from recovered_lines are mostly correct, but missing NavHost etc. Let's fix them manually.
imports_code += """
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.pinguincell.absen.api.CheckUpdateRequest
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.pinguincell.absen.ui.screens.*
import com.pinguincell.absen.ui.components.LiveCameraPreview

@Composable
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
                com.pinguincell.absen.api.ApkDownloader.installApk(context, state.uri)
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.6f))
            .clickable(enabled = false) {}, // Intercept clicks
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.85f)
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Default.SystemUpdate,
                    contentDescription = "Update",
                    modifier = Modifier.size(48.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Pembaruan Tersedia",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.Black
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Mengunduh versi terbaru... Mohon tunggu sebentar.",
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center,
                    color = Color.DarkGray
                )
                Spacer(modifier = Modifier.height(24.dp))

                when (downloadState) {
                    is com.pinguincell.absen.api.ApkDownloader.DownloadState.Downloading -> {
                        val progress = (downloadState as com.pinguincell.absen.api.ApkDownloader.DownloadState.Downloading).progress
                        LinearProgressIndicator(
                            progress = progress / 100f,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp)),
                            color = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(text = "${progress}%", color = Color.Black, fontWeight = FontWeight.Bold)
                    }
                    is com.pinguincell.absen.api.ApkDownloader.DownloadState.Success -> {
                        Text(text = "Unduhan selesai. Menginstal...", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                    }
                    is com.pinguincell.absen.api.ApkDownloader.DownloadState.Error -> {
                        Text(
                            text = "Gagal mengunduh: ${(downloadState as com.pinguincell.absen.api.ApkDownloader.DownloadState.Error).message}",
                            color = Color.Red,
                            fontSize = 12.sp,
                            textAlign = TextAlign.Center
                        )
                    }
                    else -> {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }
    }
}
"""

with open(r'd:\absen\restore.py', 'r', encoding='utf-8') as f:
    restore_content = f.read()

start_marker = 'main_activity_code = """'
end_marker = '"""\n\nstart_idx'
start = restore_content.find(start_marker) + len(start_marker)
end = restore_content.find(end_marker)
main_activity_code = restore_content[start:end]

main_activity_code = main_activity_code.replace('LemburViewModel(loggedInUser!!.id)', 'LemburViewModel()')
main_activity_code = main_activity_code.replace('AjukanLemburViewModel(loggedInUser!!.id, loggedInUser!!.nama)', 'AjukanLemburViewModel()')
main_activity_code = main_activity_code.replace('shiftDefault = prefs.getString("userShift", "") ?: "",', 'shiftDefault = prefs.getString("userShift", "") ?: "",\n                            pin = "",')
main_activity_code = main_activity_code.replace('com.pinguincell.absen.ui.components.LiveCameraPreview', 'LiveCameraPreview')
main_activity_code = main_activity_code.replace('com.pinguincell.absen.ui.screens.FaceRegistrationScreen', 'FaceRegistrationScreen')
main_activity_code = main_activity_code.replace('onAutoCapture = { bmp ->', 'onAutoCapture = { bmp: android.graphics.Bitmap ->')
main_activity_code = main_activity_code.replace('onSuccess = { base64 ->', 'onSuccess = { base64: String ->')
main_activity_code = main_activity_code.replace('popUpTo("home")', 'popUpTo(route = "home")')
main_activity_code = main_activity_code.replace('androidx.lifecycle.compose.LocalLifecycleOwner.current', 'LocalLifecycleOwner.current')
main_activity_code = main_activity_code.replace('androidx.navigation.compose.NavHost', 'NavHost')
main_activity_code = main_activity_code.replace('androidx.navigation.compose.composable', 'composable')
main_activity_code = main_activity_code.replace('androidx.navigation.compose.rememberNavController', 'rememberNavController')
main_activity_code = main_activity_code.replace('androidx.lifecycle.LifecycleEventObserver', 'LifecycleEventObserver')

full_code = imports_code + '\n' + main_activity_code + '\n' + composables_code

with open(r'd:\absen\absen-native\app\src\main\java\com\pinguincell\absen\MainActivity.kt', 'w', encoding='utf-8') as f:
    f.write(full_code)

print("Done cleaning up MainActivity.kt!")
