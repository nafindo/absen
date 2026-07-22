import re
import os

file_path = "d:\\absen\\absen-native\\app\\src\\main\\java\\com\\pinguincell\\absen\\MainActivity.kt"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Make backup
with open(file_path + ".bak", "w", encoding="utf-8") as f:
    f.write(content)

verify_gaji_replacement = """                        composable("verify_gaji") {
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
                        }"""

# Manual replacement for verify_gaji
lines = content.split('\n')
new_lines = []
skip = False
for line in lines:
    if 'composable("verify_gaji") {' in line:
        skip = True
        new_lines.extend(verify_gaji_replacement.split('\n'))
        continue
    if skip and 'composable("gaji") {' in line:
        skip = False
    
    if not skip:
        new_lines.append(line)

# Now find where @OptIn(ExperimentalMaterial3Api::class is before LoginScreen
start_login_idx = -1
for i, line in enumerate(new_lines):
    if line.startswith('@OptIn(ExperimentalMaterial3Api::class') and 'fun LoginScreen' in '\n'.join(new_lines[i:i+3]):
        start_login_idx = i
        break
    elif line.startswith('@Composable') and 'fun LoginScreen' in '\n'.join(new_lines[i:i+2]):
        start_login_idx = i
        break

if start_login_idx != -1:
    new_lines = new_lines[:start_login_idx]
    
login_screen_code = """@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class, androidx.compose.ui.ExperimentalComposeUiApi::class)
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
            .fillMaxSize()
            .background(bgGradient),
        contentAlignment = Alignment.Center
    ) {
        AnimatedBackground()
        
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(24.dp).fillMaxWidth()
        ) {
            // Logo Placeholder
            Box(
                modifier = Modifier
                    .size(100.dp)
                    .clip(RoundedCornerShape(28.dp))
                    .background(Color.White.copy(alpha = 0.15f))
                    .border(2.dp, Color.White.copy(alpha = 0.25f), RoundedCornerShape(28.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = androidx.compose.material.icons.Icons.Default.Lock,
                    contentDescription = "Logo",
                    tint = Color.White,
                    modifier = Modifier.size(50.dp)
                )
            }
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
                        onValueChange = { if (it.length <= 6) pin = it },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        placeholder = { Text("Masukkan 6 Digit PIN", color = Color.Gray) },
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
            animation = tween(15000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        )
    )

    val offsetY by infiniteTransition.animateFloat(
        initialValue = -maxOffsetY,
        targetValue = maxOffsetY,
        animationSpec = infiniteRepeatable(
            animation = tween(20000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        )
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
"""
    new_lines.extend(login_screen_code.split('\n'))

with open(file_path, "w", encoding="utf-8") as f:
    f.write('\n'.join(new_lines))

print("Patched MainActivity.kt successfully!")
