import Foundation

// The watch's strings live in the web app's translation files (apps/frontend/messages), bundled
// as-is. The names of genders, prompts and the rest come from the API in the watch's locale, so
// they stay current between App Store releases; both are translated in Weblate.
@MainActor
final class Translations {
    static let shared = Translations()

    private var language: String?
    private var locale = Translations.defaultLocale
    private var names: [String: [String: String]] = [:]
    private var namesLocale: String?
    private var messages: [String: Any] = [:]
    private lazy var defaultMessages = Self.file(Self.defaultLocale, in: "messages") as? [String: Any] ?? [:]

    private static let files = [
        "genders", "sexualities", "interests", "games", "platforms", "kinks", "prompts", "relationships",
        "languages", "report-reasons",
    ]

    func name(_ file: String, _ id: String) -> String? {
        load()
        return names[file]?[id]
    }

    func loadNames() async {
        load()
        guard namesLocale != locale, let api = Account.shared.api else { return }
        let locale = locale

        let loaded = await withTaskGroup(of: (String, [DataEntry])?.self) { group in
            for file in Self.files where names[file] == nil {
                group.addTask { (try? await api.entries(file, locale: locale)).map { (file, $0) } }
            }
            return await group.reduce(into: [String: [DataEntry]]()) { loaded, result in
                if case let (file, entries)? = result { loaded[file] = entries }
            }
        }

        guard locale == self.locale else { return }
        for (file, entries) in loaded {
            names[file] = Dictionary(entries.compactMap { entry in entry.name.map { (entry.id, $0) } }) { first, _ in first }
        }
        if Self.files.allSatisfy({ names[$0] != nil }) { namesLocale = locale }
    }

    // Dotted keys reach into nested objects, like "watch.sent".
    func message(_ key: String) -> String? {
        load()
        return Self.lookup(key, in: messages) ?? Self.lookup(key, in: defaultMessages)
    }

    // packages/data/content/locales.json, as on the web.
    private static let locales: [String: [String: Any]] = {
        guard let url = Bundle.main.url(forResource: "locales", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let locales = try? JSONSerialization.jsonObject(with: data) as? [String: [String: Any]]
        else { preconditionFailure("locales.json is missing from the watch bundle") }
        return locales
    }()

    // The enabled locales. Others ship in the bundle as unreviewed drafts, so anything else falls back
    // to the default locale rather than the device language.
    private static let enabledLocales = Set(locales.compactMap { code, locale in locale["enabled"] as? Bool == true ? code : nil })

    private static let defaultLocale: String = {
        guard let code = locales.first(where: { $0.value["default"] as? Bool == true })?.key
        else { preconditionFailure("locales.json marks no default locale") }
        return code
    }()

    private func load() {
        let preferred = Account.shared.user?.preferences?.language ?? Locale.preferredLanguages.first ?? Self.defaultLocale
        guard preferred != language else { return }
        language = preferred

        locale = [preferred, String(preferred.prefix(2))].first { Self.enabledLocales.contains($0) } ?? Self.defaultLocale
        names = [:]
        namesLocale = nil
        messages = Self.file(locale, in: "messages") as? [String: Any] ?? [:]
    }

    private static func lookup(_ key: String, in messages: [String: Any]) -> String? {
        var value: Any? = messages
        for part in key.split(separator: ".") {
            value = (value as? [String: Any])?[String(part)]
        }
        return value as? String
    }

    private static func file(_ name: String, in directory: String) -> Any? {
        guard let url = Bundle.main.url(forResource: name, withExtension: "json", subdirectory: directory),
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
