import UIKit
import UserNotifications

final class NotificationActions: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationActions()

    private static let category = "message"
    private static let reply = "reply"

    private var inner: UNUserNotificationCenterDelegate?
    private var early: [(UNNotificationResponse, () -> Void)] = []

    func register() {
        let reply = UNTextInputNotificationAction(
            identifier: Self.reply,
            title: NSLocalizedString("Reply", comment: ""),
            options: [],
            textInputButtonTitle: NSLocalizedString("Send", comment: ""),
            textInputPlaceholder: ""
        )

        UNUserNotificationCenter.current().setNotificationCategories([
            UNNotificationCategory(identifier: Self.category, actions: [reply], intentIdentifiers: [], options: [])
        ])
    }

    func install() {
        let center = UNUserNotificationCenter.current()
        guard center.delegate !== self else { return }

        inner = center.delegate
        center.delegate = self

        guard let inner else { return }
        for (response, completionHandler) in early {
            inner.userNotificationCenter?(center, didReceive: response, withCompletionHandler: completionHandler)
        }
        early = []
    }

    override func responds(to aSelector: Selector!) -> Bool {
        super.responds(to: aSelector) || inner?.responds(to: aSelector) == true
    }

    override func forwardingTarget(for aSelector: Selector!) -> Any? { inner }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let info = response.notification.request.content.userInfo

        guard response.actionIdentifier == Self.reply,
              let text = (response as? UNTextInputNotificationResponse)?.userText,
              let conversationId = info["conversation_id"] as? String
        else {
            if let inner, inner.responds(to: #selector(UNUserNotificationCenterDelegate.userNotificationCenter(_:didReceive:withCompletionHandler:))) {
                inner.userNotificationCenter?(center, didReceive: response, withCompletionHandler: completionHandler)
            } else if inner == nil {
                early.append((response, completionHandler))
            } else {
                completionHandler()
            }
            return
        }

        send(text, to: conversationId) { sent in
            if !sent { Self.reportFailure(threadIdentifier: conversationId, userInfo: info) }
            completionHandler()
        }
    }

    private func send(_ text: String, to conversationId: String, completion: @escaping (Bool) -> Void) {
        let text = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, let apiURL = WatchSession.apiURL, let cookies = SessionCookies.header() else {
            return completion(false)
        }

        var request = URLRequest(url: apiURL.appendingPathComponent("conversations/\(conversationId)/messages"))
        request.httpMethod = "POST"
        request.timeoutInterval = 20
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(UUID().uuidString, forHTTPHeaderField: "Idempotency-Key")
        request.setValue(cookies, forHTTPHeaderField: "Cookie")
        request.httpBody = try? JSONSerialization.data(withJSONObject: [
            "text": text,
            "client_id": UUID().uuidString.lowercased()
        ])

        URLSession.shared.dataTask(with: request) { _, response, _ in
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            completion((200..<300).contains(status))
        }.resume()
    }

    private static func reportFailure(threadIdentifier: String, userInfo: [AnyHashable: Any]) {
        let content = UNMutableNotificationContent()
        content.body = NSLocalizedString("Couldn't send your reply. Open the app to try again.", comment: "")
        content.threadIdentifier = threadIdentifier
        content.userInfo = userInfo.filter { key, _ in (key as? String) == "url" }

        UNUserNotificationCenter.current().add(UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: nil))
    }
}
