import Foundation
import Observation
import WatchConnectivity

// The watch signs in with the iPhone app's session: the phone sends its API cookies over
// WatchConnectivity whenever they change, and the watch keeps them in its own cookie storage.
@MainActor
@Observable
final class Account: NSObject {
    enum State {
        case loading
        case signedOut
        case unavailable
        case signedIn(User)
    }

    static let shared = Account()

    private(set) var state = State.loading
    private(set) var apiURL = UserDefaults.standard.string(forKey: "apiUrl").flatMap(URL.init(string:))

    var api: API? { apiURL.map(API.init) }

    var user: User? {
        if case let .signedIn(user) = state { return user }
        return nil
    }

    func activate() {
        guard WCSession.isSupported() else {
            Task { await refresh() }
            return
        }

        WCSession.default.delegate = self
        WCSession.default.activate()
    }

    func refresh() async {
        guard let api, hasCookies else {
            state = .signedOut
            return
        }

        do {
            state = .signedIn(try await api.session().user)
        } catch let issue as Issue where issue.status == 401 {
            state = .signedOut
        } catch {
            if case .signedIn = state { return }
            if API.isCancellation(error) { return }
            state = .unavailable
        }
    }

    func requestFromPhone() {
        let session = WCSession.default
        guard session.activationState == .activated, session.isReachable else {
            Task { await refresh() }
            return
        }

        session.sendMessage(["request": "session"]) { context in
            Task { @MainActor in self.apply(context) }
        } errorHandler: { _ in
            Task { @MainActor in await self.refresh() }
        }
    }

    private var hasCookies: Bool {
        guard let apiURL else { return false }
        return !(HTTPCookieStorage.shared.cookies(for: apiURL) ?? []).isEmpty
    }

    private func apply(_ context: [String: Any]) {
        guard let apiUrl = context["apiUrl"] as? String, let url = URL(string: apiUrl) else { return }

        let storage = HTTPCookieStorage.shared
        for cookie in storage.cookies ?? [] {
            storage.deleteCookie(cookie)
        }

        for properties in context["cookies"] as? [[String: Any]] ?? [] {
            guard let name = properties["name"] as? String,
                  let value = properties["value"] as? String,
                  let domain = properties["domain"] as? String else { continue }

            var cookie: [HTTPCookiePropertyKey: Any] = [
                .name: name,
                .value: value,
                .domain: domain,
                .path: properties["path"] as? String ?? "/"
            ]
            if properties["secure"] as? Bool == true {
                cookie[.secure] = "TRUE"
            }
            if let expires = properties["expires"] as? TimeInterval {
                cookie[.expires] = Date(timeIntervalSince1970: expires)
            }
            if let cookie = HTTPCookie(properties: cookie) {
                storage.setCookie(cookie)
            }
        }

        apiURL = url
        UserDefaults.standard.set(apiUrl, forKey: "apiUrl")
        Task { await refresh() }
    }
}

extension Account: WCSessionDelegate {
    nonisolated func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        let context = session.receivedApplicationContext
        Task { @MainActor in
            if context.isEmpty {
                self.requestFromPhone()
            } else {
                self.apply(context)
            }
        }
    }

    nonisolated func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        Task { @MainActor in self.apply(applicationContext) }
    }

    // The phone may have been out of reach when we asked at launch.
    nonisolated func sessionReachabilityDidChange(_ session: WCSession) {
        guard session.isReachable else { return }
        Task { @MainActor in
            if case .signedOut = self.state { self.requestFromPhone() }
        }
    }
}
