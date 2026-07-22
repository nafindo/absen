package com.pinguincell.absen.ui.screens

import android.content.Context
import android.graphics.Bitmap
import android.util.Base64
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Face
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView









































































































                            if (mediaImage != null) {
                                val image = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
                                detector.process(image)
                                    .addOnSuccessListener { faces ->
                                        if (faces.isEmpty()) {
                                            statusMessage = "Wajah tidak terdeteksi"
                                            detectedFaceBounds = null
                                            imageProxy.close()
                                            return@addOnSuccessListener
                                        }

                                        val face = faces[0]
                                        val bounds = face.boundingBox
                                        detectedFaceBounds = bounds
                                        val cx = bounds.centerX()
                                        val cy = bounds.centerY()

                                        val bitmap = imageProxy.toBitmap()
                                        // RELAXED centering checks! Preview aspect ratio differs from imageProxy
                                        val isCenteredX = cx > bitmap.width * 0.15 && cx < bitmap.width * 0.85
                                        val isCenteredY = cy > bitmap.height * 0.15 && cy < bitmap.height * 0.85
        






































                                                                statusMessage = "Menyimpan Pose 1..."
                                                                coroutineScope.launch {
                                                                    delay(1000)
                                                                    livenessState = LivenessState.BLINK
                                                                    isProcessingPose = false
                                                                }
                                                            }
                                                        }
                                                    }
                                                    LivenessState.BLINK -> {
                                                        statusMessage = "2/5: Tahan Senyum! Kedipkan Mata\n(Mata L: ${"%.2f".format(leftEye)}, R: ${"%.2f".format(rightEye)})"
                                                        if (leftEye < 0.4f || rightEye < 0.4f) {
                                                            val emb = processor.getFaceEmbedding(getCroppedFace())
                                                            if (emb != null) {
                                                                collectedEmbeddings.add(emb)
                                                                isProcessingPose = true
                                         














                                                                isProcessingPose = true
                                                                statusMessage = "Menyimpan Pose 3..."
                                                                coroutineScope.launch {
                                                                    delay(1000)
                                                                    livenessState = LivenessState.TURN_LEFT
                                                                    isProcessingPose = false
                                                                }
                                                            }
                                                        }
                                                    }
                                                    LivenessState.TURN_LEFT -> {
                                                        statusMessage = "4/5: Bagus! Tengok Kiri Sedikit\n(Sudut Kiri: ${"%.1f".format(eulerY)})"
                                                        if (eulerY < -15f) {
                                                            val emb = processor.getFaceEmbedding(getCroppedFace())
                                                            if (emb != null) {
                                                                collectedEmbeddings.add(emb)
                                                                isProcessingPose = true
                                                                statusMessage = "Menyimpan Pose 4..."
                                                                coroutineScope.launch {
                                                                    delay(1000)


































                                                                            
                                                                            val res = withContext(Dispatchers.IO) {
                                                                                RetrofitClient.instance.registerFaceId(RegisterFaceIdRequest(
                                                                                    idKaryawan = user.id,
                                                                                    faceId = base64
                                                                                ))
                                                                            }
                                                                            
                                                                            if (res.success) {
                                                                                isSuccess = true
                                                                                statusMessage = "Face ID 3D berhasil didaftarkan!"
                                                                                CacheManager.saveCache("home_user_${user.id}", user.copy(faceId = base64))
                                                                                delay(2000)
                                                                                onSuccess(base64)
                                                                            } else {
                                                                                statusMessage = "Gagal menyimpan: ${res.error}"































































                        val path = androidx.compose.ui.graphics.Path().apply {
                            moveTo(50f * scaleX, 5f * scaleY) // Top center
                            // Right head curve
                            cubicTo(75f * scaleX, 5f * scaleY, 85f * scaleX, 20f * scaleY, 85f * scaleX, 45f * scaleY)
                            // Right ear
                            cubicTo(95f * scaleX, 43f * scaleY, 98f * scaleX, 55f * scaleY, 85f * scaleX, 58f * scaleY)
                            // Right jaw
                            cubicTo(85f * scaleX, 75f * scaleY, 70f * scaleX, 95f * scaleY, 50f * scaleX, 95f * scaleY)
                            // Left jaw
                            cubicTo(30f * scaleX, 95f * scaleY, 15f * scaleX, 75f * scaleY, 15f * scaleX, 58f * scaleY)
                            // Left ear
                            cubicTo(2f * scaleX, 55f * scaleY, 5f * scaleX, 43f * scaleY, 15f * scaleX, 45f * scaleY)
                            // Left head curve
                            cubicTo(15f * scaleX, 20f * scaleY, 25f * scaleX, 5f * scaleY, 50f * scaleX, 5f * scaleY)
                            close()
                        }
                        
                        drawPath(
                            path = path,
                            color = color,
                            style = Stroke(width = 5.dp.toPx())
                        )
                    }
                }

                Spacer(modifier = Modifier.weight(1f))
                
                if (isProcessing && !isSuccess) {
                    CircularProgressIndicator(color = Color.White)
                }
                
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
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

                Spacer(modifier = Modifier.weight(1f))
                
                if ((isProcessing || isProcessingPose) && !isSuccess) {
                    CircularProgressIndicator(color = Color.White)
                }
                
                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }
}
































































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
