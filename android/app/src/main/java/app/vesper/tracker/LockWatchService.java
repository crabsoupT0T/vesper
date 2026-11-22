package app.vesper.tracker;

import android.app.KeyguardManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;

public class LockWatchService extends Service {
    static final String PREFS = GlanceWidget.PREFS;
    static final String ENABLED = "lock_enabled";
    static final int NOTE_ID = 47;
    private static final int WATCH_ID = 46;
    private static final String WATCH_CHANNEL = "vesper_lock_watch";
    private static final String ALARM_CHANNEL = "vesper_lock_alarm";

    private BroadcastReceiver screen;

    static boolean isEnabled(Context context) {
        return context.getSharedPreferences(PREFS, MODE_PRIVATE).getBoolean(ENABLED, false);
    }

    static void setEnabled(Context context, boolean on) {
        context.getSharedPreferences(PREFS, MODE_PRIVATE).edit().putBoolean(ENABLED, on).apply();
        if (on && notificationsAllowed(context)) start(context);
        else stop(context);
    }

    static void ensure(Context context) {
        if (isEnabled(context) && notificationsAllowed(context)) start(context);
    }

    static void start(Context context) {
        Intent intent = new Intent(context, LockWatchService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    static void stop(Context context) {
        context.stopService(new Intent(context, LockWatchService.class));
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createChannels();
        Notification notice = watchNotice();
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(WATCH_ID, notice, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(WATCH_ID, notice);
        }
        screen = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (intent == null || intent.getAction() == null) return;
                if (Intent.ACTION_SCREEN_OFF.equals(intent.getAction())) {
                    LockOverlayActivity.close();
                    return;
                }
                if (Intent.ACTION_SCREEN_ON.equals(intent.getAction())) {
                    showOverLock(context);
                }
            }
        };
        IntentFilter filter = new IntentFilter();
        filter.addAction(Intent.ACTION_SCREEN_ON);
        filter.addAction(Intent.ACTION_SCREEN_OFF);
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(screen, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(screen, filter);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (!isEnabled(this) || !notificationsAllowed(this)) {
            stopSelf();
            return START_NOT_STICKY;
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        if (screen != null) {
            unregisterReceiver(screen);
            screen = null;
        }
        cancelPrompt();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void showOverLock(Context context) {
        if (!isEnabled(context) || !notificationsAllowed(context)) return;
        KeyguardManager keyguard = (KeyguardManager) context.getSystemService(KEYGUARD_SERVICE);
        if (keyguard != null && !keyguard.isKeyguardLocked()) return;
        if (Build.VERSION.SDK_INT >= 34) {
            NotificationManager manager = (NotificationManager) context.getSystemService(NOTIFICATION_SERVICE);
            if (manager != null && !manager.canUseFullScreenIntent()) return;
        }
        Intent activity = new Intent(context, LockOverlayActivity.class);
        activity.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent full = PendingIntent.getActivity(
                context,
                9,
                activity,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification prompt = new NotificationCompat.Builder(context, ALARM_CHANNEL)
                .setSmallIcon(R.drawable.ic_lock_note)
                .setContentTitle("Today")
                .setContentText("I will do it today")
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setFullScreenIntent(full, true)
                .setContentIntent(full)
                .setAutoCancel(true)
                .build();
        NotificationManager manager = (NotificationManager) context.getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) manager.notify(NOTE_ID, prompt);
    }

    private static boolean notificationsAllowed(Context context) {
        if (Build.VERSION.SDK_INT < 33) return true;
        return context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED;
    }

    private void cancelPrompt() {
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) manager.cancel(NOTE_ID);
    }

    private void createChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager == null) return;
        NotificationChannel watch = new NotificationChannel(
                WATCH_CHANNEL,
                "Lock screen watch",
                NotificationManager.IMPORTANCE_MIN);
        watch.setDescription("Keeps the lock-screen list ready. Stays quiet.");
        NotificationChannel alarm = new NotificationChannel(
                ALARM_CHANNEL,
                "Lock screen list",
                NotificationManager.IMPORTANCE_HIGH);
        alarm.setDescription("Shows today's list in front of the lock screen.");
        alarm.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(watch);
        manager.createNotificationChannel(alarm);
    }

    private Notification watchNotice() {
        return new NotificationCompat.Builder(this, WATCH_CHANNEL)
                .setSmallIcon(R.drawable.ic_lock_note)
                .setContentTitle("Lock screen list is on")
                .setContentText("Vesper appears when the screen wakes.")
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .setOngoing(true)
                .setSilent(true)
                .build();
    }
}
