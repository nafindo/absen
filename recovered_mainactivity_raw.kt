Created At: 2026-06-05T12:01:44Z
Completed At: 2026-06-05T12:01:45Z
File Path: `file:///d:/absen/absen-native/app/src/main/java/com/pinguincell/absen/MainActivity.kt`
Total Lines: 1085
Total Bytes: 53978
Showing lines 1 to 200
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
1: package com.pinguincell.absen
2: 
3: import android.content.Context
4: import android.os.Build
5: import android.os.Bundle
6: import android.provider.Settings
7: import android.widget.Toast
8: import androidx.activity.ComponentActivity
9: import androidx.activity.compose.setContent
10: import androidx.compose.foundation.background
11: import androidx.compose.foundation.border
12: import androidx.compose.foundation.clickable
13: import androidx.compose.foundation.layout.*
14: import androidx.compose.foundation.shape.CircleShape
15: import androidx.compose.foundation.shape.RoundedCornerShape
16: import java.io.File
17: import android.os.Environment
18: import androidx.compose.material3.*
19: import androidx.compose.runtime.*
20: import androidx.compose.animation.core.*
21: import androidx.compose.ui.BiasAlignment
22: import androidx.compose.ui.Alignment
23: import androidx.compose.ui.Modifier
24: import androidx.compose.ui.draw.clip
25: import androidx.compose.ui.graphics.Brush
26: import androidx.compose.ui.graphics.Color
27: import androidx.compose.ui.graphics.graphicsLayer
28: import androidx.compose.ui.platform.LocalContext
29: import androidx.compose.ui.text.font.FontWeight
30: import androidx.compose.ui.text.style.TextAlign
31: import androidx.compose.ui.unit.dp
32: import androidx.compose.ui.unit.sp
33: import androidx.compose.ui.text.input.PasswordVisualTransformation
34: import androidx.compose.ui.text.input.VisualTransformation
35: import androidx.compose.ui.text.input.KeyboardType
36: import androidx.compose.foundation.text.KeyboardOptions
3
<truncated 6820 bytes>
           TextButton(onClick = {
164:                         downloadState = com.pinguincell.absen.api.ApkDownloader.DownloadState.Idle
165:                         val f = File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "update.apk")
166:                         if (f.exists()) f.delete()
167:                     }) {
168:                         Text("Download Ulang", color = Color.Gray, fontSize = 12.sp)
169:                     }
170:                 }
171:             }
172:         }
173:     }
174: }
175: 
176: class MainActivity : ComponentActivity() {
177:     override fun onCreate(savedInstanceState: Bundle?) {
178:         super.onCreate(savedInstanceState)
179:         installSplashScreen()
180:         
181:         // --- Play sound and vibrate on startup ---
182:         try {
183:             val vibrator = getSystemService(android.content.Context.VIBRATOR_SERVICE) as android.os.Vibrator
184:             if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
185:                 vibrator.vibrate(android.os.VibrationEffect.createOneShot(300, android.os.VibrationEffect.DEFAULT_AMPLITUDE))
186:             } else {
187:                 @Suppress("DEPRECATION")
188:                 vibrator.vibrate(300)
189:             }
190:             
191:             val soundUri = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_NOTIFICATION)
192:             val r = android.media.RingtoneManager.getRingtone(applicationContext, soundUri)
193:             r.play()
194:         } catch (e: Exception) {
195:             e.printStackTrace()
196:         }
197:         // ------------------------------------------
198: 
199:         com.pinguincell.absen.sync.AppLifecycleObserver.init()
200:         com.pinguincell.absen.api.NotificationHelper.initChannels(this)
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
