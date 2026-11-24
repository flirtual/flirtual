package zone.homie.flirtual.pwa;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.regex.Pattern;
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
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.Person;
import androidx.core.app.RemoteInput;
import androidx.core.content.FileProvider;
import androidx.core.content.pm.ShortcutInfoCompat;
import androidx.core.content.pm.ShortcutManagerCompat;
import androidx.core.graphics.drawable.IconCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class NotificationService extends FirebaseMessagingService {
  private static final Pattern KLIPY_MEDIA = Pattern.compile("^https://static\\d*\\.klipy\\.com/\\S+$");
  private static final int MAX_MEDIA_BYTES = 8 * 1024 * 1024;
  private static final long MEDIA_LIFETIME = 24 * 60 * 60 * 1000;

  private static class Media {
    final Uri uri;
    final String type;

    Media(Uri uri, String type) {
      this.uri = uri;
      this.type = type;
    }
  }

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

      Media media = null;
      if (KLIPY_MEDIA.matcher(message.trim()).matches()) {
        media = downloadMedia(message.trim());
        message = "GIF";
      }

      Bitmap downloaded = downloadImage(photoUrl);
      Bitmap circularImage = getCircleBitmap(downloaded != null ? downloaded : getDefaultProfileBitmap());
      Person sender = new Person.Builder()
          .setName(name)
          .setIcon(IconCompat.createWithBitmap(circularImage))
          .build();
      sendNotification(name, message, media, sender, url, conversationId, circularImage);
    } catch (JSONException e) {
      e.printStackTrace();
    }
  }

  // onMessageReceived already runs off the main thread, and the service may be
  // stopped once it returns, so the download has to finish before then
  private Bitmap downloadImage(String photoUrl) {
    if (photoUrl == null || photoUrl.isEmpty()) return null;

    HttpURLConnection connection = null;
    try {
      connection = (HttpURLConnection) new URL(photoUrl).openConnection();
      connection.setConnectTimeout(5000);
      connection.setReadTimeout(5000);
      if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) return null;

      byte[] data;
      try (InputStream in = connection.getInputStream()) {
        data = readAll(in, Integer.MAX_VALUE);
      }
      if (data == null) return null;

      BitmapFactory.Options options = new BitmapFactory.Options();
      options.inJustDecodeBounds = true;
      BitmapFactory.decodeByteArray(data, 0, data.length, options);

      int target = getResources().getDimensionPixelSize(android.R.dimen.notification_large_icon_width);
      int sampleSize = 1;
      while (Math.min(options.outWidth, options.outHeight) / (sampleSize * 2) >= target) {
        sampleSize *= 2;
      }

      options.inJustDecodeBounds = false;
      options.inSampleSize = sampleSize;
      return BitmapFactory.decodeByteArray(data, 0, data.length, options);
    } catch (Exception e) {
      e.printStackTrace();
      return null;
    } finally {
      if (connection != null) connection.disconnect();
    }
  }

  private Media downloadMedia(String mediaUrl) {
    HttpURLConnection connection = null;
    try {
      connection = (HttpURLConnection) new URL(mediaUrl).openConnection();
      connection.setConnectTimeout(5000);
      connection.setReadTimeout(5000);
      if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) return null;

      String type = connection.getContentType();
      if (type == null || !type.startsWith("image/")) return null;
      type = type.split(";")[0].trim();

      byte[] data;
      try (InputStream in = connection.getInputStream()) {
        data = readAll(in, MAX_MEDIA_BYTES);
      }
      if (data == null) return null;

      File directory = new File(getCacheDir(), "notification-media");
      if (!directory.isDirectory() && !directory.mkdirs()) return null;
      pruneMedia(directory);

      File file = new File(directory, Integer.toHexString(mediaUrl.hashCode()));
      try (FileOutputStream out = new FileOutputStream(file)) {
        out.write(data);
      }

      Uri uri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", file);
      grantUriPermission("com.android.systemui", uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
      return new Media(uri, type);
    } catch (Exception e) {
      e.printStackTrace();
      return null;
    } finally {
      if (connection != null) connection.disconnect();
    }
  }

  private static void pruneMedia(File directory) {
    File[] files = directory.listFiles();
    if (files == null) return;

    long cutoff = System.currentTimeMillis() - MEDIA_LIFETIME;
    for (File file : files) {
      if (file.lastModified() < cutoff) file.delete();
    }
  }

  private static byte[] readAll(InputStream in, int limit) throws IOException {
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    byte[] buffer = new byte[8192];
    int read;
    while ((read = in.read(buffer)) != -1) {
      if (out.size() + read > limit) return null;
      out.write(buffer, 0, read);
    }
    return out.toByteArray();
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

  private Bitmap getDefaultProfileBitmap() {
    return BitmapFactory.decodeResource(getResources(), R.drawable.ic_stat_notification);
  }

  private void sendNotification(String title, String message, Media media, Person sender, String url, String conversationId, Bitmap profileImage) {
    int notificationId = conversationId != null ? conversationId.hashCode() : 0;

    if (conversationId != null && sender != null) {
      createDynamicShortcut(conversationId, title, sender, profileImage, url);
    }

    Notification previousNotification = getPreviousNotification(notificationId);

    NotificationCompat.MessagingStyle style;
    if (previousNotification != null && sender != null) {
      style = NotificationCompat.MessagingStyle.extractMessagingStyleFromNotification(previousNotification);
      if (style != null) {
        style.addMessage(createMessage(sender, message, media));
      } else {
        style = createMessagingStyle(sender, message, media);
      }
    } else if (sender != null) {
      style = createMessagingStyle(sender, message, media);
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
      Intent intent = new Intent(this, MainActivity.class);
      intent.setAction(Intent.ACTION_VIEW);
      intent.setData(Uri.parse(url));
      intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
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

  private NotificationCompat.MessagingStyle createMessagingStyle(Person sender, String message, Media media) {
    NotificationCompat.MessagingStyle style = new NotificationCompat.MessagingStyle(sender);
    style.addMessage(createMessage(sender, message, media));
    return style;
  }

  private NotificationCompat.MessagingStyle.Message createMessage(Person sender, String message, Media media) {
    NotificationCompat.MessagingStyle.Message notificationMessage =
        new NotificationCompat.MessagingStyle.Message(message, System.currentTimeMillis(), sender);
    if (media != null) notificationMessage.setData(media.type, media.uri);
    return notificationMessage;
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
    Intent intent = new Intent(this, MainActivity.class);
    intent.setAction(Intent.ACTION_VIEW);
    intent.setData(Uri.parse(url));
    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);

    ShortcutInfoCompat.Builder shortcutBuilder = new ShortcutInfoCompat.Builder(this, shortcutId)
        .setLongLived(true)
        .setIntent(intent)
        .setShortLabel(shortLabel)
        .setPerson(person);

    if (icon != null) {
      shortcutBuilder.setIcon(IconCompat.createWithBitmap(icon));
    }

    ShortcutInfoCompat shortcut = shortcutBuilder.build();
    ShortcutManagerCompat.pushDynamicShortcut(this, shortcut);
  }

  private void sendNotification(String title, String message, Person sender, String url) {
    sendNotification(title, message, null, sender, url, null, null);
  }
}
