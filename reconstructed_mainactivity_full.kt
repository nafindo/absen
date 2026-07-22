package com.pinguincell.absen

import android.content.Context
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import java.io.File
import android.os.Environment
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.animation.core.*
import androidx.compose.ui.BiasAlignment
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions













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















































































                        downloadState = com.pinguincell.absen.api.ApkDownloader.DownloadState.Idle
                        val f = File(context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "update.apk")
                        if (f.exists()) f.delete()
                    }) {
                        Text("Download Ulang", color = Color.Gray, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        installSplashScreen()
        
        // --- Play sound and vibrate on startup ---
        try {
            val vibrator = getSystemService(android.content.Context.VIBRATOR_SERVICE) as android.os.Vibrator
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                vibrator.vibrate(android.os.VibrationEffect.createOneShot(300, android.os.VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(300)
            }
            
            val soundUri = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_NOTIFICATION)
            val r = android.media.RingtoneManager.getRingtone(applicationContext, soundUri)
            r.play()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        // ------------------------------------------

        com.pinguincell.absen.sync.AppLifecycleObserver.init()
        com.pinguincell.absen.api.NotificationHelper.initChannels(this)

        // Battery Optimization & AutoStart (PRD FCM)
        val batteryHelper = com.pinguincell.absen.utils.BatteryOptimizationHelper(this)
        if (!batteryHelper.isBatteryOptimizationIgnored()) {
            batteryHelper.requestBatteryOptimizationWhitelist()
            
            // Also show autostart guide
            val autoStartHelper = com.pinguincell.absen.utils.AutoStartHelper(this)
            autoStartHelper.showAutoStartGuide()
        }

        // Cek Firebase Token
        com.google.firebase.messaging.FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                android.util.Log.w("FCM_TOKEN_DEBUG", "Fetching FCM registration token failed", task.exception)
                android.widget.Toast.makeText(this, "FCM Gagal: ${task.exception?.message}", android.widget.Toast.LENGTH_LONG).show()
                return@addOnCompleteListener
            }
            val token = task.result
            android.util.Log.d("FCM_TOKEN_DEBUG", "FCM Token berhasil: $token")
            android.widget.Toast.makeText(this, "FCM Sukses!", android.widget.Toast.LENGTH_SHORT).show()

            // Send token to server
            val prefs = getSharedPreferences("AbsenLogin", android.content.Context.MODE_PRIVATE)
            val userId = prefs.getString("userId", null)
            if (userId != null) {
                kotlinx.coroutines.CoroutineScope




















































































































































                                    .apply()
                                loggedInUser = user
                                
                                // Fetch and send FCM Token on login
                                com.google.firebase.messaging.FirebaseMessaging.getInstance().token.addOnCompleteListener { tokenTask ->
                                    if (tokenTask.isSuccessful) {
                                        val fcmToken = tokenTask.result
                                        kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
                                            try {
                                                com.pinguincell.absen.api.RetrofitClient.instance.registerFCMToken(
                                                    com.pinguincell.absen.api.RegisterFCMTokenRequest(
                                                        idKaryawan = user.id,
                                                        token = fcmToken
                                                    )
                                                )
                                                android.util.Log.d("FCM_TOKEN_DEBUG", "FCM Token dikirim saat login")
                                            } catch (e: Exception) {
                                                android.util.Log.e("FCM_TOKEN_DEBUG", "Gagal kirim FCM Token saat login", e)
                                            }
                                        }
                                    }
                                }
                            })
                        }
                    }
                } else {
                    val context = LocalContext.current
                    val chatViewModel = androidx.compose.runtime.remember {
                        ChatViewModel(context.applicationContext as android.app.Application, loggedInUser!!.id, loggedInUser!!.nama)
                    }
                    val unreadChatCount by chatViewModel.unreadCount.collectAsState()
                    val navController = rememberNavController()
                    
                    LaunchedEffect(navController) {
                        navController.addOnDestinationChangedListener { _, destination, _ ->
                            com.pinguincell.absen.sync.AppLifecycleObserver.currentScreen = destination.route ?: "home"
                        }
                    }

                    LaunchedEffect(Unit) {
                        com.pinguincell.absen.api.PusherManager.chatEvents.collect { event ->
                            if (com.pinguincell.absen.sync.AppLifecycleObserver.isForeground) {
                                if (event.eventName == "new-message") {
                                    com.pinguincell.absen.api.NotificationHelper.playNotificationSound(context)
                                    if (com.pinguincell.absen.sync.AppLifecycleObserver.currentScreen != "chat") {
                                        android.widget.Toast.makeText(context, "Ada pesan chat baru!", android.widget.Toast.LENGTH_SHORT).show()
















































































































































                                }
                            }
                        }
                        composable("gaji") {
                            val gajiViewModel = androidx.compose.runtime.remember {
                                GajiViewModel(loggedInUser!!.id)
                            }
                            GajiScreen(onNavigateBack = { navController.popBackStack() }, viewModel = gajiViewModel)
                        }
                        composable("chat") {
                            ChatScreen(onNavigateBack = { navController.popBackStack() }, viewModel = chatViewModel, loggedInUserId = loggedInUser!!.id)
                        }
                        composable("face_registration") {
                            com.pinguincell.absen.ui.screens.FaceRegistrationScreen(
                                user = loggedInUser!!,
                                onBack = { navController.popBackStack() },
                                onSuccess = { base64 ->
                                    val updatedUser = loggedInUser!!.copy(faceId = base64)
                                    loggedInUser = updatedUser
                                    prefs.edit().putString("userFaceId", base64).apply()
                                    navController.popBackStack()
                                    Toast.makeText(context, "Face ID tersimpan", Toast.LENGTH_SHORT).show()
                                }
                            )
                        }
                    }
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        PusherManager.disconnect()
    }







































































































































































                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 10.dp),
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp)
                ) {
                    if (errorMessage != null) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color(0xFFFFF2F2), RoundedCornerShape(12.dp))
                                .border(1.dp, Color(0xFFFFD6D6), RoundedCornerShape(12.dp))
                                .padding(12.dp)
                        ) {
                            Text(errorMessage!!, color = Color(0xFFFF3B30), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                        "NAMA KARYAWAN",
                    Text(
                        "NAMA KARYAWAN",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF8B95A5),
                        letterSpacing = 0.8.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Box(
                    // Custom Dropdown / BottomSheet for Karyawan Selection
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
// MISSING LINE 801
// MISSING LINE 802
// MISSING LINE 803
// MISSING LINE 804
// MISSING LINE 805
// MISSING LINE 806
// MISSING LINE 807
// MISSING LINE 808
// MISSING LINE 809
// MISSING LINE 810
// MISSING LINE 811
// MISSING LINE 812
// MISSING LINE 813
// MISSING LINE 814
// MISSING LINE 815
// MISSING LINE 816
// MISSING LINE 817
// MISSING LINE 818
// MISSING LINE 819
// MISSING LINE 820
// MISSING LINE 821
// MISSING LINE 822
// MISSING LINE 823
// MISSING LINE 824
// MISSING LINE 825
// MISSING LINE 826
// MISSING LINE 827
// MISSING LINE 828
// MISSING LINE 829
// MISSING LINE 830
// MISSING LINE 831
// MISSING LINE 832
// MISSING LINE 833
// MISSING LINE 834
// MISSING LINE 835
// MISSING LINE 836
// MISSING LINE 837
// MISSING LINE 838
// MISSING LINE 839
// MISSING LINE 840
// MISSING LINE 841
// MISSING LINE 842
// MISSING LINE 843
// MISSING LINE 844
// MISSING LINE 845
// MISSING LINE 846
// MISSING LINE 847
// MISSING LINE 848
// MISSING LINE 849
// MISSING LINE 850
// MISSING LINE 851
// MISSING LINE 852
// MISSING LINE 853
// MISSING LINE 854
// MISSING LINE 855
// MISSING LINE 856
// MISSING LINE 857
// MISSING LINE 858
// MISSING LI
























































































































































































        }
    val snowflakes = remember {
        List(50) {
            Snowflake(
                x = kotlin.random.Random.nextFloat() * screenWidth,
                y = kotlin.random.Random.nextFloat() * screenHeight,
                radius = kotlin.random.Random.nextFloat() * 5f + 2f,
                speed = kotlin.random.Random.nextFloat() * 3f + 1f,
                drift = (kotlin.random.Random.nextFloat() - 0.5f) * 2f
            )
        }
    }
// MISSING LINE 1056
    var time by remember { mutableStateOf(0f) }
    LaunchedEffect(Unit) {
        while (true) {
            androidx.compose.runtime.withFrameMillis { time = it.toFloat() }
            snowflakes.forEach { flake ->
                flake.y += flake.speed
                flake.x += flake.drift
                if (flake.y > screenHeight) {
                    flake.y = -10f
                    flake.x = kotlin.random.Random.nextFloat() * screenWidth
                }
                if (flake.x > screenWidth + 10f) flake.x = -10f
                if (flake.x < -10f) flake.x = screenWidth + 10f
            }
        }
    }
// MISSING LINE 1073
    androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxSize()) {
        val trigger = time // Trigger recomposition
        snowflakes.forEach { flake ->
            drawCircle(
                color = Color.White.copy(alpha = 0.8f),
                radius = flake.radius,
                center = androidx.compose.ui.geometry.Offset(flake.x, flake.y)
            )
        }
    }
}

