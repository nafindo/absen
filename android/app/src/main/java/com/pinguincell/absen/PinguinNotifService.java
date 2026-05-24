package com.pinguincell.absen;

import android.app.*;
import android.content.*;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.*;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import org.json.JSONObject;

import java.util.concurrent.TimeUnit;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okhttp3.WebSocketListener;

public class PinguinNotifService extends Service {
    private static final String TAG = "PinguinNotif";
    private static final String PUSHER_KEY = "3c015a6e56c1e4beb0ea";
    private static final String PUSHER_CLUSTER = "ap1";
    private static final String PUSHER_CHANNEL = "pinguin-chat";

    // Channel IDs v3
    private static final String CH_SERVICE = "pinguin_bg_v3";
    private static final String CH_CHAT = "pinguin_msg_v3";
    private static final String CH_GENERAL = "pinguin_info_v3";

    private static final int FOREGROUND_ID = 9999;
    private static int notifId = 1000;

    private OkHttpClient httpClient;
    private WebSocket webSocket;
    private Handler reconnectHandler;
    private boolean isRunning = false;
    private boolean isConnected = false;

    @Override
    public void onCreate() {
        super.onCreate();
        reconnectHandler = new Handler(Looper.getMainLooper());
        httpClient = new OkHttpClient.Builder()
                .readTimeout(0, TimeUnit.MILLISECONDS) // No timeout for WebSocket
                .pingInterval(30, TimeUnit.SECONDS)     // Keep-alive ping
                .build();

        createNotificationChannels();
        startForeground(FOREGROUND_ID, buildForegroundNotification());
        connectWebSocket();
        isRunning = true;
        Log.d(TAG, "✅ Service dimulai");
    }

