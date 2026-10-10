package app.vesper.tracker;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

public class GlanceWidget extends AppWidgetProvider {
    static final String PREFS = "vesper_widgets";
    static final String KEY = "snapshot";
    static final String ACTIONS = "actions";
    static final String ACTION = "app.vesper.tracker.WIDGET_ACTION";

    private static final String[] MOOD_LABELS = {"", "Rough", "Dim", "Steady", "Clear", "Bright"};
    private static final String[] MOOD_EMOJI = {"", "😞", "😕", "😐", "🙂", "😄"};

    private final String kind;

    public GlanceWidget() {
        this("today");
    }

    protected GlanceWidget(String kind) {
        this.kind = kind;
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            manager.updateAppWidget(id, render(context, kind));
        }
    }

    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        refresh(context, manager, TodayWidget.class, "today");
        refresh(context, manager, StreakWidget.class, "streak");
        refresh(context, manager, MoodWidget.class, "mood");
        refresh(context, manager, HabitsWidget.class, "habits");
    }

    private static void refresh(
            Context context,
            AppWidgetManager manager,
            Class<?> provider,
            String kind) {
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, provider));
        for (int id : ids) {
            manager.updateAppWidget(id, render(context, kind));
        }
    }

    static ComponentName providerFor(Context context, String kind) {
        Class<?> provider = TodayWidget.class;
        if ("streak".equals(kind)) provider = StreakWidget.class;
        else if ("mood".equals(kind)) provider = MoodWidget.class;
        else if ("habits".equals(kind)) provider = HabitsWidget.class;
        return new ComponentName(context, provider);
    }

    static void handleAction(Context context, Intent intent) {
        if (intent == null || !ACTION.equals(intent.getAction())) return;
        String op = intent.getStringExtra("op");
        if (op == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSONObject snap = readSnap(prefs);
        JSONArray actions = readActions(prefs);
        String date = snap.optString("date", "");
        try {
            if ("toggle".equals(op)) {
                String id = intent.getStringExtra("id");
                if (id == null || id.isEmpty() || date.isEmpty()) return;
                boolean changed = toggleHabit(snap, id);
                if (!changed && id.equals(snap.optString("streakHabitId"))) {
                    boolean done = !snap.optBoolean("streakDone");
                    int streak = parseInt(snap.optString("streakValue", "0"));
                    if (done && !snap.optBoolean("streakDone")) streak += 1;
                    if (!done && snap.optBoolean("streakDone")) streak = Math.max(0, streak - 1);
                    snap.put("streakDone", done);
                    snap.put("streakValue", String.valueOf(streak));
                    snap.put("streakDetail", streak == 1 ? "day" : "days");
                    changed = true;
                }
                if (!changed) return;
                JSONObject action = new JSONObject();
                action.put("op", "toggle");
                action.put("id", id);
                action.put("date", date);
                actions.put(action);
            } else if ("mood".equals(op)) {
                if (date.isEmpty()) return;
                int mood = intent.getIntExtra("mood", 0);
                if (mood == snap.optInt("moodLevel", 0)) mood = 0;
                applyMood(snap, mood);
                JSONObject action = new JSONObject();
                action.put("op", "mood");
                action.put("mood", mood);
                action.put("date", date);
                actions.put(action);
            } else {
                return;
            }
            prefs.edit()
                    .putString(KEY, snap.toString())
                    .putString(ACTIONS, actions.toString())
                    .apply();
            refreshAll(context);
        } catch (Exception ignored) {
        }
    }

    private static JSONObject readSnap(SharedPreferences prefs) {
        try {
            String raw = prefs.getString(KEY, "");
            if (raw != null && !raw.isEmpty()) return new JSONObject(raw);
        } catch (Exception ignored) {
        }
        return new JSONObject();
    }

    private static JSONArray readActions(SharedPreferences prefs) {
        try {
            String raw = prefs.getString(ACTIONS, "[]");
            if (raw != null && !raw.isEmpty()) return new JSONArray(raw);
        } catch (Exception ignored) {
        }
        return new JSONArray();
    }

    private static boolean toggleHabit(JSONObject snap, String id) throws Exception {
        JSONArray habits = snap.optJSONArray("habits");
        if (habits == null) return false;
        boolean found = false;
        for (int i = 0; i < habits.length(); i++) {
            JSONObject habit = habits.optJSONObject(i);
            if (habit == null || !id.equals(habit.optString("id"))) continue;
            boolean done = !habit.optBoolean("done");
            habit.put("done", done);
            String name = habit.optString("name", "Habit");
            String count = "";
            if ("count".equals(habit.optString("kind"))) {
                int target = habit.optInt("target", 1);
                int value = done ? target : 0;
                habit.put("value", value);
                count = " " + value + "/" + target;
            }
            habit.put("line", (done ? "✓ " : "○ ") + name + count);
            if (id.equals(snap.optString("streakHabitId"))) {
                boolean was = snap.optBoolean("streakDone");
                int streak = parseInt(snap.optString("streakValue", "0"));
                if (done && !was) streak += 1;
                if (!done && was) streak = Math.max(0, streak - 1);
                snap.put("streakValue", String.valueOf(streak));
                snap.put("streakDone", done);
                snap.put("streakDetail", streak == 1 ? "day" : "days");
            }
            found = true;
            break;
        }
        if (!found) return false;
        recount(snap, habits);
        return true;
    }

    private static void recount(JSONObject snap, JSONArray habits) throws Exception {
        int due = habits.length();
        int doneCount = 0;
        String nextId = "";
        String nextName = "";
        for (int i = 0; i < habits.length(); i++) {
            JSONObject habit = habits.optJSONObject(i);
            if (habit == null) continue;
            if (habit.optBoolean("done")) {
                doneCount += 1;
            } else if (nextId.isEmpty()) {
                nextId = habit.optString("id");
                nextName = habit.optString("name");
            }
        }
        snap.put("nextId", nextId);
        if (due == 0) {
            snap.put("todayValue", "—");
            snap.put("todayDetail", "Nothing due");
            snap.put("todayNote", "Quiet day");
            return;
        }
        snap.put("todayValue", String.valueOf(Math.round(doneCount * 100f / due)));
        snap.put("todayDetail", doneCount + " of " + due);
        snap.put("todayNote", nextName.isEmpty() ? "All in" : nextName);
    }

    private static void applyMood(JSONObject snap, int mood) throws Exception {
        if (mood < 1 || mood > 5) {
            snap.put("moodLevel", 0);
            snap.put("moodValue", "—");
            snap.put("moodDetail", "unmarked");
            snap.put("moodNote", "Tap a face");
            return;
        }
        snap.put("moodLevel", mood);
        snap.put("moodValue", MOOD_EMOJI[mood]);
        snap.put("moodDetail", MOOD_LABELS[mood]);
        snap.put("moodNote", "Logged");
    }

    private static int parseInt(String raw) {
        try {
            return Integer.parseInt(raw);
        } catch (Exception ignored) {
            return 0;
        }
    }

    private static RemoteViews render(Context context, String kind) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSONObject snap = readSnap(prefs);
        if ("habits".equals(kind)) return habits(context, snap);
        if ("mood".equals(kind)) return mood(context, snap);
        return stat(context, kind, snap);
    }

    private static RemoteViews stat(Context context, String kind, JSONObject snap) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_stat);
        String kicker = "Today";
        String value = snap.optString("todayValue", "—");
        String detail = snap.optString("todayDetail", "Open Vesper once");
        String note = snap.optString("todayNote", "");
        String actionId = snap.optString("nextId", "");
        String actionLabel = "Mark next";
        if ("streak".equals(kind)) {
            kicker = "Streak";
            value = snap.optString("streakValue", "0");
            detail = snap.optString("streakDetail", "days");
            note = snap.optString("streakNote", "");
            actionId = snap.optString("streakHabitId", "");
            actionLabel = snap.optBoolean("streakDone") ? "Undo today" : "Mark today";
        }
        views.setTextViewText(R.id.widget_kicker, kicker);
        views.setTextViewText(R.id.widget_value, value);
        views.setTextViewText(R.id.widget_detail, detail);
        views.setTextViewText(R.id.widget_note, note);
        if (actionId.isEmpty()) {
            views.setViewVisibility(R.id.widget_action, View.GONE);
            views.setOnClickPendingIntent(R.id.widget_root, openApp(context));
        } else {
            views.setViewVisibility(R.id.widget_action, View.VISIBLE);
            views.setTextViewText(R.id.widget_action, actionLabel);
            views.setOnClickPendingIntent(R.id.widget_action, broadcast(context, "toggle", actionId, 0, "streak".equals(kind) ? 40 : 30));
            views.setOnClickPendingIntent(R.id.widget_root, openApp(context));
        }
        return views;
    }

    private static RemoteViews mood(Context context, JSONObject snap) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_mood);
        views.setTextViewText(R.id.widget_value, snap.optString("moodValue", "—"));
        views.setTextViewText(R.id.widget_detail, snap.optString("moodDetail", "unmarked"));
        int[] ids = {R.id.mood_1, R.id.mood_2, R.id.mood_3, R.id.mood_4, R.id.mood_5};
        int selected = snap.optInt("moodLevel", 0);
        for (int i = 0; i < ids.length; i++) {
            views.setOnClickPendingIntent(ids[i], broadcast(context, "mood", "", i + 1, 10 + i));
            views.setInt(ids[i], "setBackgroundResource", selected == i + 1 ? R.drawable.widget_btn_on : R.drawable.widget_btn);
        }
        views.setOnClickPendingIntent(R.id.widget_root, openApp(context));
        return views;
    }

    private static RemoteViews habits(Context context, JSONObject snap) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_habits);
        int[] ids = {R.id.habit_1, R.id.habit_2, R.id.habit_3, R.id.habit_4};
        JSONArray habits = snap.optJSONArray("habits");
        int count = habits == null ? 0 : habits.length();
        if (count == 0) {
            views.setTextViewText(R.id.habit_1, "Nothing due. Open Vesper.");
            views.setOnClickPendingIntent(R.id.habit_1, openApp(context));
            for (int i = 1; i < ids.length; i++) {
                views.setViewVisibility(ids[i], View.GONE);
            }
        } else {
            int shown = Math.min(3, count);
            for (int i = 0; i < shown; i++) {
                JSONObject habit = habits.optJSONObject(i);
                String line = habit == null ? "" : habit.optString("line", "");
                String id = habit == null ? "" : habit.optString("id", "");
                views.setTextViewText(ids[i], line);
                views.setViewVisibility(ids[i], View.VISIBLE);
                views.setOnClickPendingIntent(ids[i], broadcast(context, "toggle", id, 0, i + 1));
            }
            if (count > 3) {
                views.setTextViewText(R.id.habit_4, "+" + (count - 3) + " more");
                views.setViewVisibility(R.id.habit_4, View.VISIBLE);
                views.setOnClickPendingIntent(R.id.habit_4, openApp(context));
            } else {
                views.setViewVisibility(R.id.habit_4, View.GONE);
                for (int i = shown; i < 3; i++) {
                    views.setViewVisibility(ids[i], View.GONE);
                }
            }
        }
        views.setOnClickPendingIntent(R.id.widget_root, openApp(context));
        return views;
    }

    private static PendingIntent broadcast(Context context, String op, String id, int mood, int request) {
        Intent intent = new Intent(context, WidgetActionReceiver.class);
        intent.setAction(ACTION);
        intent.putExtra("op", op);
        intent.putExtra("id", id == null ? "" : id);
        intent.putExtra("mood", mood);
        intent.setData(Uri.parse("vesper://widget/" + op + "/" + request + "/" + (id == null ? "" : id) + "/" + mood));
        return PendingIntent.getBroadcast(
                context,
                request,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent openApp(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
