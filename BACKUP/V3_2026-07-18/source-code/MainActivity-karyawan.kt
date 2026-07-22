package com.pinguincell.absen

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver

import androidx.compose.ui.platform.LocalLifecycleOwner
import com.pinguincell.absen.*
import com.pinguincell.absen.ui.screens.*
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.google.firebase.messaging.FirebaseMessaging
import com.pinguincell.absen.api.*
import com.pinguincell.absen.utils.AutoStartHelper
import com.pinguincell.absen.utils.BatteryOptimizationHelper
import com.pinguincell.absen.sync.AppLifecycleObserver
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.io.File
import kotlin.random.Random
import android.os.Environment

@Composable
fun UpdateScreen(updateUrl: String) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var downloadState by remember { mutableStateOf<ApkDownloader.DownloadState>(ApkDownloader.DownloadState.Idle) }

    Box(
        modifier = Modifier.fillMaxSize().background(Color(0xFFF1F5F9)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(24.dp).background(Color.White, RoundedCornerShape(16.dp)).padding(24.dp)
        ) {
            Icon(
                imageVector = Icons.Default.SystemUpdate,
                contentDescription = "Update",
                tint = Color(0xFF3B82F6),
                modifier = Modifier.size(64.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                "Update Tersedia",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = Color.Black
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                "Versi terbaru aplikasi telah tersedia. Anda harus memperbarui aplikasi untuk melanjutkan.",
                fontSize = 14.sp,
                color = Color.Gray,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(24.dp))
            
            when (val state = downloadState) {
                is ApkDownloader.DownloadState.Idle,
                is ApkDownloader.DownloadState.Error -> {
                    if (state is ApkDownloader.DownloadState.Error) {
                        Text(state.message, color = Color.Red, fontSize = 12.sp, textAlign = TextAlign.Center)
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                    Button(
                        onClick = {
                            coroutineScope.launch {
                                ApkDownloader.downloadApk(context, updateUrl).collect {
                                    downloadState = it
                                    if (it is ApkDownloader.DownloadState.Success) {
                                        ApkDownloader.installApk(context, it.file)
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
                is ApkDownloader.DownloadState.Downloading -> {
                    Text("Mengunduh... ${state.progress}%", fontSize = 14.sp, color = Color(0xFF3B82F6))
                    Spacer(modifier = Modifier.height(8.dp))
                    LinearProgressIndicator(
                        progress = { state.progress / 100f },
                        modifier = Modifier.fillMaxWidth().height(8.dp),
                        color = Color(0xFF3B82F6),
                    )
                }
                is ApkDownloader.DownloadState.Success -> {
                    Text("Unduhan Selesai!", fontSize = 16.sp, color = Color(0xFF10B981), fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = { ApkDownloader.installApk(context, state.file) },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Install Sekarang", color = Color.White)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    TextButton(onClick = {
                        downloadState = ApkDownloader.DownloadState.Idle
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
        
        try {
            val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as android.os.Vibrator
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
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

        AppLifecycleObserver.init()
        com.pinguincell.absen.api.NotificationHelper.initChannels(this)
        com.pinguincell.absen.utils.AutoUpdateManager.cleanupOldApks(this)
        
        val batteryHelper = BatteryOptimizationHelper(this)
        if (!batteryHelper.isBatteryOptimizationIgnored()) {
            batteryHelper.requestBatteryOptimizationWhitelist()
            val autoStartHelper = AutoStartHelper(this)
            autoStartHelper.showAutoStartGuide()
        }

        val prefs = getSharedPreferences("AbsenLogin", Context.MODE_PRIVATE)
        val userId = prefs.getString("userId", null)
        if (userId != null) {
            fetchAndRegisterFCMToken(this, userId)
        }

        val permissionsToRequest = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(android.Manifest.permission.POST_NOTIFICATIONS)
            }
        }
        if (androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.CAMERA) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(android.Manifest.permission.CAMERA)
        }
        if (androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(android.Manifest.permission.ACCESS_FINE_LOCATION)
            permissionsToRequest.add(android.Manifest.permission.ACCESS_COARSE_LOCATION)
        }
        
        if (permissionsToRequest.isNotEmpty()) {
            androidx.core.app.ActivityCompat.requestPermissions(this, permissionsToRequest.toTypedArray(), 101)
        }

        CacheManager.init(this)
        OutboxManager.init(this)

        setContent {
            MaterialTheme {
                var isCheckingUpdate by remember { mutableStateOf(true) }
                var updateRequired by remember { mutableStateOf(false) }
                var updateUrl by remember { mutableStateOf("https://nafindo.github.io/absen/") }
                val lifecycleOwner = LocalLifecycleOwner.current

                suspend fun doCheckUpdate() {
                    try {
                        val response = RetrofitClient.instance.checkUpdate(CheckUpdateRequest())
                        if (response.success && response.latestVersion != null) {
                            val currentVersion = BuildConfig.VERSION_NAME
                            val serverVerParts = response.latestVersion.split(".").map { it.replace(Regex("[^0-9]"), "").toIntOrNull() ?: 0 }
                            val currentVerParts = currentVersion.split(".").map { it.replace(Regex("[^0-9]"), "").toIntOrNull() ?: 0 }
                            
                            val maxLength = maxOf(serverVerParts.size, currentVerParts.size)
                            var isNewer = false
                            
                            for (i in 0 until maxLength) {
                                val sPart = serverVerParts.getOrElse(i) { 0 }
                                val cPart = currentVerParts.getOrElse(i) { 0 }
                                if (sPart > cPart) {
                                    isNewer = true
                                    break
                                } else if (sPart < cPart) {
                                    break
                                }
                            }
                            
                            if (isNewer) {
                                updateRequired = true
                                if (response.updateUrl != null) {
                                    updateUrl = response.updateUrl
                                }
                            } else {
                                updateRequired = false
                                // Optional auto clean up update.apk
                                val f = File(this@MainActivity.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "update.apk")
                                if (f.exists()) f.delete()
                            }
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    } finally {
                        isCheckingUpdate = false
                    }
                }

                DisposableEffect(lifecycleOwner) {
                    val observer = LifecycleEventObserver { _, event ->
                        if (event == Lifecycle.Event.ON_RESUME) {
                            kotlinx.coroutines.CoroutineScope(Dispatchers.Main).launch {
                                doCheckUpdate()
                            }
                        }
                    }
                    lifecycleOwner.lifecycle.addObserver(observer)
                    onDispose {
                        lifecycleOwner.lifecycle.removeObserver(observer)
                    }
                }

                LaunchedEffect(Unit) {
                    doCheckUpdate()
                    while(true) {
                        delay(10 * 60 * 1000L)
                        doCheckUpdate()
                    }
                }

                if (isCheckingUpdate) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        AnimatedBackgroundImage()
                        SnowAnimation()
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Color.Black.copy(alpha = 0.3f))
                        )
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center,
                            modifier = Modifier.fillMaxSize()
                        ) {
                            Spacer(modifier = Modifier.weight(1f))
                            Box(
                                modifier = Modifier
                                    .size(120.dp)
                                    .clip(RoundedCornerShape(32.dp))
                                    .background(Color.White)
                                    .border(2.dp, Color.White.copy(alpha = 0.25f), RoundedCornerShape(32.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                androidx.compose.foundation.Image(
                                    painter = androidx.compose.ui.res.painterResource(id = com.pinguincell.absen.R.drawable.pinguincell_logo),
                                    contentDescription = "Logo",
                                    modifier = Modifier.size(80.dp),
                                    contentScale = androidx.compose.ui.layout.ContentScale.Fit
                                )
                            }
                            Spacer(modifier = Modifier.height(24.dp))
                            Text(
                                text = "PinguinCell Absen",
                                fontSize = 28.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "AbsensiPro Multystore V${BuildConfig.VERSION_NAME}",
                                fontSize = 14.sp,
                                color = Color.White.copy(alpha = 0.8f)
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "© 2026 Nafindo Group",
                                fontSize = 12.sp,
                                color = Color.White.copy(alpha = 0.7f)
                            )
                            Spacer(modifier = Modifier.weight(1f))
                            CircularProgressIndicator(color = Color.White)
                            Spacer(modifier = Modifier.height(48.dp))
                        }
                    }
                    return@MaterialTheme
                }

                val context = LocalContext.current
                if (updateRequired) {
                    var showUpdatePopup by remember { mutableStateOf(true) }
                    
                    if (showUpdatePopup) {
                        AlertDialog(
                            onDismissRequest = { showUpdatePopup = false },
                            title = { Text("Pembaruan Tersedia") },
                            text = { Text("Pembaruan sedang diunduh di latar belakang. Anda dapat melanjutkan aktivitas.") },
                            confirmButton = {
                                TextButton(onClick = { showUpdatePopup = false }) {
                                    Text("Tutup")
                                }
                            }
                        )
                    }

                    LaunchedEffect(updateUrl) {
                        com.pinguincell.absen.utils.AutoUpdateManager.startUpdate(context, updateUrl)
                    }
                }

                var loggedInUser by remember {
                    val savedId = prefs.getString("userId", null)
                    if (savedId != null) {
                        mutableStateOf<User?>(User(
                            id = savedId,
                            nama = prefs.getString("userNama", "") ?: "",
                            jabatan = prefs.getString("userJabatan", ""),
                            tokoDefault = prefs.getString("userToko", ""),
                            shiftDefault = prefs.getString("userShift", ""),
                            pin = "",
                            fotoProfil = prefs.getString("userFoto", ""),
                            faceId = prefs.getString("userFaceId", "")
                        ))
                    } else {
                        mutableStateOf<User?>(null)
                    }
                }

                if (loggedInUser == null) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        AnimatedBackgroundImage()
                        SnowAnimation()
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Color.Black.copy(alpha = 0.3f))
                        )
                        LoginScreen(onLoginSuccess = { user ->
                            val oldId = prefs.getString("userId", null)
                            if (oldId != null && oldId != user.id) {
                                CacheManager.clearCache()
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
                            fetchAndRegisterFCMToken(this@MainActivity, user.id)
                        })
                    }
                } else {
                    val chatViewModel = androidx.compose.runtime.remember {
                        ChatViewModel(context.applicationContext as android.app.Application, loggedInUser!!.id, loggedInUser!!.nama)
                    }
                    val unreadChatCount by chatViewModel.unreadCount.collectAsState()
                    val navController = rememberNavController()
                    
                    LaunchedEffect(navController) {
                        navController.addOnDestinationChangedListener { _, destination, _ ->
                            AppLifecycleObserver.currentScreen = destination.route ?: "home"
                        }
                    }
                    
                    LaunchedEffect(Unit) {
                        PusherManager.chatEvents.collect { event ->
                            if (AppLifecycleObserver.isForeground) {
                                if (event.eventName == "new-message") {
                                    com.pinguincell.absen.api.NotificationHelper.playNotificationSound(context)
                                    if (AppLifecycleObserver.currentScreen != "chat") {
                                        Toast.makeText(context, "Ada pesan chat baru!", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            }
                        }
                    }
                    
                    NavHost(navController = navController, startDestination = "home") {
                        composable("home") {
                            HomeScreen(
                                user = loggedInUser!!,
                                navController = navController,
                                unreadChatCount = unreadChatCount,
                                onLogout = {
                                    prefs.edit().clear().apply()
                                    loggedInUser = null
                                },
                                onUserUpdated = { updated ->
                                    loggedInUser = updated
                                }
                            )
                        }
                        composable("management_jadwal") {
                            com.pinguincell.absen.ui.screens.ManagementJadwalScreen(
                                onNavigateBack = { navController.popBackStack() }
                            )
                        }
                        composable("absensi") {
                            AbsensiScreen(user = loggedInUser!!, navController = navController)
                        }
                        composable("berita") {
                            BeritaScreen(onBack = { navController.popBackStack() })
                        }
                        composable("tugas") {
                            TugasScreen(
                                idKaryawan = loggedInUser!!.id,
                                idToko = loggedInUser!!.tokoDefault ?: "",
                                onNavigateBack = { navController.popBackStack() }
                            )
                        }
                        composable("lembur") {
                            LemburScreen(
                                idKaryawan = loggedInUser!!.id,
                                onNavigateBack = { navController.popBackStack() },
                                onNavigateToAjukanLembur = { navController.navigate("ajukan_lembur") }
                            )
                        }
                        composable("ajukan_lembur") {
                            AjukanLemburScreen(
                                idKaryawan = loggedInUser!!.id,
                                nama = loggedInUser!!.nama,
                                onNavigateBack = { navController.popBackStack() }
                            )
                        }
                        composable("izin") {
                            val izinViewModel = androidx.compose.runtime.remember { IzinViewModel(loggedInUser!!.id) }
                            IzinScreen(
                                onBack = { navController.popBackStack() },
                                onAjukanIzin = { navController.navigate("ajukan_izin") },
                                viewModel = izinViewModel
                            )
                        }
                        composable("ajukan_izin") {
                            val ajukanIzinViewModel = androidx.compose.runtime.remember { AjukanIzinViewModel(loggedInUser!!.id, loggedInUser!!.nama) }
                            AjukanIzinScreen(onBack = { navController.popBackStack() }, viewModel = ajukanIzinViewModel)
                        }
                        composable("tukar_shift") {
                            TukarShiftScreen(
                                idKaryawan = loggedInUser!!.id,
                                namaKaryawan = loggedInUser!!.nama,
                                fotoUrl = loggedInUser!!.fotoProfil ?: "",
                                onNavigateBack = { navController.popBackStack() }
                            )
                        }
                        composable("rekap") {
                            val rekapViewModel = androidx.compose.runtime.remember { RekapViewModel(loggedInUser!!.id) }
                            RekapScreen(onNavigateBack = { navController.popBackStack() }, viewModel = rekapViewModel)
                        }
                        composable("verify_gaji") {
                            val faceIdStr = loggedInUser!!.faceId
                            if (faceIdStr.isNullOrEmpty()) {
                                androidx.compose.runtime.LaunchedEffect(Unit) {
                                    android.widget.Toast.makeText(context, "Anda harus mendaftar Face ID 3D terlebih dahulu!", android.widget.Toast.LENGTH_LONG).show()
                                    navController.popBackStack()
                                }
                            } else {
                                val profileEmbedding = androidx.compose.runtime.remember(faceIdStr) {
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
                                
                                var isVerified by androidx.compose.runtime.remember { androidx.compose.runtime.mutableStateOf(false) }
                                
                                if (isVerified) {
                                    androidx.compose.runtime.LaunchedEffect(Unit) {
                                        navController.popBackStack()
                                        navController.navigate("gaji")
                                    }
                                } else if (profileEmbedding != null) {
                                    com.pinguincell.absen.ui.screens.FaceVerificationScreen(
                                        profileEmbedding = profileEmbedding,
                                        onSuccess = { isVerified = true },
                                        onBack = { navController.popBackStack() }
                                    )
                                } else {
                                    androidx.compose.runtime.LaunchedEffect(Unit) {
                                        android.widget.Toast.makeText(context, "Data Face ID tidak valid!", android.widget.Toast.LENGTH_LONG).show()
                                        navController.popBackStack()
                                    }
                                }
                            }
                        }
                        composable("gaji") {
                            val gajiViewModel = androidx.compose.runtime.remember { GajiViewModel(loggedInUser!!.id) }
                            GajiScreen(onNavigateBack = { navController.popBackStack() }, viewModel = gajiViewModel)
                        }
                        composable("chat") {
                            ChatScreen(onNavigateBack = { navController.popBackStack() }, viewModel = chatViewModel, loggedInUserId = loggedInUser!!.id)
                        }
                        composable("jadwal") {
                            val jadwalViewModel = androidx.compose.runtime.remember { JadwalViewModel(loggedInUser!!.id) }
                            JadwalScreen(navController = navController, viewModel = jadwalViewModel)
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

    private fun fetchAndRegisterFCMToken(context: Context, userId: String) {
        com.google.firebase.messaging.FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                val errorMsg = "FCM Gagal: " + task.exception?.message
                android.util.Log.w("FCM_TOKEN_DEBUG", errorMsg, task.exception)
                runOnUiThread {
                    Toast.makeText(context, errorMsg, Toast.LENGTH_LONG).show()
                }
                return@addOnCompleteListener
            }
            val token = task.result
            kotlinx.coroutines.CoroutineScope(Dispatchers.IO).launch {
                try {
                    val response = com.pinguincell.absen.api.RetrofitClient.instance.registerFCMToken(
                        com.pinguincell.absen.api.RegisterFCMTokenRequest(
                            idKaryawan = userId,
                            token = token
                        )
                    )
                    runOnUiThread {
                        Toast.makeText(context, "FCM Sukses: " + response.message, Toast.LENGTH_SHORT).show()
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                    runOnUiThread {
                        Toast.makeText(context, "FCM Gagal Kirim: " + e.message, Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        PusherManager.disconnect()
    }
}

fun getDeviceId(context: Context): String {
    return Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "unknown_android_id"
}

fun getDeviceName(): String {
    val manufacturer = Build.MANUFACTURER
    val model = Build.MODEL
    return if (model.startsWith(manufacturer, ignoreCase = true)) {
        model.uppercase()
    } else {
        "${manufacturer.uppercase()} $model"
    }
}

@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class, androidx.compose.ui.ExperimentalComposeUiApi::class)
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
        val cacheData = CacheManager.getCache<KaryawanListResponse>(cacheKey)
        if (cacheData != null && cacheData.success && !cacheData.data.isNullOrEmpty()) {
            karyawanList = cacheData.data.filter { it.Status == "Aktif" && it.Jabatan?.equals("owner", ignoreCase = true) != true }
            isKaryawanLoading = false
        }
        
        try {
            val response = RetrofitClient.instance.getKaryawanList(KaryawanListRequest())
            if (response.success && !response.data.isNullOrEmpty()) {
                karyawanList = response.data.filter { it.Status == "Aktif" && it.Jabatan?.equals("owner", ignoreCase = true) != true }
                CacheManager.saveCache(cacheKey, response)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            isKaryawanLoading = false
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(24.dp).fillMaxWidth()
        ) {
            // Logo Placeholder
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(RoundedCornerShape(28.dp))
                    .background(Color.White)
                    .border(2.dp, Color.White.copy(alpha = 0.25f), RoundedCornerShape(28.dp)),
                contentAlignment = Alignment.Center
            ) {
                androidx.compose.foundation.Image(
                    painter = androidx.compose.ui.res.painterResource(id = com.pinguincell.absen.R.drawable.pinguincell_logo),
                    contentDescription = "Logo",
                    modifier = Modifier.size(70.dp),
                    contentScale = androidx.compose.ui.layout.ContentScale.Fit
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "PinguinCell Absen",
                fontSize = 24.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color.White
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "AbsensiPro Multystore V${BuildConfig.VERSION_NAME}",
                fontSize = 12.sp,
                color = Color.White.copy(alpha = 0.8f)
            )
            Spacer(modifier = Modifier.height(32.dp))
            
            Card(
                shape = cardShape,
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

                    Text(
                        "NAMA KARYAWAN",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF8B95A5),
                        letterSpacing = 0.8.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    
                    @OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
                    ExposedDropdownMenuBox(
                        expanded = expanded,
                        onExpandedChange = { expanded = !expanded }
                    ) {
                        OutlinedTextField(
                            value = selectedNama,
                            onValueChange = {},
                            readOnly = true,
                            placeholder = { Text(if (isKaryawanLoading) "Memuat..." else "Pilih Nama", color = Color.Gray) },
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                            modifier = Modifier.fillMaxWidth().menuAnchor(),
                            shape = RoundedCornerShape(12.dp),
                            colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors(
                                focusedBorderColor = primaryColor,
                                unfocusedBorderColor = Color.LightGray
                            )
                        )
                        ExposedDropdownMenu(
                            expanded = expanded,
                            onDismissRequest = { expanded = false },
                            modifier = Modifier.background(Color.White)
                        ) {
                            karyawanList.forEach { karyawan ->
                                DropdownMenuItem(
                                    text = { Text(karyawan.Nama, color = Color.Black) },
                                    onClick = {
                                        idKaryawan = karyawan.ID_Karyawan
                                        selectedNama = karyawan.Nama
                                        expanded = false
                                    }
                                )
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(20.dp))
                    
                    Text(
                        "PIN RAHASIA",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF8B95A5),
                        letterSpacing = 0.8.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    
                    OutlinedTextField(
                        value = pin,
                        onValueChange = { if (it.length <= 4) pin = it },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        placeholder = { Text("Masukkan 4 Digit PIN", color = Color.Gray) },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                        visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    imageVector = if (passwordVisible) androidx.compose.material.icons.Icons.Default.Visibility else androidx.compose.material.icons.Icons.Default.VisibilityOff,
                                    contentDescription = null,
                                    tint = Color.Gray
                                )
                            }
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = primaryColor,
                            unfocusedBorderColor = Color.LightGray
                        )
                    )
                    
                    Spacer(modifier = Modifier.height(32.dp))
                    
                    Button(
                        onClick = {
                            if (idKaryawan.isEmpty() || pin.isEmpty()) {
                                errorMessage = "Nama Karyawan dan PIN wajib diisi"
                                return@Button
                            }
                            keyboardController?.hide()
                            isLoading = true
                            errorMessage = null
                            
                            coroutineScope.launch {
                                try {
                                    val req = LoginRequest(
                                        idKaryawan = idKaryawan,
                                        pin = pin,
                                        deviceId = getDeviceId(context),
                                        deviceName = getDeviceName(),
                                        force = false
                                    )
                                    val res = RetrofitClient.instance.login(req)
                                    if (res.success && res.user != null) {
                                        onLoginSuccess(res.user)
                                    } else if (res.requireDeviceConfirmation == true) {
                                        showForceDialog = true
                                        forceMessage = res.message ?: "Akun sedang login di perangkat lain."
                                    } else {
                                        errorMessage = res.error ?: res.message ?: "Gagal login"
                                    }
                                } catch (e: Exception) {
                                    errorMessage = "Terjadi kesalahan jaringan"
                                } finally {
                                    isLoading = false
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth().height(56.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = primaryColor),
                        enabled = !isLoading
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp))
                        } else {
                            Text("MASUK", fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                        }
                    }
                }
            }
        }
        
        if (showForceDialog) {
            AlertDialog(
                onDismissRequest = { showForceDialog = false },
                title = { Text("Konfirmasi Perangkat") },
                text = { Text(forceMessage) },
                confirmButton = {
                    Button(
                        onClick = {
                            showForceDialog = false
                            isLoading = true
                            errorMessage = null
                            coroutineScope.launch {
                                try {
                                    val req = LoginRequest(
                                        idKaryawan = idKaryawan,
                                        pin = pin,
                                        deviceId = getDeviceId(context),
                                        deviceName = getDeviceName(),
                                        force = true
                                    )
                                    val res = RetrofitClient.instance.login(req)
                                    if (res.success && res.user != null) {
                                        onLoginSuccess(res.user)
                                    } else {
                                        errorMessage = res.error ?: res.message ?: "Gagal login paksa"
                                    }
                                } catch (e: Exception) {
                                    errorMessage = "Terjadi kesalahan jaringan"
                                } finally {
                                    isLoading = false
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = primaryColor)
                    ) {
                        Text("Tetap Masuk")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showForceDialog = false }) {
                        Text("Batal", color = Color.Gray)
                    }
                }
            )
        }
    }
}

@Composable
fun AnimatedBackground() {
    val configuration = LocalConfiguration.current
    val density = LocalDensity.current
    val screenWidth = with(density) { configuration.screenWidthDp.dp.toPx() }
    val screenHeight = with(density) { configuration.screenHeightDp.dp.toPx() }

    val infiniteTransition = rememberInfiniteTransition()
    val maxOffsetX = screenWidth * 0.15f
    val maxOffsetY = screenHeight * 0.15f

    val offsetX by infiniteTransition.animateFloat(
        initialValue = -maxOffsetX,
        targetValue = maxOffsetX,
        animationSpec = infiniteRepeatable(
            animation = androidx.compose.animation.core.tween(15000, easing = androidx.compose.animation.core.LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "offsetX"
    )

    val offsetY by infiniteTransition.animateFloat(
        initialValue = -maxOffsetY,
        targetValue = maxOffsetY,
        animationSpec = infiniteRepeatable(
            animation = androidx.compose.animation.core.tween(20000, easing = androidx.compose.animation.core.LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "offsetY"
    )

    Canvas(modifier = Modifier.fillMaxSize()) {
        val color1 = Color.White.copy(alpha = 0.03f)
        val color2 = Color.White.copy(alpha = 0.05f)
        
        drawCircle(
            color = color1,
            radius = size.width * 0.8f,
            center = Offset(size.width * 0.2f + offsetX, size.height * 0.2f + offsetY)
        )
        
        drawCircle(
            color = color2,
            radius = size.width * 0.6f,
            center = Offset(size.width * 0.8f - offsetX, size.height * 0.8f - offsetY)
        )
    }
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
    val configuration = LocalConfiguration.current
    val density = LocalDensity.current
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
            withFrameMillis { time = it.toFloat() }
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

    Canvas(modifier = Modifier.fillMaxSize()) {
        val trigger = time
        snowflakes.forEach { flake ->
            drawCircle(
                color = Color.White.copy(alpha = 0.8f),
                radius = flake.radius,
                center = Offset(flake.x, flake.y)
            )
        }
    }
}

@Composable
fun AnimatedBackgroundImage() {
    val infiniteTransition = androidx.compose.animation.core.rememberInfiniteTransition()
    val offsetX by infiniteTransition.animateFloat(
        initialValue = -30f,
        targetValue = 30f,
        animationSpec = androidx.compose.animation.core.infiniteRepeatable(
            animation = androidx.compose.animation.core.tween(durationMillis = 15000, easing = androidx.compose.animation.core.LinearEasing),
            repeatMode = androidx.compose.animation.core.RepeatMode.Reverse
        )
    )

    androidx.compose.foundation.Image(
        painter = androidx.compose.ui.res.painterResource(id = com.pinguincell.absen.R.drawable.pinguin_bg),
        contentDescription = "Background",
        contentScale = androidx.compose.ui.layout.ContentScale.Crop,
        modifier = Modifier
            .fillMaxSize()
            .graphicsLayer {
                scaleX = 1.15f
                scaleY = 1.15f
                translationX = offsetX
            }
    )
}
