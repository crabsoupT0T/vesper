package app.vesper.tracker;

import android.os.Bundle;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import java.lang.ref.WeakReference;

public class MainActivity extends BridgeActivity {
    private static WeakReference<MainActivity> current;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(VesperWidgetsPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();
        current = new WeakReference<>(this);
    }

    @Override
    public void onDestroy() {
        if (current != null && current.get() == this) current = null;
        super.onDestroy();
    }

    static void flushWidgets() {
        MainActivity activity = current == null ? null : current.get();
        if (activity == null) return;
        Bridge bridge = activity.getBridge();
        if (bridge == null) return;
        bridge.eval("window.__vesperFlush && window.__vesperFlush()", null);
    }
}
