import os

with open(r'd:\absen\absen-native\app\src\main\java\com\pinguincell\absen\MainActivity.kt', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to insert the missing MainActivity class before LoginScreen.
# Wait! LoginScreen is right after AutoUpdateOverlay.
# So I should insert the MainActivity class AFTER AutoUpdateOverlay and BEFORE LoginScreen.

main_activity_code = """
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        androidx.core.splashscreen.SplashScreen.installSplashScreen(this)
        
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

        com.pinguincell.absen.sync.AppLifecycleObserver.init()
        com.pinguincell.absen.api.NotificationHelper.initChannels(this)
        com.pinguincell.absen.api.CacheManager.init(this)
        com.pinguincell.absen.api.OutboxManager.init(this)
        
        setContent {
            MaterialTheme {
                val lifecycleOwner = androidx.lifecycle.compose.LocalLifecycleOwner.current
                val context = LocalContext.current
                val prefs = remember { context.getSharedPreferences("AbsenLogin", Context.MODE_PRIVATE) }
                
                var updateRequired by remember { mutableStateOf(false) }
                var updateUrl by remember { mutableStateOf("https://nafindo.github.io/absen/") }
                
                suspend fun doCheckUpdate() {
                    try {
                        kotlinx.coroutines.withTimeout(5000) {
                            val response = com.pinguincell.absen.api.RetrofitClient.instance.checkUpdate(CheckUpdateRequest())
                            if (response.success && response.latestVersion != null) {
                                val currentVersion = BuildConfig.VERSION_NAME
                                val serverVerStr = response.latestVersion.replace(Regex("[^0-9]"), "")
                                val currentVerStr = currentVersion.replace(Regex("[^0-9]"), "")
                                
                                val serverVerInt = serverVerStr.toIntOrNull() ?: 0
                                val currentVerInt = currentVerStr.toIntOrNull() ?: 0

                                if (serverVerInt > currentVerInt) {
                                    updateRequired = true
                                    updateUrl = response.updateUrl ?: "https://nafindo.github.io/absen/"
                                }
                            }
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }

                DisposableEffect(lifecycleOwner) {
                    val observer = androidx.lifecycle.LifecycleEventObserver { _, event ->
                        if (event == androidx.lifecycle.Lifecycle.Event.ON_RESUME) {
                            kotlinx.coroutines.GlobalScope.launch(kotlinx.coroutines.Dispatchers.IO) {
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
                        kotlinx.coroutines.delay(10 * 60 * 1000L) // 10 minutes
                        doCheckUpdate()
                    }
                }

                var loggedInUser by remember {
                    val savedId = prefs.getString("userId", null)
                    if (savedId != null) {
                        mutableStateOf<com.pinguincell.absen.api.User?>(com.pinguincell.absen.api.User(
                            id = savedId,
                            nama = prefs.getString("userNama", "") ?: "",
                            jabatan = prefs.getString("userJabatan", "") ?: "",
                            tokoDefault = prefs.getString("userToko", "") ?: "",
                            shiftDefault = prefs.getString("userShift", "") ?: "",
                            fotoProfil = prefs.getString("userFoto", "") ?: "",
                            faceId = prefs.getString("userFaceId", "") ?: ""
                        ))
                    } else {
                        mutableStateOf<com.pinguincell.absen.api.User?>(null)
                    }
                }

                if (loggedInUser == null) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        SnowAnimation()
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(Color.Black.copy(alpha = 0.3f))
                        )
                        LoginScreen(onLoginSuccess = { user ->
                            val oldId = prefs.getString("userId", null)
                            if (oldId != null && oldId != user.id) {
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
                                        } catch (e: Exception) {
                                            e.printStackTrace()
                                        }
                                    }
                                }
                            }
                        })
                    }
                } else {
                    val chatViewModel = androidx.compose.runtime.remember {
                        com.pinguincell.absen.ChatViewModel(context.applicationContext as android.app.Application, loggedInUser!!.id, loggedInUser!!.nama)
                    }
                    val navController = androidx.navigation.compose.rememberNavController()
                    
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

                    Box(modifier = Modifier.fillMaxSize()) {
                        androidx.navigation.compose.NavHost(navController = navController, startDestination = "home") {
                            androidx.navigation.compose.composable("home") {
                                val homeViewModel = androidx.compose.runtime.remember { com.pinguincell.absen.HomeViewModel() }
                                HomeScreen(
                                    user = loggedInUser!!,
                                    navController = navController,
                                    viewModel = homeViewModel,
                                    onLogout = {
                                        loggedInUser = null
                                        prefs.edit().clear().apply()
                                        com.pinguincell.absen.api.CacheManager.clearCache()
                                    }
                                )
                            }
                            androidx.navigation.compose.composable("tugas") {
                                val tugasViewModel = androidx.compose.runtime.remember { com.pinguincell.absen.TugasViewModel() }
                                TugasScreen(
                                    idKaryawan = loggedInUser!!.id,
                                    idToko = loggedInUser!!.tokoDefault ?: "",
                                    onNavigateBack = { navController.popBackStack() },
                                    viewModel = tugasViewModel
                                )
                            }
                            androidx.navigation.compose.composable("lembur") {
                                val lemburViewModel = androidx.compose.runtime.remember { com.pinguincell.absen.LemburViewModel(loggedInUser!!.id) }
                                LemburScreen(
                                    idKaryawan = loggedInUser?.id ?: "",
                                    onNavigateBack = { navController.popBackStack() },
                                    onNavigateToAjukanLembur = { navController.navigate("ajukan_lembur") },
                                    viewModel = lemburViewModel
                                )
                            }
                            androidx.navigation.compose.composable("ajukan_lembur") {
                                val ajukanLemburViewModel = androidx.compose.runtime.remember { com.pinguincell.absen.AjukanLemburViewModel(loggedInUser!!.id, loggedInUser!!.nama) }
                                AjukanLemburScreen(
                                    idKaryawan = loggedInUser?.id ?: "",
                                    nama = loggedInUser?.nama ?: "",
                                    onNavigateBack = { navController.popBackStack() },
                                    viewModel = ajukanLemburViewModel
                                )
                            }
                            androidx.navigation.compose.composable("izin") {
                                val izinViewModel = androidx.compose.runtime.remember { com.pinguincell.absen.IzinViewModel(loggedInUser!!.id) }
                                IzinScreen(
                                    idKaryawan = loggedInUser!!.id,
                                    onNavigateBack = { navController.popBackStack() },
                                    onNavigateToAjukanIzin = { navController.navigate("ajukan_izin") },
                                    viewModel = izinViewModel
                                )
                            }
                            androidx.navigation.compose.composable("ajukan_izin") {
                                val ajukanIzinViewModel = androidx.compose.runtime.remember { com.pinguincell.absen.AjukanIzinViewModel(loggedInUser!!.id, loggedInUser!!.nama) }
                                AjukanIzinScreen(
                                    onBack = { navController.popBackStack() },
                                    viewModel = ajukanIzinViewModel
                                )
                            }
                            androidx.navigation.compose.composable("tukar_shift") {
                                TukarShiftScreen(
                                    idKaryawan = loggedInUser?.id ?: "",
                                    namaKaryawan = loggedInUser?.nama ?: "",
                                    fotoUrl = loggedInUser?.fotoProfil ?: "",
                                    onNavigateBack = { navController.popBackStack() }
                                )
                            }
                            androidx.navigation.compose.composable("rekap") {
                                val rekapViewModel = androidx.compose.runtime.remember { com.pinguincell.absen.RekapViewModel(loggedInUser!!.id) }
                                RekapScreen(
                                    onNavigateBack = { navController.popBackStack() },
                                    viewModel = rekapViewModel
                                )
                            }
                            androidx.navigation.compose.composable("verify_gaji") {
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
                                            navController.navigate("gaji") {
                                                popUpTo("home")
                                            }
                                        }
                                    } else {
                                        Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
                                            com.pinguincell.absen.ui.components.LiveCameraPreview(
                                                modifier = Modifier.fillMaxSize(),
                                                profileEmbedding = profileEmbedding,
                                                onAutoCapture = { bmp ->
                                                    isVerified = true
                                                }
                                            )
                                            
                                            Text(
                                                text = "Verifikasi Wajah", 
                                                color = Color.White, 
                                                fontSize = 24.sp, 
                                                fontWeight = FontWeight.Bold, 
                                                modifier = Modifier
                                                    .align(Alignment.TopCenter)
                                                    .padding(top = 48.dp),
                                                style = androidx.compose.ui.text.TextStyle(
                                                    shadow = androidx.compose.ui.graphics.Shadow(
                                                        color = Color.Black,
                                                        offset = androidx.compose.ui.geometry.Offset(2f, 2f),
                                                        blurRadius = 4f
                                                    )
                                                )
                                            )
                                            
                                            Button(
                                                onClick = { navController.popBackStack() }, 
                                                modifier = Modifier
                                                    .align(Alignment.BottomCenter)
                                                    .padding(bottom = 48.dp)
                                                    .fillMaxWidth(0.8f),
                                                colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = Color.Red.copy(alpha = 0.8f))
                                            ) {
                                                Text("Batal", fontSize = 18.sp, color = Color.White)
                                            }
                                        }
                                    }
                                }
                            }
                            androidx.navigation.compose.composable("gaji") {
                                val gajiViewModel = androidx.compose.runtime.remember { com.pinguincell.absen.GajiViewModel(loggedInUser!!.id) }
                                GajiScreen(onNavigateBack = { navController.popBackStack() }, viewModel = gajiViewModel)
                            }
                            androidx.navigation.compose.composable("chat") {
                                ChatScreen(onNavigateBack = { navController.popBackStack() }, viewModel = chatViewModel, loggedInUserId = loggedInUser!!.id)
                            }
                            androidx.navigation.compose.composable("face_registration") {
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
                        
                        if (updateRequired) {
                            AutoUpdateOverlay(updateUrl)
                        }
                    }
                }
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        com.pinguincell.absen.api.PusherManager.disconnect()
    }
}

fun getDeviceId(context: Context): String {
    return Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID) ?: "unknown_android_id"
}

fun getDeviceName(): String {
    val manufacturer = android.os.Build.MANUFACTURER
    val model = android.os.Build.MODEL
    return if (model.startsWith(manufacturer, ignoreCase = true)) {
        model.uppercase()
    } else {
        "${manufacturer.uppercase()} $model"
    }
}

"""

start_idx = content.find('@OptIn(ExperimentalMaterial3Api::class, androidx.compose.ui.ExperimentalComposeUiApi::class)')
if start_idx != -1:
    new_content = content[:start_idx] + main_activity_code + content[start_idx:]
    with open(r'd:\absen\absen-native\app\src\main\java\com\pinguincell\absen\MainActivity.kt', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully restored MainActivity class!")
else:
    print("Could not find @OptIn for LoginScreen")

