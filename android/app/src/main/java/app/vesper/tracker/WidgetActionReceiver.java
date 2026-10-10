package app.vesper.tracker;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class WidgetActionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        GlanceWidget.handleAction(context, intent);
    }
}
