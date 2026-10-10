package zone.homie.flirtual.pwa;

import android.content.Context;
import android.view.ContextThemeWrapper;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.material.snackbar.Snackbar;

@CapacitorPlugin(name = "Snackbar")
public class SnackbarPlugin extends Plugin {

    // Covers whatever the page draws along its bottom, so the snackbar sits above it.
    private View anchor;

    @PluginMethod
    public void show(PluginCall call) {
        String text = call.getString("text");
        if (text == null) {
            call.reject("text is required");
            return;
        }
        int duration = call.getInt("duration", 2000);
        // CSS pixels, which are density-independent pixels.
        float bottom = call.getFloat("bottom", 0f);
        // The page's theme, when it has its own; otherwise the system's.
        Boolean dark = call.getBoolean("dark");

        getActivity().runOnUiThread(() -> {
            View webView = getBridge().getWebView();
            ViewGroup content = getActivity().findViewById(android.R.id.content);

            if (anchor == null) {
                anchor = new View(getContext());
                anchor.setClickable(false);
                anchor.setFocusable(false);
                anchor.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
                content.addView(anchor);
            }

            // The page can stop short of the content's bottom, above the system navigation.
            int[] webViewLocation = new int[2];
            int[] contentLocation = new int[2];
            webView.getLocationInWindow(webViewLocation);
            content.getLocationInWindow(contentLocation);
            int below = (contentLocation[1] + content.getHeight()) - (webViewLocation[1] + webView.getHeight());

            float density = getContext().getResources().getDisplayMetrics().density;
            anchor.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                Math.max(1, below + Math.round(bottom * density)),
                Gravity.BOTTOM
            ));

            Context context = dark == null
                ? getActivity()
                : new ContextThemeWrapper(getActivity(), dark ? R.style.AppTheme_Dark : R.style.AppTheme_Light);
            Snackbar snackbar = Snackbar.make(context, webView, text, duration);
            snackbar.setTextMaxLines(8);
            snackbar.setAnchorView(anchor);
            // Show once the anchor has its new height.
            anchor.post(snackbar::show);
            call.resolve();
        });
    }
}
