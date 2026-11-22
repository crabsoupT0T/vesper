package app.vesper.tracker;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.style.ForegroundColorSpan;
import android.text.style.StrikethroughSpan;
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
        private JSONArray rows = new JSONArray();

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
            rows = new JSONArray();
        }

        @Override
        public int getCount() {
            return rows.length();
        }

        @Override
        public RemoteViews getViewAt(int position) {
            RemoteViews row = new RemoteViews(context.getPackageName(), R.layout.widget_habit_row);
            JSONObject habit = rows.optJSONObject(position);
            if (habit == null) return row;
            String id = habit.optString("id", "");
            boolean count = "count".equals(habit.optString("kind"));
            boolean striking = habit.optBoolean("striking");
            String name = habit.optString("name", "Habit");
            row.setTextViewText(R.id.habit_mark, striking ? "■" : "□");
            if (striking) {
                SpannableString struck = new SpannableString(name);
                struck.setSpan(new StrikethroughSpan(), 0, name.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                struck.setSpan(new ForegroundColorSpan(0xFF71717A), 0, name.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                row.setTextViewText(R.id.habit_name, struck);
            } else {
                row.setTextViewText(R.id.habit_name, name);
            }
            row.setOnClickFillInIntent(R.id.habit_mark, fill("finish", id, 0));
            if (count && !striking) {
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
                rows = list == null ? new JSONArray() : list;
            } catch (Exception ignored) {
                rows = new JSONArray();
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
