import Foundation
import Security

enum SessionCookies {
    private static let query: [CFString: Any] = [
        kSecClass: kSecClassGenericPassword,
        kSecAttrService: (Bundle.main.bundleIdentifier ?? "flirtual") + ".api-cookies"
    ]

    static func store(_ cookies: [[String: Any]]) {
        SecItemDelete(query as CFDictionary)
        guard !cookies.isEmpty, let data = try? JSONSerialization.data(withJSONObject: cookies) else { return }

        var item = query
        item[kSecValueData] = data
        item[kSecAttrAccessible] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        SecItemAdd(item as CFDictionary, nil)
    }

    static func header() -> String? {
        var item = query
        item[kSecReturnData] = true

        var result: CFTypeRef?
        guard SecItemCopyMatching(item as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data,
              let cookies = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]]
        else { return nil }

        let now = Date().timeIntervalSince1970
        let pairs = cookies.compactMap { cookie -> String? in
            if let expires = cookie["expires"] as? Double, expires < now { return nil }
            guard let name = cookie["name"] as? String, let value = cookie["value"] as? String else { return nil }
            return "\(name)=\(value)"
        }

        return pairs.isEmpty ? nil : pairs.joined(separator: "; ")
    }
}
