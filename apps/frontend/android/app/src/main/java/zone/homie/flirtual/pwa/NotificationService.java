package zone.homie.flirtual.pwa;

import java.io.InputStream;
import org.json.JSONObject;
import org.json.JSONException;
import android.app.Notification;
import android.app.PendingIntent;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.graphics.RectF;
import android.net.Uri;
import android.os.AsyncTask;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.Person;
import androidx.core.app.RemoteInput;
import androidx.core.content.pm.ShortcutInfoCompat;
import androidx.core.content.pm.ShortcutManagerCompat;
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
      String conversationId = messageObject.getString("conversationId");
      String url = "flirtual://matches/" + conversationId;

      new DownloadImageTask().execute(name, message, photoUrl, url, conversationId);
    } catch (JSONException e) {
      e.printStackTrace();
    }
  }

  private Bitmap getCircleBitmap(Bitmap bitmap) {
    int width = bitmap.getWidth();
    int height = bitmap.getHeight();
    Bitmap output = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
    Canvas canvas = new Canvas(output);
    Paint paint = new Paint();
    Rect rect = new Rect(0, 0, width, height);
    RectF rectF = new RectF(rect);
    float radius = width / 2f;
    paint.setAntiAlias(true);
    canvas.drawARGB(0, 0, 0, 0);
    canvas.drawRoundRect(rectF, radius, radius, paint);
    paint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));
    canvas.drawBitmap(bitmap, rect, rect, paint);
    return output;
  }

  private class DownloadImageTask extends AsyncTask<String, Void, Bitmap> {
    String name, message, url, conversationId;

    protected Bitmap doInBackground(String... args) {
      name = args[0];
      message = args[1];
      String photoUrl = args[2];
      url = args[3];
      conversationId = args[4];
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
      Bitmap profileImage = result != null ? result : getDefaultProfileBitmap();
      Bitmap circularImage = getCircleBitmap(profileImage);
      Person sender = new Person.Builder()
          .setName(name)
          .setIcon(IconCompat.createWithBitmap(circularImage))
          .build();
      sendNotification(name, message, sender, url, conversationId, circularImage);
    }
  }

  private Bitmap getDefaultProfileBitmap() {
    return BitmapFactory.decodeResource(getResources(), R.drawable.ic_stat_notification);
  }

  private void sendNotification(String title, String message, Person sender, String url, String conversationId, Bitmap profileImage) {
    int notificationId = conversationId != null ? conversationId.hashCode() : 0;

    if (conversationId != null && sender != null) {
      createDynamicShortcut(conversationId, title, sender, profileImage, url);
    }

    Notification previousNotification = getPreviousNotification(notificationId);

    NotificationCompat.MessagingStyle style;
    if (previousNotification != null && sender != null) {
      style = NotificationCompat.MessagingStyle.extractMessagingStyleFromNotification(previousNotification);
      if (style != null) {
        NotificationCompat.MessagingStyle.Message notificationMessage =
            new NotificationCompat.MessagingStyle.Message(message, System.currentTimeMillis(), sender);
        style.addMessage(notificationMessage);
      } else {
        style = createMessagingStyle(sender, message);
      }
    } else if (sender != null) {
      style = createMessagingStyle(sender, message);
    } else {
      style = null;
    }

    NotificationCompat.Builder builder = new NotificationCompat.Builder(NotificationService.this, "flirtual")
        .setSmallIcon(R.drawable.ic_stat_notification)
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setAutoCancel(true)
        .setCategory(NotificationCompat.CATEGORY_MESSAGE);

    if (profileImage != null) {
      builder.setLargeIcon(profileImage);
    }

    if (url != null) {
      Intent intent = new Intent(Intent.ACTION_VIEW);
      intent.setData(Uri.parse(url));
      intent.setPackage(getPackageName());
      intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
      PendingIntent pendingIntent = PendingIntent.getActivity(this, notificationId, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
      builder.setContentIntent(pendingIntent);
    }

    if (style != null) {
      builder.setStyle(style);
      if (conversationId != null) {
        builder.setShortcutId(conversationId);
        builder.addAction(createReplyAction(notificationId, conversationId));
      }
    } else {
      builder.setContentTitle(title).setContentText(message);
    }

    NotificationManagerCompat manager = NotificationManagerCompat.from(NotificationService.this);
    if (manager.areNotificationsEnabled()) {
      manager.notify(notificationId, builder.build());
    }
  }

  private NotificationCompat.Action createReplyAction(int notificationId, String conversationId) {
    RemoteInput remoteInput = new RemoteInput.Builder(NotificationReplyReceiver.getReplyKey())
        .setLabel("Reply")
        .build();

    Intent replyIntent = new Intent(this, NotificationReplyReceiver.class);
    replyIntent.putExtra(NotificationReplyReceiver.KEY_NOTIFICATION_ID, notificationId);
    replyIntent.putExtra(NotificationReplyReceiver.KEY_CONVERSATION_ID, conversationId);

    PendingIntent replyPendingIntent = PendingIntent.getBroadcast(
        this,
        notificationId,
        replyIntent,
        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE
    );

    return new NotificationCompat.Action.Builder(
        R.drawable.ic_stat_notification,
        "Reply",
        replyPendingIntent)
        .addRemoteInput(remoteInput)
        .build();
  }

  private NotificationCompat.MessagingStyle createMessagingStyle(Person sender, String message) {
    NotificationCompat.MessagingStyle style = new NotificationCompat.MessagingStyle(sender);
    NotificationCompat.MessagingStyle.Message notificationMessage =
        new NotificationCompat.MessagingStyle.Message(message, System.currentTimeMillis(), sender);
    style.addMessage(notificationMessage);
    return style;
  }

  private Notification getPreviousNotification(int notificationId) {
    try {
      NotificationManagerCompat manager = NotificationManagerCompat.from(this);
      for (android.service.notification.StatusBarNotification statusBarNotification : manager.getActiveNotifications()) {
        if (statusBarNotification.getId() == notificationId) {
          return statusBarNotification.getNotification();
        }
      }
    } catch (Exception e) {
      e.printStackTrace();
    }
    return null;
  }

  private void createDynamicShortcut(String shortcutId, String shortLabel, Person person, Bitmap icon, String url) {
    Intent intent = new Intent(Intent.ACTION_VIEW);
    intent.setData(Uri.parse(url));
    intent.setPackage(getPackageName());
    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);

    ShortcutInfoCompat.Builder shortcutBuilder = new ShortcutInfoCompat.Builder(this, shortcutId)
        .setLongLived(true)
        .setIntent(intent)
        .setShortLabel(shortLabel.length() > 10 ? shortLabel.substring(0, 10) : shortLabel)
        .setPerson(person);

    if (icon != null) {
      shortcutBuilder.setIcon(IconCompat.createWithBitmap(icon));
    }

    ShortcutInfoCompat shortcut = shortcutBuilder.build();
    ShortcutManagerCompat.pushDynamicShortcut(this, shortcut);
  }

  private void sendNotification(String title, String message, Person sender, String url) {
    sendNotification(title, message, sender, url, null, null);
  }
}
