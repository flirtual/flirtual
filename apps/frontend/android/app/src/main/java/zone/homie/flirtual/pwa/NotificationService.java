package zone.homie.flirtual.pwa;

import java.io.InputStream;
import org.json.JSONObject;
import org.json.JSONException;
import android.app.PendingIntent;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.AsyncTask;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.Person;
import androidx.core.graphics.drawable.IconCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class NotificationService extends FirebaseMessagingService {
  @Override
  public void onMessageReceived(RemoteMessage remoteMessage) {
    super.onMessageReceived(remoteMessage);

    String jsonString = remoteMessage.getData().get("talkjs");
    if (jsonString != null) {
      handleTalkjsNotification(jsonString);
    } else {
      String title = remoteMessage.getNotification().getTitle();
      String body = remoteMessage.getNotification().getBody();
      String url = remoteMessage.getData().get("url");
      sendNotification(title, body, null, url);
    }
  }

  private void handleTalkjsNotification(String jsonString) {
    try {
      JSONObject talkjsObject = new JSONObject(jsonString);
      JSONObject senderObject = talkjsObject.getJSONObject("sender");
      JSONObject messageObject = talkjsObject.getJSONObject("message");
      String name = senderObject.getString("name");
      String photoUrl = senderObject.getString("photoUrl");
      String message = messageObject.getString("text");
      String url = "https://flirtu.al/matches/" + messageObject.getString("conversationId");

      new DownloadImageTask().execute(name, message, photoUrl, url);
    } catch (JSONException e) {
      e.printStackTrace();
    }
  }

  private class DownloadImageTask extends AsyncTask<String, Void, Bitmap> {
    String name, message, url;

    protected Bitmap doInBackground(String... args) {
      name = args[0];
      message = args[1];
      String photoUrl = args[2];
      url = args[3];
      Bitmap image = null;

      try {
        InputStream in = new java.net.URL(photoUrl).openStream();
        image = BitmapFactory.decodeStream(in);
      } catch (Exception e) {
        e.printStackTrace();
      }
      return image;
    }

    protected void onPostExecute(Bitmap result) {
      Person sender = new Person.Builder()
          .setName(name)
          .setIcon(IconCompat.createWithAdaptiveBitmap(result))
          .build();
      sendNotification(name, message, sender, url);
    }
  }

  private void sendNotification(String title, String message, Person sender, String url) {
    NotificationCompat.Builder builder = new NotificationCompat.Builder(NotificationService.this, "flirtual")
        .setSmallIcon(R.drawable.ic_stat_notification)
        .setContentTitle(title)
        .setContentText(message)
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setAutoCancel(true);

    if (url != null) {
      Intent intent = new Intent(Intent.ACTION_VIEW);
      intent.setData(Uri.parse(url));
      intent.setPackage(getPackageName());
      intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
      PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE);
      builder.setContentIntent(pendingIntent);
    }

    if (sender != null) {
      NotificationCompat.MessagingStyle style = new NotificationCompat.MessagingStyle(sender);
      NotificationCompat.MessagingStyle.Message notificationMessage = new NotificationCompat.MessagingStyle.Message(
          message, System.currentTimeMillis(), sender);
      style.addMessage(notificationMessage);
      builder.setStyle(style);
    }

    NotificationManagerCompat manager = NotificationManagerCompat.from(NotificationService.this);
    manager.notify(0, builder.build());
  }
}
