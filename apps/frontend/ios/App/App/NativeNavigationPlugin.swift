import Capacitor

@objc(NativeNavigationPlugin)
final class NativeNavigationPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "NativeNavigationPlugin"
    let jsName = "NativeNavigation"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise)
    ]

    @objc func update(_ call: CAPPluginCall) {
        let visible = call.getBool("visible", false)
        let selected = call.getString("selected")
        let tint = call.getString("tint").flatMap(UIColor.init(hex:))

        let objects = call.getArray("tabs", JSObject.self)
        let tabs = objects?.compactMap { object -> NavigationTab? in
            guard let id = object["id"] as? String,
                  let title = object["title"] as? String,
                  let icon = object["icon"] as? String else { return nil }
            return NavigationTab(id: id, title: title, icon: icon)
        }
        let badges = (objects ?? []).reduce(into: [String: String]()) { badges, object in
            if let id = object["id"] as? String, let badge = object["badge"] as? String {
                badges[id] = badge
            }
        }

        DispatchQueue.main.async {
            guard #available(iOS 26, *),
                  let controller = self.bridge?.viewController?.tabBarController as? TabBarController else {
                call.unavailable()
                return
            }

            controller.update(visible: visible, tabs: tabs, badges: badges, selected: selected, tint: tint)
            call.resolve(["topCorners": controller.topCorners.mapValues { $0 as JSValue }])
        }
    }
}

private extension UIColor {
    convenience init?(hex: String) {
        let digits = hex.trimmingCharacters(in: .whitespaces).trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        guard digits.count == 6, let value = UInt32(digits, radix: 16) else { return nil }

        self.init(
            red: CGFloat((value >> 16) & 0xFF) / 255,
            green: CGFloat((value >> 8) & 0xFF) / 255,
            blue: CGFloat(value & 0xFF) / 255,
            alpha: 1
        )
    }
}
