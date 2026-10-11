import Foundation

// The watch's strings, attribute names and prompt names all live in the web app's translation
// files (apps/frontend/messages), which are bundled as-is and translated in Weblate.
@MainActor
final class Translations {
    static let shared = Translations()

    private var language: String?
    private var attributes: [String: Any] = [:]
    private var messages: [String: Any] = [:]
    private lazy var english = Self.file("en") as? [String: Any] ?? [:]

    func attribute(_ type: String, _ id: String) -> String? {
        load()
        return ((attributes[type] as? [String: Any])?[id] as? [String: Any])?["name"] as? String
    }

    // Dotted keys reach into nested objects, like "watch.sent".
    func message(_ key: String) -> String? {
        load()
        return Self.lookup(key, in: messages) ?? Self.lookup(key, in: english)
    }

    private func load() {
        let preferred = Account.shared.user?.preferences?.language ?? Locale.preferredLanguages.first ?? "en"
        guard preferred != language else { return }
        language = preferred

        let locale = [preferred, String(preferred.prefix(2)), "en"].first { Self.file("attributes.\($0)") != nil } ?? "en"
        attributes = Self.file("attributes.\(locale)") as? [String: Any] ?? [:]
        messages = Self.file(locale) as? [String: Any] ?? [:]
    }

    private static func lookup(_ key: String, in messages: [String: Any]) -> String? {
        var value: Any? = messages
        for part in key.split(separator: ".") {
            value = (value as? [String: Any])?[String(part)]
        }
        return value as? String
    }

    private static func file(_ name: String) -> Any? {
        guard let url = Bundle.main.url(forResource: name, withExtension: "json", subdirectory: "messages"),
              let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONSerialization.jsonObject(with: data)
    }
}

// Like the web's t(), filling {placeholders} and empty <Trans> component tags with plain text.
@MainActor
func t(_ key: String, _ values: [String: String] = [:]) -> String {
    values.reduce(Translations.shared.message(key) ?? key) { text, value in
        ["{\(value.key)}", "<\(value.key)/>", "<\(value.key)></\(value.key)>"].reduce(text) {
            $0.replacingOccurrences(of: $1, with: value.value)
        }
    }
}
