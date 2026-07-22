package com.pinguincell.absen.admin

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.pinguincell.absen.admin.api.PusherForegroundService
import com.pinguincell.absen.admin.theme.AbsenAdminTheme
import com.pinguincell.absen.admin.ui.AdminMainScreen
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // Initialize CacheManager
    com.pinguincell.absen.admin.api.CacheManager.init(applicationContext)

    // Initialize AppLifecycleObserver
    com.pinguincell.absen.admin.utils.AppLifecycleObserver.init()

    // Initialize Notification Channels
    com.pinguincell.absen.admin.api.NotificationHelper.initChannels(this)

    // Request Notification Permissions for Android 13+
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 101)
        }
    }

    // Start Pusher Foreground Service (Disabled to remove persistent background notification)
    /*
    val serviceIntent = Intent(this, PusherForegroundService::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        startForegroundService(serviceIntent)
    } else {
        startService(serviceIntent)
    }
    */

    // Initialize Pusher Client directly in MainActivity
    com.pinguincell.absen.admin.api.PusherManager.initPusher()

    // Check & Register Firebase Token (Copied from Native App)
    com.google.firebase.messaging.FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
        if (!task.isSuccessful) {
            val errorMsg = "FCM Gagal: " + task.exception?.message
            android.util.Log.w("FCM_TOKEN_DEBUG", errorMsg, task.exception)
            runOnUiThread {
                android.widget.Toast.makeText(this@MainActivity, errorMsg, android.widget.Toast.LENGTH_LONG).show()
            }
            return@addOnCompleteListener
        }
        val token = task.result
        android.util.Log.d("FCM_TOKEN_DEBUG", "FCM Token berhasil: $token")

        // Send token to server
        val prefs = getSharedPreferences("AbsenLogin", android.content.Context.MODE_PRIVATE)
        val userId = prefs.getString("userId", null)
        if (userId != null) {
            kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
                try {
                    val response = com.pinguincell.absen.admin.api.RetrofitClient.instance.registerFCMToken(
                        com.pinguincell.absen.admin.api.RegisterFCMTokenRequest(
                            idKaryawan = userId,
                            token = token
                        )
                    )
                    android.util.Log.d("FCM_TOKEN_DEBUG", "FCM Admin Token berhasil dikirim ke server")
                    runOnUiThread {
                        android.widget.Toast.makeText(this@MainActivity, "FCM Sukses: " + response.message, android.widget.Toast.LENGTH_SHORT).show()
                    }
                } catch (e: Exception) {
                    android.util.Log.e("FCM_TOKEN_DEBUG", "Gagal register admin token on launch", e)
                    runOnUiThread {
                        android.widget.Toast.makeText(this@MainActivity, "FCM Simpan Gagal: " + e.message, android.widget.Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }

    enableEdgeToEdge()
    setContent {
      AbsenAdminTheme { Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) { AdminMainScreen() } }
    }
  }
}
