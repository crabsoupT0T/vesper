package app.vesper.tracker;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.os.Build;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "VesperWidgets")
public class VesperWidgetsPlugin extends Plugin {
    @PluginMethod
    public void sync(PluginCall call) {
        String payload = call.getString("payload", "{}");
        getContext()
                .getSharedPreferences(GlanceWidget.PREFS, android.content.Context.MODE_PRIVATE)
                .edit()
                .putString(GlanceWidget.KEY, payload)
                .apply();
        GlanceWidget.refreshAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void pin(PluginCall call) {
        String kind = call.getString("kind", "today");
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
}
