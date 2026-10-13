import Capacitor
import WebKit

@objc(NativeNavigationPlugin)
final class NativeNavigationPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "NativeNavigationPlugin"
    let jsName = "NativeNavigation"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "actions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "toast", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "tabFrames", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "swipe", returnType: CAPPluginReturnPromise)
    ]

    private lazy var upSwipe = UpSwipe(
        onStart: { [weak self] target in self?.notifyListeners("upStart", data: ["to": target]) },
        onCancel: { [weak self] in self?.notifyListeners("upCancel", data: [:]) }
    )

    // WebKit only records swipe snapshots while the gestures are allowed, so they stay allowed and
    // setSwipes enables each edge instead.
    override func load() {
        DispatchQueue.main.async {
            self.bridge?.webView?.allowsBackForwardNavigationGestures = true
            self.setSwipes(back: false, forward: false)
        }
    }

    @objc func update(_ call: CAPPluginCall) {
        let visible = call.getBool("visible", false)
        let selected = call.getString("selected")
        let tint = call.getString("tint").flatMap(UIColor.init(hex:))
        let edgeToEdge = call.getBool("edgeToEdge", false)

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

            controller.update(visible: visible, tabs: tabs, badges: badges, selected: selected, tint: tint, edgeToEdge: edgeToEdge)
            call.resolve(controller.layout)
        }
    }

    // Buttons floating over the page, where it laid out its own. An empty list removes them.
    @objc func actions(_ call: CAPPluginCall) {
        let actions = (call.getArray("actions", JSObject.self) ?? []).compactMap { object -> NavigationAction? in
            guard let id = object["id"] as? String, let icon = object["icon"] as? String else { return nil }
            return NavigationAction(
                id: id,
                icon: icon,
                tint: (object["tint"] as? String).flatMap(UIColor.init(hex:)),
                prominent: object["prominent"] as? Bool ?? false,
                enabled: object["enabled"] as? Bool ?? true
            )
        }
        let frame = call.getObject("frame").flatMap { frame -> CGRect? in
            guard let x = frame["x"] as? Double, let y = frame["y"] as? Double,
                  let width = frame["width"] as? Double, let height = frame["height"] as? Double else { return nil }
            return CGRect(x: x, y: y, width: width, height: height)
        }
        let interactive = call.getBool("interactive", true)

        DispatchQueue.main.async {
            guard #available(iOS 26, *),
                  let controller = self.bridge?.viewController?.tabBarController as? TabBarController else {
                call.unavailable()
                return
            }

            controller.setActions(actions, frame: frame, interactive: interactive)
            call.resolve()
        }
    }

    @objc func toast(_ call: CAPPluginCall) {
        guard let text = call.getString("text") else {
            call.reject("text is required")
            return
        }
        let icon = call.getString("icon")
        let tint = call.getString("tint").flatMap(UIColor.init(hex:))
        let duration = call.getDouble("duration", 2000) / 1000

        DispatchQueue.main.async {
            guard #available(iOS 26, *),
                  let controller = self.bridge?.viewController?.tabBarController as? TabBarController else {
                call.unavailable()
                return
            }

            controller.showToast(text, icon: icon, tint: tint, duration: duration)
            call.resolve()
        }
    }

    @objc func swipe(_ call: CAPPluginCall) {
        let back = call.getBool("back", false)
        let forward = call.getBool("forward", false)
        let up = call.getString("up")

        DispatchQueue.main.async {
            self.setSwipes(back: back, forward: forward)
            if let webView = self.bridge?.webView {
                self.upSwipe.attach(to: webView)
                self.upSwipe.set(target: up)
            }
            call.resolve()
        }
    }

    private func setSwipes(back: Bool, forward: Bool) {
        guard let webView = bridge?.webView else { return }

        let backEdge: UIRectEdge = webView.effectiveUserInterfaceLayoutDirection == .rightToLeft ? .right : .left
        let recognizers = (webView.gestureRecognizers ?? [])
            .compactMap { $0 as? UIScreenEdgePanGestureRecognizer }
        for recognizer in recognizers {
            recognizer.isEnabled = recognizer.edges.contains(backEdge) ? back : forward
        }
    }

    @objc func tabFrames(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard #available(iOS 26, *),
                  let controller = self.bridge?.viewController?.tabBarController as? TabBarController else {
                call.unavailable()
                return
            }

            func object(_ frame: CGRect) -> JSObject {
                ["x": Double(frame.minX), "y": Double(frame.minY), "width": Double(frame.width), "height": Double(frame.height)]
            }

            let (tabs, bar) = controller.tabFrames()
            var result: JSObject = ["frames": tabs.mapValues { object($0) as JSValue } as JSObject]
            if let bar {
                result["bar"] = object(bar)
            }
            call.resolve(result)
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

private final class UpSwipeRecognizer: UIPanGestureRecognizer {}

// Swipes to a page's parent when it isn't in history. A snapshot of the page slides away while the
// web view navigates to the parent underneath.
private final class UpSwipe: NSObject, UIGestureRecognizerDelegate {
    private weak var webView: WKWebView?
    private let recognizer = UpSwipeRecognizer()
    private let onStart: (String) -> Void
    private let onCancel: () -> Void
    private var target: String?

    private var page: UIView?
    private var dimming: UIView?
    // Hides the web view until the parent renders. Not a subview, so WebKit's snapshots leave it out.
    private var blank: UIView?
    // Set after a cancel; the snapshot is removed once the page reports this target again.
    private var returning: String?

    init(onStart: @escaping (String) -> Void, onCancel: @escaping () -> Void) {
        self.onStart = onStart
        self.onCancel = onCancel
        super.init()
        recognizer.delegate = self
        recognizer.addTarget(self, action: #selector(pan(_:)))
    }

    private var direction: CGFloat {
        webView?.effectiveUserInterfaceLayoutDirection == .rightToLeft ? -1 : 1
    }

    func attach(to webView: WKWebView) {
        guard self.webView !== webView else { return }
        self.webView = webView
        webView.addGestureRecognizer(recognizer)
    }

    func set(target: String?) {
        self.target = target
        removeBlank()
        if let returning, returning == target { removeCover() }
    }

    // Starts anywhere, like WebKit's swipe, unless a scroll view under the finger can scroll that way.
    func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
        guard target != nil, page == nil, let webView else { return false }

        let velocity = recognizer.velocity(in: webView)
        guard direction * velocity.x > abs(velocity.y) else { return false }

        var view = webView.hitTest(recognizer.location(in: webView), with: nil)
        while let current = view, current !== webView {
            if let scrollView = current as? UIScrollView {
                let start = -scrollView.adjustedContentInset.left
                let end = scrollView.contentSize.width + scrollView.adjustedContentInset.right - scrollView.bounds.width
                if direction > 0 ? scrollView.contentOffset.x > start + 1 : scrollView.contentOffset.x < end - 1 { return false }
            }
            view = current.superview
        }
        return true
    }

    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldBeRequiredToFailBy other: UIGestureRecognizer) -> Bool {
        guard target != nil, let webView, let view = other.view as? UIScrollView else { return false }
        return other is UIPanGestureRecognizer && view.isDescendant(of: webView)
    }

    @objc private func pan(_ recognizer: UIPanGestureRecognizer) {
        guard let webView, let container = webView.superview else { return }

        let direction = direction
        let width = webView.bounds.width
        let progress = min(1, max(0, direction * recognizer.translation(in: container).x / width))

        switch recognizer.state {
        case .began:
            guard let target, let page = webView.snapshotView(afterScreenUpdates: false) else {
                recognizer.isEnabled = false
                recognizer.isEnabled = true
                return
            }
            removeCover()

            let dimming = UIView(frame: webView.frame)
            dimming.backgroundColor = .black
            dimming.isUserInteractionEnabled = false
            container.insertSubview(dimming, aboveSubview: webView)

            page.frame = webView.frame
            page.layer.shadowColor = UIColor.black.cgColor
            page.layer.shadowRadius = 12
            page.layer.shadowOffset = .zero
            page.layer.shadowOpacity = 0.2
            container.insertSubview(page, aboveSubview: dimming)

            let blank = UIView(frame: webView.frame)
            blank.backgroundColor = webView.underPageBackgroundColor ?? .systemBackground
            blank.isUserInteractionEnabled = false
            container.insertSubview(blank, aboveSubview: webView)

            self.page = page
            self.dimming = dimming
            self.blank = blank
            update(progress, width: width, direction: direction)
            onStart(target)
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in self?.removeBlank() }

        case .changed:
            update(progress, width: width, direction: direction)

        case .ended, .cancelled, .failed:
            let velocity = direction * recognizer.velocity(in: container).x
            let complete = recognizer.state == .ended && (progress > 0.5 || velocity > 500)
            let target = target

            UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseOut) {
                self.update(complete ? 1 : 0, width: width, direction: direction)
            } completion: { [weak self] _ in
                guard let self else { return }
                webView.transform = .identity
                self.dimming?.removeFromSuperview()
                self.dimming = nil

                if complete {
                    self.page?.removeFromSuperview()
                    self.page = nil
                    return
                }

                self.blank?.removeFromSuperview()
                self.blank = nil
                self.page?.layer.shadowOpacity = 0
                self.returning = target
                self.onCancel()
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) { [weak self] in self?.removeCover() }
            }

        default:
            break
        }
    }

    // Parallax and dimming like the system's back swipe.
    private func update(_ progress: CGFloat, width: CGFloat, direction: CGFloat) {
        page?.transform = CGAffineTransform(translationX: direction * width * progress, y: 0)
        webView?.transform = CGAffineTransform(translationX: -direction * width * 0.3 * (1 - progress), y: 0)
        blank?.transform = webView?.transform ?? .identity
        dimming?.alpha = 0.1 * (1 - progress)
    }

    private func removeBlank() {
        guard let blank else { return }
        self.blank = nil

        UIView.animate(withDuration: 0.1, delay: 0.05) {
            blank.alpha = 0
        } completion: { _ in
            blank.removeFromSuperview()
        }
    }

    private func removeCover() {
        guard dimming == nil, let page else { return }
        self.page = nil
        returning = nil

        UIView.animate(withDuration: 0.15, delay: 0.15) {
            page.alpha = 0
        } completion: { _ in
            page.removeFromSuperview()
        }
    }
}
