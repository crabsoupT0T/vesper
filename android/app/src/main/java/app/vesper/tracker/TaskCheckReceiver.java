package app.vesper.tracker;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class TaskCheckReceiver extends BroadcastReceiver {
    static final String ACTION = "app.vesper.tracker.TASK_CHECK";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !ACTION.equals(intent.getAction())) return;
        String id = intent.getStringExtra("id");
        if (id == null || id.isEmpty()) return;
        LockWatchService.checkTask(context, id);
    }
}
