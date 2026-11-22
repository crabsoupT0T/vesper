package app.vesper.tracker;

import android.app.NotificationManager;
import android.content.SharedPreferences;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import org.json.JSONArray;
import org.json.JSONObject;

import java.lang.ref.WeakReference;

public class LockOverlayActivity extends AppCompatActivity {
    private static WeakReference<LockOverlayActivity> open;

    static void close() {
        LockOverlayActivity activity = open == null ? null : open.get();
        if (activity != null) activity.finish();
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                            | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
        open = new WeakReference<>(this);
        setContentView(R.layout.activity_lock);
        fillList();
        findViewById(R.id.lock_commit).setOnClickListener(view -> dismiss());
    }

    @Override
    protected void onDestroy() {
        if (open != null && open.get() == this) open = null;
        super.onDestroy();
    }

    private void fillList() {
        LinearLayout list = findViewById(R.id.lock_list);
        list.removeAllViews();
        JSONArray tasks = readTasks();
        if (tasks.length() == 0) {
            list.addView(line("Nothing on the list.", false));
            return;
        }
        for (int i = 0; i < tasks.length(); i++) {
            org.json.JSONObject task = tasks.optJSONObject(i);
            String title = task != null ? task.optString("title", "") : tasks.optString(i, "");
            String id = task != null ? task.optString("id", "") : "";
            title = title.trim();
            if (title.isEmpty()) continue;
            TextView row = line("□  " + title, true);
            if (!id.isEmpty()) {
                String taskId = id;
                row.setOnClickListener(view -> {
                    LockWatchService.checkTask(this, taskId);
                    fillList();
                });
            }
            list.addView(row);
        }
    }

    private TextView line(String text, boolean item) {
        TextView view = new TextView(this);
        view.setText(text);
        view.setTextColor(item ? 0xFFF4F4F5 : 0xFFA1A1AA);
        view.setTextSize(item ? 18f : 15f);
        view.setTypeface(Typeface.SANS_SERIF);
        view.setPadding(0, item ? 18 : 8, 0, item ? 18 : 8);
        return view;
    }

    private JSONArray readTasks() {
        SharedPreferences prefs = getSharedPreferences(GlanceWidget.PREFS, MODE_PRIVATE);
        try {
            JSONObject snap = new JSONObject(prefs.getString(GlanceWidget.KEY, "{}"));
            JSONArray tasks = snap.optJSONArray("tasks");
            return tasks == null ? new JSONArray() : tasks;
        } catch (Exception ignored) {
            return new JSONArray();
        }
    }

    private void dismiss() {
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager != null) manager.cancel(LockWatchService.NOTE_ID);
        ViewRootFade.out(findViewById(R.id.lock_root), this::finish);
    }

    private static final class ViewRootFade {
        static void out(android.view.View root, Runnable done) {
            root.animate().alpha(0f).setDuration(220).withEndAction(done).start();
        }
    }
}
