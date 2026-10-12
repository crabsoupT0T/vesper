package app.vesper.tracker;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "VesperWidgets")
public class VesperWidgetsPlugin extends Plugin {
    @PluginMethod
    public void sync(PluginCall call) {
        String payload = call.getString("payload", "{}");
        android.content.SharedPreferences prefs = getContext()
                .getSharedPreferences(GlanceWidget.PREFS, android.content.Context.MODE_PRIVATE);
        String previous = prefs.getString(GlanceWidget.KEY, "");
        prefs.edit()
                .putString(GlanceWidget.KEY, keepStrikes(previous, payload))
                .apply();
        GlanceWidget.refreshAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void pull(PluginCall call) {
        android.content.SharedPreferences prefs = getContext()
                .getSharedPreferences(GlanceWidget.PREFS, android.content.Context.MODE_PRIVATE);
        String actions = prefs.getString(GlanceWidget.ACTIONS, "[]");
        prefs.edit().putString(GlanceWidget.ACTIONS, "[]").commit();
        JSObject result = new JSObject();
        result.put("actions", actions == null || actions.isEmpty() ? "[]" : actions);
        call.resolve(result);
    }

    @PluginMethod
    public void pin(PluginCall call) {
        String kind = call.getString("kind", "habits");
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.reject("This Android version cannot pin a widget. Long-press the home screen instead.");
            return;
        }
        AppWidgetManager manager = AppWidgetManager.getInstance(getContext());
        if (!manager.isRequestPinAppWidgetSupported()) {
            call.reject("This launcher cannot place a widget from the app. Long-press the home screen, then Widgets, then Vesper.");
            return;
        }
        ComponentName provider = GlanceWidget.providerFor(getContext(), kind);
        boolean asked = manager.requestPinAppWidget(provider, null, null);
        if (!asked) {
            call.reject("The home screen did not ask to place the widget.");
            return;
        }
        call.resolve();
    }

    private static String keepStrikes(String previous, String next) {
        if (previous == null || previous.isEmpty() || next == null || next.isEmpty()) return next;
        try {
            JSONObject oldSnap = new JSONObject(previous);
            JSONArray oldHabits = oldSnap.optJSONArray("habits");
            if (oldHabits == null) return next;
            JSONArray striking = new JSONArray();
            for (int i = 0; i < oldHabits.length(); i++) {
                JSONObject habit = oldHabits.optJSONObject(i);
                if (habit != null && habit.optBoolean("striking")) striking.put(habit);
            }
            if (striking.length() == 0) return next;
            JSONObject fresh = new JSONObject(next);
            JSONArray incoming = fresh.optJSONArray("habits");
            if (incoming == null) incoming = new JSONArray();
            for (int i = 0; i < incoming.length(); i++) {
                JSONObject habit = incoming.optJSONObject(i);
                if (habit == null || containsId(striking, habit.optString("id"))) continue;
                striking.put(habit);
            }
            fresh.put("habits", striking);
            return fresh.toString();
        } catch (Exception ignored) {
            return next;
        }
    }

    private static boolean containsId(JSONArray habits, String id) {
        for (int i = 0; i < habits.length(); i++) {
            JSONObject habit = habits.optJSONObject(i);
            if (habit != null && id.equals(habit.optString("id"))) return true;
        }
        return false;
    }
}