    // ==================== NOTIFICATION CHANNELS ====================
    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);

            // Hapus channel lama
            String[] oldChannels = {"pinguin_service", "pinguin_chat_notif", "pinguin_general_notif",
                    "pinguin_bg_v2", "pinguin_msg_v2", "pinguin_info_v2"};
            for (String ch : oldChannels) {
                try { nm.deleteNotificationChannel(ch); } catch (Exception ignored) {}
            }

            Uri notifSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            AudioAttributes notifAttr = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();

            // Service channel (silent)
            NotificationChannel chService = new NotificationChannel(
                    CH_SERVICE, "Layanan Background", NotificationManager.IMPORTANCE_LOW);
            chService.setDescription("Menjaga koneksi notifikasi tetap aktif");
            chService.setShowBadge(false);
            chService.setSound(null, null);
            nm.createNotificationChannel(chService);

            // Chat channel (HIGH)
            NotificationChannel chChat = new NotificationChannel(
                    CH_CHAT, "Pesan Masuk", NotificationManager.IMPORTANCE_HIGH);
            chChat.setDescription("Notifikasi pesan chat masuk");
            chChat.setSound(notifSound, notifAttr);
            chChat.enableVibration(true);
            chChat.setVibrationPattern(new long[]{0, 300, 200, 300});
            chChat.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            chChat.enableLights(true);
            chChat.setLightColor(0xFF00BFFF);
            nm.createNotificationChannel(chChat);

            // General channel (HIGH)
            NotificationChannel chGeneral = new NotificationChannel(
                    CH_GENERAL, "Info Aktivitas", NotificationManager.IMPORTANCE_HIGH);
            chGeneral.setDescription("Lembur, Izin, Tukar Shift, Absensi");
            chGeneral.setSound(notifSound, notifAttr);
            chGeneral.enableVibration(true);
            chGeneral.setVibrationPattern(new long[]{0, 500, 200, 500});
            chGeneral.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            chGeneral.enableLights(true);
            chGeneral.setLightColor(0xFFFF6B00);
            nm.createNotificationChannel(chGeneral);

            Log.d(TAG, "✅ Notification channels v3 dibuat");
        }
    }

    // ==================== FOREGROUND NOTIFICATION ====================
    private Notification buildForegroundNotification() {
        Intent intent = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(this, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CH_SERVICE)
                .setContentTitle("🐧 Pinguin Absen")
                .setContentText("Notifikasi aktif — Anda akan menerima pesan & info absen")
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentIntent(pi)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .setSilent(true)
                .build();
    }

    // ==================== WEBSOCKET (PUSHER PROTOCOL) ====================
    private void connectWebSocket() {
        String url = "wss://ws-" + PUSHER_CLUSTER + ".pusher.com/app/" + PUSHER_KEY
                + "?protocol=7&client=android&version=1.0&flash=false";

        Log.d(TAG, "🔌 Connecting to: " + url);

        Request request = new Request.Builder()
                .url(url)
                .build();

        webSocket = httpClient.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(@NonNull WebSocket ws, @NonNull Response response) {
                Log.d(TAG, "🔌 WebSocket opened");
            }

            @Override
            public void onMessage(@NonNull WebSocket ws, @NonNull String text) {
                handlePusherMessage(text);
            }

            @Override
            public void onClosing(@NonNull WebSocket ws, int code, @NonNull String reason) {
                Log.d(TAG, "🔌 WebSocket closing: " + reason);
                ws.close(1000, null);
                isConnected = false;
                scheduleReconnect();
            }

            @Override
            public void onFailure(@NonNull WebSocket ws, @NonNull Throwable t, @Nullable Response response) {
                Log.e(TAG, "🔌 WebSocket failure: " + t.getMessage());
                isConnected = false;
                scheduleReconnect();
            }
        });
    }

    private void handlePusherMessage(String text) {
        try {
            JSONObject msg = new JSONObject(text);
            String event = msg.optString("event", "");

            switch (event) {
                case "pusher:connection_established":
                    Log.d(TAG, "✅ Pusher CONNECTED!");
                    isConnected = true;
                    // Subscribe to channel
                    subscribeTo(PUSHER_CHANNEL);
                    break;

                case "pusher_internal:subscription_succeeded":
                    Log.d(TAG, "✅ Subscribed to " + msg.optString("channel"));
                    break;

                case "pusher:error":
                    String errorMsg = "";
                    try {
                        errorMsg = new JSONObject(msg.optString("data", "{}")).optString("message", "Unknown");
                    } catch (Exception e) { errorMsg = msg.optString("data", "Unknown"); }
                    Log.e(TAG, "❌ Pusher error: " + errorMsg);
                    break;

                case "pusher:ping":
                    // Respond to server ping
                    webSocket.send("{\"event\":\"pusher:pong\",\"data\":{}}");
                    break;

                // === APP EVENTS ===
                case "new-message":
                    handleNewMessage(msg);
                    break;

                case "absen-alert":
                    handleAbsenAlert(msg);
                    break;

                case "lembur-alert":
                    handleLemburAlert(msg);
                    break;

                case "swap-shift-alert":
                    handleSwapShiftAlert(msg);
                    break;

                case "izin-alert":
                    handleIzinAlert(msg);
                    break;

                case "tugas-alert":
                    handleTugasAlert(msg);
                    break;

                case "berita-alert":
                    handleBeritaAlert(msg);
                    break;

                case "jadwal-alert":
                    handleJadwalAlert(msg);
                    break;

                default:
                    Log.d(TAG, "📩 Event: " + event);
                    break;
            }
        } catch (Exception e) {
            Log.e(TAG, "Parse error: " + e.getMessage());
        }
    }

    private void subscribeTo(String channel) {
        try {
            JSONObject sub = new JSONObject();
            sub.put("event", "pusher:subscribe");
            JSONObject data = new JSONObject();
            data.put("channel", channel);
            sub.put("data", data);
            webSocket.send(sub.toString());
            Log.d(TAG, "📡 Subscribing to: " + channel);
        } catch (Exception e) {
            Log.e(TAG, "Subscribe error: " + e.getMessage());
        }
    }

    private String getUserIdFromPrefs() {
        SharedPreferences prefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        return prefs.getString("userId", "");
    }

    private boolean isUserAdmin() {
        SharedPreferences prefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        String role = prefs.getString("userRole", "");
        return role.toLowerCase().contains("admin");
    }

    // ==================== EVENT HANDLERS ====================
    private void handleNewMessage(JSONObject msg) {
        if (MainActivity.isAppInForeground) {
            Log.d(TAG, "⏭️ Skip notif (app foreground)");
            return;
        }
        try {
            JSONObject data = new JSONObject(msg.optString("data", "{}"));
            String nama = data.optString("nama", "Seseorang");
            String pesan = data.optString("pesan", data.optString("message", "Pesan baru"));
            fireNotification(CH_CHAT, "💬 " + nama, pesan);
        } catch (Exception e) {
            Log.e(TAG, "Chat parse error: " + e.getMessage());
        }
    }

    private void handleAbsenAlert(JSONObject msg) {
        if (MainActivity.isAppInForeground) return;
        try {
            JSONObject data = new JSONObject(msg.optString("data", "{}"));
            
            // Filter: Hanya Admin yang melihat absen masuk/pulang
            if (!isUserAdmin()) return;
            
            String tipe = data.optString("tipe", "Masuk");
            String pesan = data.optString("pesan", "Ada update absensi");
            String title = tipe.equals("Pulang") ? "🏠 Absen Pulang" : "✅ Absen Masuk";
            fireNotification(CH_GENERAL, title, pesan);
        } catch (Exception e) {
            Log.e(TAG, "Absen parse error: " + e.getMessage());
        }
    }

    private void handleLemburAlert(JSONObject msg) {
        if (MainActivity.isAppInForeground) return;
        try {
            JSONObject data = new JSONObject(msg.optString("data", "{}"));
            
            // Filter: Hanya Admin ATAU yang bersangkutan
            String targetId = data.optString("idKaryawan", "");
            if (!isUserAdmin() && !targetId.equals(getUserIdFromPrefs())) return;

            String status = data.optString("status", "Pending");
            String pesan = data.optString("pesan", "Ada update lembur");
            String title;
            switch (status) {
                case "Approved": title = "✅ Lembur Disetujui"; break;
                case "Rejected": title = "❌ Lembur Ditolak"; break;
                default: title = "🔥 Pengajuan Lembur"; break;
            }
            fireNotification(CH_GENERAL, title, pesan);
        } catch (Exception e) {
            Log.e(TAG, "Lembur parse error: " + e.getMessage());
        }
    }

    private void handleSwapShiftAlert(JSONObject msg) {
        if (MainActivity.isAppInForeground) return;
        try {
            JSONObject data = new JSONObject(msg.optString("data", "{}"));

            // Filter: Hanya target tukar shift ATAU Admin
            String targetId = data.optString("targetId", "");
            if (!isUserAdmin() && !targetId.equals(getUserIdFromPrefs())) return;

            String requester = data.optString("requesterName", "Seseorang");
            fireNotification(CH_GENERAL, "🔄 Permintaan Tukar Shift", requester + " meminta tukar shift dengan Anda");
        } catch (Exception e) {
            Log.e(TAG, "Shift parse error: " + e.getMessage());
        }
    }

    private void handleIzinAlert(JSONObject msg) {
        if (MainActivity.isAppInForeground) return;
        try {
            JSONObject data = new JSONObject(msg.optString("data", "{}"));
            
            // Filter: Hanya Admin ATAU target pengajuan izin
            String targetId = data.optString("idKaryawan", "");
            if (!isUserAdmin() && !targetId.equals(getUserIdFromPrefs())) return;

            String status = data.optString("status", "Pending");
            String title = status.equals("Approved") ? "✅ Izin Disetujui" : (status.equals("Rejected") ? "❌ Izin Ditolak" : "📋 Pengajuan Izin");
            
            String pesan = data.optString("pesan", "Ada pengajuan izin baru");
            fireNotification(CH_GENERAL, title, pesan);
        } catch (Exception e) {
            Log.e(TAG, "Izin parse error: " + e.getMessage());
        }
    }

    private void handleTugasAlert(JSONObject msg) {
        if (MainActivity.isAppInForeground) return;
        try {
            JSONObject data = new JSONObject(msg.optString("data", "{}"));
            
            // Filter: Hanya Admin ATAU target tugas
            String targetId = data.optString("idKaryawan", "");
            if (!isUserAdmin() && !targetId.equals(getUserIdFromPrefs())) return;

            String pesan = data.optString("pesan", "Ada tugas baru");
            fireNotification(CH_GENERAL, "📝 Tugas Baru", pesan);
        } catch (Exception e) {
            Log.e(TAG, "Tugas parse error: " + e.getMessage());
        }
    }

    private void handleBeritaAlert(JSONObject msg) {
        if (MainActivity.isAppInForeground) return;
        try {
            JSONObject data = new JSONObject(msg.optString("data", "{}"));
            String judul = data.optString("judul", "Pengumuman baru");
            String pesan = data.optString("pesan", judul);
            fireNotification(CH_GENERAL, "📰 Pengumuman Baru", pesan);
        } catch (Exception e) {
            Log.e(TAG, "Berita parse error: " + e.getMessage());
        }
    }

    private void handleJadwalAlert(JSONObject msg) {
        if (MainActivity.isAppInForeground) return;
        try {
            JSONObject data = new JSONObject(msg.optString("data", "{}"));
            
            // Filter: Hanya target perubahan jadwal ATAU Admin
            String targetId = data.optString("idKaryawan", "");
            if (!isUserAdmin() && !targetId.equals(getUserIdFromPrefs())) return;

            String pesan = data.optString("pesan", "Jadwal Anda telah diperbarui");
            fireNotification(CH_GENERAL, "📅 Jadwal Diubah", pesan);
        } catch (Exception e) {
            Log.e(TAG, "Jadwal parse error: " + e.getMessage());
        }
    }

    // ==================== FIRE NOTIFICATION ====================
    private void fireNotification(String channelId, String title, String message) {
        wakeScreen();

        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int thisNotifId = notifId++;

        PendingIntent contentPi = PendingIntent.getActivity(this, thisNotifId, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        PendingIntent fullScreenPi = PendingIntent.getActivity(this, thisNotifId + 10000, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Gunakan logo APK sebagai icon notifikasi
        int iconRes = R.mipmap.ic_launcher;

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
                .setSmallIcon(iconRes)
                .setContentTitle(title)
                .setContentText(message)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                .setWhen(System.currentTimeMillis())
                .setShowWhen(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setContentIntent(contentPi)
                .setFullScreenIntent(fullScreenPi, true);

        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        nm.notify(thisNotifId, builder.build());

        Log.d(TAG, "🔔 Notif #" + thisNotifId + ": " + title + " → " + message);
    }

    // ==================== WAKE SCREEN ====================
    private void wakeScreen() {
        try {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            if (pm != null && !pm.isInteractive()) {
                @SuppressWarnings("deprecation")
                PowerManager.WakeLock wl = pm.newWakeLock(
                        PowerManager.FULL_WAKE_LOCK
                                | PowerManager.ACQUIRE_CAUSES_WAKEUP
                                | PowerManager.ON_AFTER_RELEASE,
                        "pinguin:notif_wake"
                );
                wl.acquire(5000);
                Log.d(TAG, "📱 Layar dibangunkan");
            }
        } catch (Exception e) {
            Log.e(TAG, "WakeLock error: " + e.getMessage());
        }
    }

    // ==================== AUTO RECONNECT ====================
    private void scheduleReconnect() {
        if (!isRunning) return;
        reconnectHandler.postDelayed(() -> {
            Log.d(TAG, "🔄 Reconnecting WebSocket...");
            connectWebSocket();
        }, 5000);
    }

    // ==================== SERVICE LIFECYCLE ====================
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        isRunning = false;
        isConnected = false;
        if (webSocket != null) {
            try { webSocket.close(1000, "Service destroyed"); } catch (Exception ignored) {}
        }
        super.onDestroy();

        Log.d(TAG, "⚠️ Service destroyed, restarting...");
        Intent restart = new Intent(this, PinguinNotifService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(restart);
        } else {
            startService(restart);
        }
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        Intent restart = new Intent(this, PinguinNotifService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(restart);
        } else {
            startService(restart);
        }
        super.onTaskRemoved(rootIntent);
    }
}
