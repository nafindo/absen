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























































































                            coroutineScope.launch {
                                // If the URL is just a github pages root, let's just use it, but typically it should be an APK.
                                // If it fails to download (e.g., HTML response), it will show error.
                                com.pinguincell.absen.api.ApkDownloader.downloadApk(context, updateUrl).collect {
                                    downloadState = it
                                    if (it is com.pinguincell.absen.api.ApkDownloader.DownloadState.Success) {
                                        com.pinguincell.absen.api.ApkDownloader.installApk(context, it.file)
                                    }
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Unduh & Install", color = Color.White)
                    }
                }
                is com.pinguincell.absen.api.ApkDownloader.DownloadState.Downloading -> {
                    Text("Mengunduh... ${state.progress}%", fontSize = 14.sp, color = Color(0xFF3B82F6))
                    Spacer(modifier = Modifier.height(8.dp))
                    LinearProgressIndicator(
                        progress = { state.progress / 100f },
                        modifier = Modifier.fillMaxWidth().height(8.dp),
                        color = Color(0xFF3B82F6),
                    )
                }
                is com.pinguincell.absen.api.ApkDownloader.DownloadState.Success -> {







































            
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
                kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
                    try {
                        com.pinguincell.absen.api.RetrofitClient.instance.registerFCMToken(
                            com.pinguincell.absen.api.RegisterFCMTokenRequest(
                                idKaryawan = userId,
                                token = token
                            )
                        )
                        android.util.Log.d("FCM_TOKEN_DEBUG", "FCM Token berhasil dikirim ke server")
                    } catch (e: Exception) {
                        android.util.Log.e("FCM_TOKEN_DEBUG", "Gagal mengirim token FCM ke server", e)
                    }
                }
            }
        }

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            if (androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                androidx.core.app.ActivityCompat.requestPermissions(this, arrayOf(android.Manifest.permission.POST_NOTIFICATIONS), 101)
            }
        }

        // Pusher telah dinonaktifkan sepenuhnya. Rute notifikasi menggunakan FCM sesuai PRD.
        























































































































                                    .putString("userNama", user.nama)
                                    .putString("userJabatan", user.jabatan)
                                    .putString("userToko", user.tokoDefault)
                                    .putString("userShift", user.shiftDefault)
                                    .putString("userFoto", user.fotoProfil)
                                    .putString("userFaceId", user.faceId)
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
                        }
                    }

                    NavHost(navController = navController, startDestination = "home") {
                        composable("home") {
                            HomeScreen(





































































                            if (faceIdStr.isNullOrEmpty()) {
                                LaunchedEffect(Unit) {
                                    Toast.makeText(context, "Anda harus mendaftar Face ID 3D terlebih dahulu!", Toast.LENGTH_LONG).show()
                                    navController.popBackStack()
                                }
                            } else {
                                val profileEmbedding = remember(faceIdStr) {
                                      try {
                                          val bytes = android.util.Base64.decode(faceIdStr, android.util.Base64.NO_WRAP)
                                          val buffer = java.nio.ByteBuffer.wrap(bytes)
                                          val floatArray = FloatArray(bytes.size / 4)
                                          for (i in floatArray.indices) {
                                              floatArray[i] = buffer.getFloat()
                                          }
                                          floatArray
                                    } catch (e: Exception) {
                                        null
                                    }
                                }
                                
                                var isVerified by remember { mutableStateOf(false) }
                                
                                if (isVerified) {
                      










































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























































































































































































































































































































































































































































    val configuration = androidx.compose.ui.platform.LocalConfiguration.current
    val density = androidx.compose.ui.platform.LocalDensity.current
    val screenWidth = with(density) { configuration.screenWidthDp.dp.toPx() }
    val screenHeight = with(density) { configuration.screenHeightDp.dp.toPx() }

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

