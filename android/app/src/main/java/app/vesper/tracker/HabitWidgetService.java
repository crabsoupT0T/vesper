package app.vesper.tracker;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import org.json.JSONArray;
import org.json.JSONObject;

public class HabitWidgetService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) {
        return new Factory(getApplicationContext());
    }

    static final class Factory implements RemoteViewsFactory {
        private final Context context;
        private JSONArray habits = new JSONArray();

        Factory(Context context) {
            this.context = context;
        }

        @Override
        public void onCreate() {
            reload();
        }

        @Override
        public void onDataSetChanged() {
            reload();
        }

        @Override
        public void onDestroy() {
            habits = new JSONArray();
        }

        @Override
        public int getCount() {
            return habits.length();
        }

        @Override
        public RemoteViews getViewAt(int position) {
            RemoteViews row = new RemoteViews(context.getPackageName(), R.layout.widget_habit_row);
            JSONObject habit = habits.optJSONObject(position);
            if (habit == null) return row;
            String id = habit.optString("id", "");
            boolean count = "count".equals(habit.optString("kind"));
            boolean done = habit.optBoolean("done");
            row.setTextViewText(R.id.habit_mark, done ? "✓" : "○");
            row.setTextViewText(R.id.habit_name, habit.optString("name", "Habit"));
            if (count) {
                row.setViewVisibility(R.id.habit_count, View.VISIBLE);
                row.setViewVisibility(R.id.habit_minus, View.VISIBLE);
                row.setViewVisibility(R.id.habit_plus, View.VISIBLE);
                row.setTextViewText(
                        R.id.habit_count,
                        habit.optInt("value", 0) + "/" + habit.optInt("target", 1));
                row.setOnClickFillInIntent(R.id.habit_minus, fill("bump", id, -1));
                row.setOnClickFillInIntent(R.id.habit_plus, fill("bump", id, 1));
            } else {
                row.setViewVisibility(R.id.habit_count, View.GONE);
                row.setViewVisibility(R.id.habit_minus, View.GONE);
                row.setViewVisibility(R.id.habit_plus, View.GONE);
                row.setOnClickFillInIntent(R.id.habit_row, fill("toggle", id, 0));
            }
            return row;
        }

        @Override
        public RemoteViews getLoadingView() {
            return null;
        }

        @Override
        public int getViewTypeCount() {
            return 1;
        }

        @Override
        public long getItemId(int position) {
            return position;
        }

        @Override
        public boolean hasStableIds() {
            return true;
        }

        private void reload() {
            SharedPreferences prefs = context.getSharedPreferences(GlanceWidget.PREFS, Context.MODE_PRIVATE);
            try {
                JSONObject snap = new JSONObject(prefs.getString(GlanceWidget.KEY, "{}"));
                JSONArray list = snap.optJSONArray("habits");
                habits = list == null ? new JSONArray() : list;
            } catch (Exception ignored) {
                habits = new JSONArray();
            }
        }

        private static Intent fill(String op, String id, int delta) {
            Intent intent = new Intent();
            intent.putExtra("op", op);
            intent.putExtra("id", id);
            intent.putExtra("delta", delta);
            return intent;
        }
    }
}
