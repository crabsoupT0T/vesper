package app.vesper.tracker;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.style.ForegroundColorSpan;
import android.text.style.StrikethroughSpan;
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
        private String dateLabel = "";

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
            JSONObject item = rows.optJSONObject(position);
            if (item == null) return row;
            String id = item.optString("id", "");
            boolean striking = item.optBoolean("striking");
            String name = item.optString("name", "Today");
            row.setImageViewResource(
                    R.id.habit_mark,
                    striking ? R.drawable.widget_circle_on : R.drawable.widget_circle);
            if (striking) {
                SpannableString struck = new SpannableString(name);
                struck.setSpan(new StrikethroughSpan(), 0, name.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                struck.setSpan(new ForegroundColorSpan(0xFF8E8E93), 0, name.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
                row.setTextViewText(R.id.habit_name, struck);
            } else {
                row.setTextViewText(R.id.habit_name, name);
            }
            row.setTextViewText(R.id.habit_meta, item.optString("meta", dateLabel));
            row.setTextViewText(R.id.habit_side, item.optString("side", ""));
            row.setOnClickFillInIntent(R.id.habit_mark, fill(item.optString("op", "finish"), id, 0));
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
            JSONArray next = new JSONArray();
            dateLabel = "";
            try {
                JSONObject snap = new JSONObject(prefs.getString(GlanceWidget.KEY, "{}"));
                dateLabel = dateLabel(snap.optString("date", ""));
                JSONArray habits = snap.optJSONArray("habits");
                if (habits != null) {
                    for (int i = 0; i < habits.length(); i++) {
                        JSONObject habit = habits.optJSONObject(i);
                        if (habit == null) continue;
                        JSONObject row = new JSONObject();
                        row.put("id", habit.optString("id"));
                        row.put("op", "finish");
                        row.put("name", habit.optString("name", "Habit"));
                        row.put("striking", habit.optBoolean("striking"));
                        row.put("side", habit.optString("part", "Habit"));
                        String meta = dateLabel;
                        if ("count".equals(habit.optString("kind"))) {
                            String count = habit.optInt("value", 0) + "/" + habit.optInt("target", 1);
                            meta = meta.isEmpty() ? count : meta + "   " + count;
                        }
                        row.put("meta", meta);
                        next.put(row);
                    }
                }
                JSONArray tasks = snap.optJSONArray("tasks");
                if (tasks != null) {
                    for (int i = 0; i < tasks.length(); i++) {
                        JSONObject task = tasks.optJSONObject(i);
                        if (task == null) continue;
                        String title = task.optString("title", "").trim();
                        if (title.isEmpty()) continue;
                        JSONObject row = new JSONObject();
                        row.put("id", task.optString("id"));
                        row.put("op", "task");
                        row.put("name", title);
                        row.put("striking", task.optBoolean("striking"));
                        row.put("side", "To do");
                        row.put("meta", dateLabel);
                        next.put(row);
                    }
                }
            } catch (Exception ignored) {
                next = new JSONArray();
            }
            rows = next;
        }

        private static String dateLabel(String date) {
            String[] parts = date.split("-");
            if (parts.length != 3) return "";
            String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
            try {
                int month = Integer.parseInt(parts[1]);
                int day = Integer.parseInt(parts[2]);
                if (month < 1 || month > 12) return "";
                return day + " " + months[month - 1];
            } catch (NumberFormatException ignored) {
                return "";
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
