package app.vesper.tracker;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

public class GlanceWidget extends AppWidgetProvider {
    static final String PREFS = "vesper_widgets";
    static final String KEY = "snapshot";

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

    private static RemoteViews render(Context context, String kind) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSONObject snap = new JSONObject();
        try {
            String raw = prefs.getString(KEY, "");
            if (raw != null && !raw.isEmpty()) snap = new JSONObject(raw);
        } catch (Exception ignored) {
            snap = new JSONObject();
        }

        if ("habits".equals(kind)) return habits(context, snap);
        return stat(context, kind, snap);
    }

    private static RemoteViews stat(Context context, String kind, JSONObject snap) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_stat);
        String kicker = "Today";
        String value = snap.optString("todayValue", "—");
        String detail = snap.optString("todayDetail", "Open Vesper once");
        String note = snap.optString("todayNote", "");
        if ("streak".equals(kind)) {
            kicker = "Streak";
            value = snap.optString("streakValue", "0");
            detail = snap.optString("streakDetail", "days");
            note = snap.optString("streakNote", "");
        } else if ("mood".equals(kind)) {
            kicker = "Mood";
            value = snap.optString("moodValue", "—");
            detail = snap.optString("moodDetail", "unmarked");
            note = snap.optString("moodNote", "");
        }
        views.setTextViewText(R.id.widget_kicker, kicker);
        views.setTextViewText(R.id.widget_value, value);
        views.setTextViewText(R.id.widget_detail, detail);
        views.setTextViewText(R.id.widget_note, note);
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
            for (int i = 1; i < ids.length; i++) {
                views.setViewVisibility(ids[i], View.GONE);
            }
        } else {
            int shown = Math.min(3, count);
            for (int i = 0; i < shown; i++) {
                JSONObject habit = habits.optJSONObject(i);
                String line = habit == null ? "" : habit.optString("line", "");
                views.setTextViewText(ids[i], line);
                views.setViewVisibility(ids[i], View.VISIBLE);
            }
            if (count > 3) {
                views.setTextViewText(R.id.habit_4, "+" + (count - 3) + " more");
                views.setViewVisibility(R.id.habit_4, View.VISIBLE);
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
