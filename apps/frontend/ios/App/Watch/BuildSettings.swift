import SwiftUI

// Mirrors the web app's src/brand.ts and src/features.ts. Values come from Watch/Info.plist, which
// ios.yaml fills in from the same VITE_* variables; empty ones fall back to brand.defaults.json.
private func setting(_ key: String) -> String? {
    let value = (Bundle.main.object(forInfoDictionaryKey: key) as? String)?
        .trimmingCharacters(in: .whitespaces)
    return value?.isEmpty == false ? value : nil
}

enum Brand {
    private static let defaults: [String: Any] = {
        guard
            let url = Bundle.main.url(forResource: "brand.defaults", withExtension: "json"),
            let data = try? Data(contentsOf: url),
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { preconditionFailure("brand.defaults.json is missing from the watch bundle") }
        return json
    }()

    static let dateColors = colorPair("BrandDateColors", default: "dateColors")
    static let homieColors = colorPair("BrandHomieColors", default: "homieColors")

    private static func colorPair(_ key: String, default name: String) -> [Color] {
        let override = setting(key)?.split(separator: ",").compactMap { color(String($0)) }
        if let override, override.count == 2 { return override }

        return (defaults[name] as? [String] ?? []).compactMap(color)
    }

    private static func color(_ hex: String) -> Color? {
        let digits = hex.trimmingCharacters(in: .whitespaces).trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        guard digits.count == 6, let value = UInt32(digits, radix: 16) else { return nil }
        return Color(hex: value)
    }
}

enum Features {
    static let homieMode = setting("FeatureHomieMode") != "0"
    static let personality = setting("FeaturePersonality") != "0"
    static let vrTags = setting("FeatureVRTags") != "0"
}
