import SwiftUI
import UserNotifications
import WatchKit

@main
struct FlirtualApp: App {
    @WKApplicationDelegateAdaptor private var delegate: AppDelegate

    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}

@MainActor
@Observable
final class Router {
    enum Tab {
        case browse
        case messages
    }

    static let shared = Router()

    var tab = Tab.browse
    var path: [ConversationRoute] = []

    func open(conversation id: String) {
        tab = .messages
        path = [ConversationRoute(id: id, userId: nil)]
    }
}

struct RootView: View {
    @Bindable private var router = Router.shared
    private let account = Account.shared

    var body: some View {
        switch account.state {
        case .loading:
            ProgressView()
        case .signedOut:
            StatusMessage(
                systemImage: "iphone",
                title: t("watch.sign_in_title"),
                detail: t("watch.sign_in_detail")
            ) {
                account.requestFromPhone()
            }
        case .unavailable:
            StatusMessage(
                systemImage: "wifi.exclamationmark",
                title: t("watch.unreachable_title"),
                detail: t("watch.unreachable_detail")
            ) {
                Task { await account.refresh() }
            }
        case .signedIn:
            NavigationStack(path: $router.path) {
                TabView(selection: $router.tab) {
                    BrowseView().tag(Router.Tab.browse)
                    MessagesView().tag(Router.Tab.messages)
                }
                .tabViewStyle(.page)
                .navigationDestination(for: ConversationRoute.self) { route in
                    ChatView(route: route)
                }
            }
        }
    }
}

final class AppDelegate: NSObject, WKApplicationDelegate, UNUserNotificationCenterDelegate {
    func applicationDidFinishLaunching() {
        UNUserNotificationCenter.current().delegate = self

        Task { @MainActor in Account.shared.activate() }
    }

    func applicationDidBecomeActive() {
        Task { @MainActor in
            if case .signedIn = Account.shared.state { return }
            Account.shared.requestFromPhone()
        }
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .list, .sound]
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse) async {
        guard response.actionIdentifier == UNNotificationDefaultActionIdentifier,
              let conversationId = Self.conversationId(response.notification.request.content.userInfo) else { return }
        await MainActor.run { Router.shared.open(conversation: conversationId) }
    }

    // TalkJS sends its payload as a JSON string or an object, depending on the channel.
    private static func conversationId(_ userInfo: [AnyHashable: Any]) -> String? {
        let talkjs: [String: Any]?
        switch userInfo["talkjs"] {
        case let object as [String: Any]:
            talkjs = object
        case let string as String:
            talkjs = string.data(using: .utf8).flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] }
        default:
            talkjs = nil
        }

        return (talkjs?["message"] as? [String: Any])?["conversationId"] as? String
            ?? (talkjs?["conversation"] as? [String: Any])?["id"] as? String
    }
}
