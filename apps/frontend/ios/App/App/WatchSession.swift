import WatchConnectivity
import WebKit

// Shares the web view's API cookies with the watch app, which signs in with the same session.
final class WatchSession: NSObject, WCSessionDelegate, WKHTTPCookieStoreObserver {
    static let shared = WatchSession()

    private var cookieStore: WKHTTPCookieStore { WKWebsiteDataStore.default().httpCookieStore }
    private var pending: DispatchWorkItem?

    func activate() {
        guard WCSession.isSupported() else { return }

        WCSession.default.delegate = self
        WCSession.default.activate()

        DispatchQueue.main.async {
            self.cookieStore.add(self)
        }
    }

    static let apiURL: URL? = {
        guard let file = Bundle.main.url(forResource: "capacitor.config", withExtension: "json"),
              let data = try? Data(contentsOf: file),
              let config = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let plugins = config["plugins"] as? [String: Any],
              let flirtual = plugins["Flirtual"] as? [String: Any],
              let apiUrl = flirtual["apiUrl"] as? String else { return nil }
        return URL(string: apiUrl)
    }()

    static func cookies(for url: URL, in store: WKHTTPCookieStore, completion: @escaping ([HTTPCookie]) -> Void) {
        store.getAllCookies { cookies in
            completion(cookies.filter { $0.domainMatches(url) })
        }
    }

    func cookiesDidChange(in cookieStore: WKHTTPCookieStore) {
        scheduleUpdate()
    }

    private func scheduleUpdate() {
        pending?.cancel()
        let work = DispatchWorkItem { [weak self] in self?.sendContext() }
        pending = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 1, execute: work)
    }

    private func context(_ completion: @escaping ([String: Any]) -> Void) {
        guard let apiURL = Self.apiURL else { return }

        Self.cookies(for: apiURL, in: cookieStore) { cookies in
            completion([
                "apiUrl": apiURL.absoluteString,
                "cookies": cookies.compactMap(\.watchProperties)
            ])
        }
    }

    private func sendContext() {
        let session = WCSession.default
        guard session.activationState == .activated, session.isPaired, session.isWatchAppInstalled else { return }

        context { context in
            if NSDictionary(dictionary: context).isEqual(to: session.applicationContext) { return }
            try? session.updateApplicationContext(context)
        }
    }

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async { self.sendContext() }
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any], replyHandler: @escaping ([String: Any]) -> Void) {
        DispatchQueue.main.async {
            self.context(replyHandler)
        }
    }

    func sessionWatchStateDidChange(_ session: WCSession) {
        DispatchQueue.main.async { self.sendContext() }
    }

    func sessionDidBecomeInactive(_ session: WCSession) {}

    func sessionDidDeactivate(_ session: WCSession) {
        session.activate()
    }
}

private extension HTTPCookie {
    func domainMatches(_ url: URL) -> Bool {
        guard let host = url.host?.lowercased() else { return false }
        let domain = domain.lowercased().trimmingCharacters(in: CharacterSet(charactersIn: "."))
        return host == domain || host.hasSuffix("." + domain)
    }

    // Property-list-safe, so it survives WatchConnectivity.
    var watchProperties: [String: Any]? {
        var properties: [String: Any] = [
            "name": name,
            "value": value,
            "domain": domain,
            "path": path,
            "secure": isSecure
        ]
        if let expiresDate {
            properties["expires"] = expiresDate.timeIntervalSince1970
        }
        return properties
    }
}
