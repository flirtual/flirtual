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

    // The locales the web app has enabled (src/i18n/languages.ts). Others ship in the bundle as
    // unreviewed drafts, so anything else falls back to English rather than the device language.
    private static let enabledLocales: Set<String> = ["en"]

    private func load() {
        let preferred = Account.shared.user?.preferences?.language ?? Locale.preferredLanguages.first ?? "en"
        guard preferred != language else { return }
        language = preferred

        let locale = [preferred, String(preferred.prefix(2))].first { Self.enabledLocales.contains($0) } ?? "en"
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

// Like the web's t(), filling {placeholders}, ICU selects and empty <Trans> component tags with
// plain text, and {brand_name} everywhere, as src/i18n/index.tsx does. Other <Trans> tags are
// dropped, keeping what they wrap.
@MainActor
func t(_ key: String, _ values: [String: String] = [:]) -> String {
    let values = values.merging(["brand_name": Brand.name]) { value, _ in value }
    let text = values.reduce(resolveSelects(Translations.shared.message(key) ?? key, values)) { text, value in
        ["{\(value.key)}", "<\(value.key)/>", "<\(value.key)></\(value.key)>"].reduce(text) {
            $0.replacingOccurrences(of: $1, with: value.value)
        }
    }
    return text.replacingOccurrences(of: "</?[A-Za-z_][\\w-]*>", with: "", options: .regularExpression)
}

// "{status, select, liked {liked} other {homied}}" becomes the branch named by values["status"].
private func resolveSelects(_ text: String, _ values: [String: String]) -> String {
    var result = ""
    var index = text.startIndex

    while let open = text[index...].firstIndex(of: "{") {
        result += text[index..<open]
        guard let close = matchingBrace(in: text, from: open) else { break }

        let parts = text[text.index(after: open)..<close].split(separator: ",", maxSplits: 2)
        if parts.count == 3, parts[1].trimmingCharacters(in: .whitespaces) == "select" {
            let options = selectOptions(parts[2])
            let name = parts[0].trimmingCharacters(in: .whitespaces)
            result += resolveSelects(values[name].flatMap { options[$0] } ?? options["other"] ?? "", values)
        } else {
            result += text[open...close]
        }
        index = text.index(after: close)
    }

    return result + text[index...]
}

private func selectOptions(_ text: Substring) -> [String: String] {
    var options: [String: String] = [:]
    var index = text.startIndex

    while let open = text[index...].firstIndex(of: "{"), let close = matchingBrace(in: text, from: open) {
        let name = text[index..<open].trimmingCharacters(in: .whitespacesAndNewlines)
        options[name] = String(text[text.index(after: open)..<close])
        index = text.index(after: close)
    }

    return options
}

private func matchingBrace<S: StringProtocol>(in text: S, from open: S.Index) -> S.Index? {
    var depth = 0
    for index in text[open...].indices {
        switch text[index] {
        case "{": depth += 1
        case "}":
            depth -= 1
            if depth == 0 { return index }
        default: break
        }
    }
    return nil
}
