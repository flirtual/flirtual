package zone.homie.flirtual.pwa;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.AsyncTask;
import android.os.Bundle;
import android.webkit.CookieManager;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.RemoteInput;
import com.getcapacitor.CapConfig;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import org.json.JSONObject;

public class NotificationReplyReceiver extends BroadcastReceiver {
  private static final String KEY_TEXT_REPLY = "key_text_reply";
  public static final String KEY_NOTIFICATION_ID = "key_notification_id";
  public static final String KEY_CONVERSATION_ID = "key_conversation_id";

  @Override
  public void onReceive(Context context, Intent intent) {
    CharSequence replyText = getMessageText(intent);

    if (replyText != null) {
      int notificationId = intent.getIntExtra(KEY_NOTIFICATION_ID, 0);
      String conversationId = intent.getStringExtra(KEY_CONVERSATION_ID);

      String sessionCookie = getSessionCookie(context);

      if (sessionCookie != null) {
        new SendMessageTask(context, notificationId).execute(conversationId, replyText.toString(), sessionCookie);
      } else {
        showErrorNotification(context, notificationId);
      }
    }
  }

  private static class SendMessageTask extends AsyncTask<String, Void, Boolean> {
    private Context context;
    private int notificationId;

    SendMessageTask(Context context, int notificationId) {
      this.context = context;
      this.notificationId = notificationId;
    }

    @Override
    protected Boolean doInBackground(String... params) {
      String conversationId = params[0];
      String text = params[1];
      String sessionCookie = params[2];

      try {
        CapConfig config = CapConfig.loadDefault(context);
        String apiUrl = config.getString("plugins.Flirtual.apiUrl");

        URL url = new URL(apiUrl + "conversations/" + conversationId + "/messages");
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod("POST");
        connection.setRequestProperty("Content-Type", "application/json");
        connection.setRequestProperty("Cookie", "session=" + sessionCookie);
        connection.setDoOutput(true);

        JSONObject jsonBody = new JSONObject();
        jsonBody.put("text", text);

        OutputStream os = connection.getOutputStream();
        os.write(jsonBody.toString().getBytes("UTF-8"));
        os.close();

        int responseCode = connection.getResponseCode();
        return responseCode >= 200 && responseCode < 300;
      } catch (Exception e) {
        return false;
      }
    }

    @Override
    protected void onPostExecute(Boolean success) {
      if (success) {
        NotificationManagerCompat.from(context).cancel(notificationId);
      } else {
        showErrorNotification(context, notificationId);
      }
    }
  }

  private static void showErrorNotification(Context context, int notificationId) {
    NotificationCompat.Builder builder = new NotificationCompat.Builder(context, "flirtual")
        .setSmallIcon(R.drawable.ic_stat_notification)
        .setContentText("Couldn't send reply, please try again in-app.");

    NotificationManagerCompat notificationManager = NotificationManagerCompat.from(context);
    if (notificationManager.areNotificationsEnabled()) {
      notificationManager.notify(notificationId, builder.build());
    }
  }

  private CharSequence getMessageText(Intent intent) {
    Bundle remoteInput = RemoteInput.getResultsFromIntent(intent);
    if (remoteInput != null) {
      return remoteInput.getCharSequence(KEY_TEXT_REPLY);
    }
    return null;
  }

  private String getSessionCookie(Context context) {
    CapConfig config = CapConfig.loadDefault(context);
    String serverUrl = config.getServerUrl();

    CookieManager cookieManager = CookieManager.getInstance();
    String cookies = cookieManager.getCookie(serverUrl);

    if (cookies != null) {
      String[] cookieArray = cookies.split(";");
      for (String cookie : cookieArray) {
        String trimmedCookie = cookie.trim();
        if (trimmedCookie.startsWith("session=")) {
          return trimmedCookie.substring("session=".length());
        }
      }
    }

    return null;
  }

  public static String getReplyKey() {
    return KEY_TEXT_REPLY;
  }
}
