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

    // Start Pusher Foreground Service (Disabled to remove persistent background notification)
    /*
    val serviceIntent = Intent(this, PusherForegroundService::class.java)

        startForegroundService(serviceIntent)
    } else {
        startService(serviceIntent)
    }
    */

    // Initialize Pusher Client directly in MainActivity
    com.pinguincell.absen.admin.api.PusherManager.initPusher()

    // Check & Register Firebase Token
    com.google.firebase.messaging.FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
        if (!task.isSuccessful) {
            android.util.Log.w("FCM_TOKEN_DEBUG", "Fetching FCM registration token failed", task.exception)
            android.widget.Toast.makeText(this, "FCM Admin Gagal: ${task.exception?.message}", android.widget.Toast.LENGTH_LONG).show()
        if (!task.isSuccessful) {
            android.util.Log.w("FCM_TOKEN_DEBUG", "Fetching FCM registration token failed", task.exception)
            android.widget.Toast.makeText(this, "FCM Admin Gagal: ${task.exception?.message}", android.widget.Toast.LENGTH_LONG).show()
            return@addOnCompleteListener
        }
        val token = task.result
        android.util.Log.d("FCM_TOKEN_DEBUG", "FCM Token berhasil: $token")
        android.widget.Toast.makeText(this, "FCM Admin Sukses!", android.widget.Toast.LENGTH_SHORT).show()

        // Send token to server
        val prefs = getSharedPreferences("AbsenLogin", android.content.Context.MODE_PRIVATE)
        val userId = prefs.getString("userId", null)
        if (userId != null) {
            kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
                try {
                    com.pinguincell.absen.admin.api.RetrofitClient.instance.registerFCMToken(
                        com.pinguincell.absen.admin.api.RegisterFCMTokenRequest(
                            idKaryawan = userId,
                            token = token
                        )
                    )
                    android.util.Log.d("FCM_TOKEN_DEBUG", "FCM Admin Token berhasil dikirim ke server")
                } catch (e: Exception) {
                    android.util.Log.e("FCM_TOKEN_DEBUG", "Gagal register admin token on launch", e)
                }
            }
        } else {
            android.util.Log.d("FCM_TOKEN_DEBUG", "Belum login, FCM token admin ditunda")
        }
    }

    enableEdgeToEdge()
    setContent {
      AbsenAdminTheme { Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) { AdminMainScreen() } }
    }
  }
}































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
        
        // Initialize CacheManager and OutboxManager
        com.pinguincell.absen.api.CacheManager.init(this)
        com.pinguincell.absen.api.OutboxManager.init(this)
        setContent {
            MaterialTheme {
                var isCheckingUpdate by remember { mutableStateOf(true) }
                var updateRequired by remember { mutableStateOf(false) }
                var updateUrl by remember { mutableStateOf("https://nafindo.github.io/absen/") }
                val lifecycleOwner = LocalLifecycleOwner.current

                // Function to check update
                suspend fun doCheckUpdate() {
                    try {
                        val response = RetrofitClient.instance.checkUpdate(CheckUpdateRequest())
                        if (response.success && response.latestVersion != null) {
                            val currentVersion = BuildConfig.VERSION_NAME
                            
                            // Normalisasi string versi dengan menghapus karakter selain angka
                            val serverVerStr = response.latestVersion.replace(Regex("[^0-9]"), "")
                            val currentVerStr = currentVersion.replace(Regex("[^0-9]"), "")
                            
                            val serverVerInt = serverVerStr.toIntOrNull() ?: 0
                            val currentVerInt = currentVerStr.toIntOrNull() ?: 0

                            // Update hanya jika 
                    }
                }

                // Check on Resume
                DisposableEffect(lifecycleOwner) {
                    val observer = LifecycleEventObserver { _, event ->
                        if (event == Life







                    onDispose {
                        lifecycleOwner.lifecycle.removeObserver(observer)
                    }
                }

                // Check Periodically (every 10 minutes)
                LaunchedEffect(Unit) {
                    doCheckUpdate() // Initial check
                    while(true) {
                        delay(10 * 60 * 1000L) // 10 minutes
                        doCheckUpdate()
                    }
                }

                if (isCheckingUpdate) {
                    Box(modifier = Modifier.fillMaxSize().background(Color.White), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFF3B82F6))
                    }
                    return@MaterialTheme
                }

                if (updateRequired) {
                    UpdateScreen(updateUrl = updateUrl)
                    return@MaterialTheme
                }
                val context = LocalContext.current
                val prefs = remember { context.getSharedPreferences("AbsenLogin", Context.MODE_PRIVATE) }
                var loggedInUser by remember {
                    val savedId = prefs.getString("userId", null)
                    if (savedId != null) {
                        mutableStateOf<User?>(User(





























                                    .background(Color.Black.copy(alpha = 0.3f))
                            )
                            
                            LoginScreen(onLoginSuccess = { user ->
                                val oldId = prefs.getString("userId", null)
                                if (oldId != null && oldId != user.id) {
                                    // Clear data from previous user
                                    com.pinguincell.absen.api.CacheManager.clearCache()
                                }
                                prefs.edit()
                                    .putString("userId", user.id)
                                    .putString("userNama", user.nama)
                                    .putString("userJabatan", user.jabatan)
                                    .putString("userToko", user.tokoDefault)
                                    .putString("userShift", user.shiftDefault)
                                    .putString("userFoto", user.fotoProfil)
                                    .putString("userFaceId", user.faceId)
                                    .apply()
                                loggedInUser = user
                                
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
                        }
                    }

                    NavHost(navController = navController, startDestination = "home") {
                        composable("home") {
                            HomeScreen(
                        composable("tugas") {
                            TugasScreen(
                                idKaryawan = loggedInUser!!.id,
                                idToko = loggedInUser!!.tokoDefault ?: "",
                                onNavigateBack = { navController.popBackStack() }
                            )
                        }
                        // Removed duplicated izin routes
                        composable("lembur") {
                            LemburScreen(
                                idKaryawan = loggedInUser?.id ?: "",
                                onNavigateBack = { navController.popBackStack() },
                                onNavigateToAjukanLembur = { navController.navigate("ajukan_lembur") }
                            )
                        }
                        composable("ajukan_lembur") {
                            AjukanLemburScreen(
                                idKaryawan = loggedInUser?.id ?: "",
                                nama = loggedInUser?.nama ?: "",
                                onNavigateBack = { navController.popBackStack() }



















                                AjukanIzinViewModel(loggedInUser!!.id, loggedInUser!!.nama)
                            }
                            AjukanIzinScreen(onBack = { navController.popBackStack() }, viewModel = ajukanIzinViewModel)
                                onBack = { navController.popBackStack() },
                                onAjukanIzin = { navController.navigate("ajukan_izin") },
                                viewModel = izinViewModel
                            )
                        }
                        composable("ajukan_izin") {
                            val ajukanIzinViewModel = androidx.compose.runtime.remember {
                                AjukanIzinViewModel(loggedInUser!!.id, loggedInUser!!.nama)
                            }
                            AjukanIzinScreen(onBack = { navController.popBackStack() }, viewModel = ajukanIzinViewModel)
                        }
                        composable("tukar_shift") {
                            TukarShiftScreen(
                                idKaryawan = loggedInUser?.id ?: "",
                                namaKaryawan = loggedInUser?.nama ?: "",
                                fotoUrl = loggedInUser?.fotoProfil ?: "",
                                onNavigateBack = { navController.popBackStack() }
                            )
                        }
                        composable("rekap") {
                            val rekapViewModel = androidx.compose.runtime.remember {
                                RekapViewModel(loggedInUser!!.id)
                            }
                            RekapScreen(onNavigateBack = { navController.popBackStack() }, viewModel = rekapViewModel)
                        }
                        composable("verify_gaji") {
                            val faceIdStr = loggedInUser!!.faceId
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
                                    LaunchedEffect(Unit) {
                        








































                        composable("chat") {
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










    val model = Build.MODEL
    return if (model.startsWith(manufacturer, ignoreCase = true)) {
        model.uppercase()
    } else {
        "${manufacturer.uppercase()} $model"
    }
}



@OptIn(ExperimentalMaterial3Api::class, androidx.compose.ui.ExperimentalComposeUiApi::class)
@Composable
fun LoginScreen(onLoginSuccess: (User) -> Unit) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    
    val primaryColor = Color(0xFF0D8ABC)
    val bgGradient = Brush.linearGradient(
        colors = listOf(Color(0xFF0D8ABC).copy(alpha = 0.4f), Color(0xFF065473).copy(alpha = 0.75f))
    )
    val cardShape = RoundedCornerShape(24.dp)
    
    var idKaryawan by remember { mutableStateOf("") }
    var selectedNama by remember { mutableStateOf("") }
    var pin by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    
    var showForceDialog by remember { mutableStateOf(false) }
    var forceMessage by remember { mutableStateOf("") }
    
    var karyawanList by remember { mutableStateOf<List<KaryawanItem>>(emptyList()) }
    var isKaryawanLoading by remember { mutableStateOf(true) }
    var expanded by remember { mutableStateOf(false) }
    var passwordVisible by remember { mutableStateOf(false) }
    val keyboardController = LocalSoftwareKeyboardController.current

    LaunchedEffect(Unit) {
        val cacheKey = "karyawan_list"
        val cacheData = com.pinguincell.absen.api.CacheManager.getCache<com.pinguincell.absen.api.KaryawanListResponse>(cacheKey)




















































































































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

                    Text(
                        "NAMA KARYAWAN",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF8B95A5),
                        letterSpacing = 0.8.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    
                    // Custom Dropdown / BottomSheet for Karyawan Selection
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp)
                            .background(Color(0xFFF8F9FA), RoundedCornerShape(16.dp))
















































































































































































































        modifier = Modifier
            .fillMaxSize()
            .graphicsLayer {
                scaleX = 1.3f
                scaleY = 1.3f
                translationX = offsetX
                translationY = offsetY
            }
    )
}

data class Snowflake(
    var x: Float,
    var y: Float,
    var radius: Float,
    var speed: Float,
    var drift: Float
)

@Composable
fun SnowAnimation() {
    val configuration = androidx.compose.ui.platform.LocalConfiguration.current
    val density = androidx.compose.ui.platform.LocalDensity.current
    val screenWidth = with(density) { configuration.screenWidthDp.dp.toPx() }
    val screenHeight = with(density) { configuration.screenHeightDp.dp.toPx() }

    val snowflakes = remember {
        List(50) {
            Snowflake(
                x = kotlin.random.Random.nextFloat() * screenWidth,
                y = kotlin.random.Random.nextFloat() * screenHeight,
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

