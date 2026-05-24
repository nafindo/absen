package com.pinguincell.absen;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    public static boolean isAppInForeground = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Intent serviceIntent = new Intent(this, PinguinNotifService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        isAppInForeground = true;
    }

    @Override
    public void onPause() {
        super.onPause();
        isAppInForeground = false;
    }
}
