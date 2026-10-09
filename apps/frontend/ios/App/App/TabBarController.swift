import Capacitor
import UIKit
import WebKit

struct NavigationTab: Equatable {
    let id: String
    let title: String
    let icon: String
}

struct NavigationAction: Equatable {
    let id: String
    let icon: String
    let tint: UIColor?
    let prominent: Bool
    let enabled: Bool
}

// Hosts the one Capacitor bridge under a native tab bar. Each tab gets an empty container, and the
// bridge moves into whichever container is selected, so switching tabs never reloads the page. The
// web app owns the tabs and the selection; this only mirrors what it sends and reports taps back.
@available(iOS 26, *)
final class TabBarController: UITabBarController, UITabBarControllerDelegate {
    private let bridgeViewController: BridgeViewController
    private var items: [NavigationTab] = []
    private var containers: [String: TabContentViewController] = [:]
    // Whether the page asked for the tab bar. isTabBarHidden can't say, since the bar is briefly
    // hidden and shown again to refresh it after new tabs.
    fileprivate private(set) var showsTabBar = false
    private var topCorners: [String: Double] = [:]
    private var fold: [String: Double] = [:]
    private var sideBar: [String: Double] = [:]
    private var bottomBar: [String: Double] = [:]
    private var corners: [String: Double] = [:]
    private var refreshedTabBarSize: CGSize?
    private var settled: DispatchWorkItem?
    private lazy var actionBar = ActionBar { [weak self] id in
        self?.plugin?.notifyListeners("action", data: ["id": id])
    }

    var layout: JSObject {
        [
            "topCorners": topCorners.mapValues { $0 as JSValue },
            "fold": fold.mapValues { $0 as JSValue },
            "sideBar": sideBar.mapValues { $0 as JSValue },
            "bottomBar": bottomBar.mapValues { $0 as JSValue },
            "corners": corners.mapValues { $0 as JSValue }
        ]
    }

    private let placeholderId = ""

    init(bridgeViewController: BridgeViewController) {
        self.bridgeViewController = bridgeViewController
        super.init(nibName: nil, bundle: nil)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        delegate = self
        mode = .tabBar
        isTabBarHidden = true

        host(in: container(for: placeholderId))
        tabs = [UITab(title: "", image: nil, identifier: placeholderId) { [unowned self] tab in
            self.container(for: tab.identifier)
        }]
    }

    func update(visible: Bool, tabs newItems: [NavigationTab]?, badges: [String: String], selected: String?, tint: UIColor?) {
        if let tint {
            view.tintColor = tint
        }

        if let newItems, !newItems.isEmpty, newItems != items {
            let current = selectedTab?.identifier
            let target = [selected, current].compactMap { $0 }.first { id in newItems.contains { $0.id == id } }
                ?? newItems[0].id

            // A view controller belongs to one tab, so the new tabs get new containers.
            containers = [:]
            host(in: container(for: target))
            setTabs(newItems.map(makeTab), animated: false)
            selectedTab = tab(forIdentifier: target)

            items = newItems

            // The new tabs' view controllers don't get the tab bar's safe area until it's laid out again.
            if !isTabBarHidden {
                setTabBarHidden(true, animated: false)
                setTabBarHidden(false, animated: false)
            }
        }

        for tab in tabs {
            tab.badgeValue = badges[tab.identifier]
        }

        if let selected, selected != selectedTab?.identifier, let tab = tab(forIdentifier: selected) {
            host(in: container(for: selected))
            selectedTab = tab
        }

        setVisible(visible && !items.isEmpty)
    }

    private func setVisible(_ visible: Bool) {
        showsTabBar = visible
        guard visible == isTabBarHidden else { return }

        setTabBarHidden(!visible, animated: true)
        selectedViewController?.view.setNeedsLayout()
    }

    private func makeTab(_ item: NavigationTab) -> UITab {
        let image = UIImage(named: item.icon) ?? UIImage(systemName: item.icon)

        return UITab(title: item.title, image: image, identifier: item.id) { [unowned self] tab in
            self.container(for: tab.identifier)
        }
    }

    private func container(for id: String) -> TabContentViewController {
        if let container = containers[id] { return container }

        let container = TabContentViewController()
        containers[id] = container
        return container
    }

    private func host(in container: TabContentViewController) {
        guard bridgeViewController.parent !== container else { return }

        let previous = bridgeViewController.parent as? TabContentViewController
        // Switching tabs can bring back the stale tab bar height, so it may need laying out again.
        refreshedTabBarSize = nil

        bridgeViewController.willMove(toParent: nil)
        previous?.content = nil
        bridgeViewController.removeFromParent()

        container.addChild(bridgeViewController)
        bridgeViewController.loadViewIfNeeded()
        container.content = bridgeViewController.webView
        bridgeViewController.didMove(toParent: container)

        if let scrollView = bridgeViewController.webView?.scrollView {
            container.setContentScrollView(scrollView)
            scrollView.topEdgeEffect.isHidden = true
        }
    }

    // The page lays out its own actions, hidden, and sends where they are, so these sit in their place.
    func setActions(_ actions: [NavigationAction], frame: CGRect?) {
        guard !actions.isEmpty, let frame, !frame.isEmpty, let webView = bridgeViewController.webView else {
            actionBar.removeFromSuperview()
            return
        }

        if actionBar.superview !== view {
            view.insertSubview(actionBar, belowSubview: tabBar)
        }
        actionBar.set(actions)
        actionBar.frame = view.convert(frame, from: webView)
    }

    private var plugin: NativeNavigationPlugin? {
        bridgeViewController.bridge?.plugin(withName: "NativeNavigation") as? NativeNavigationPlugin
    }

    fileprivate func contentDidLayout(_ webView: WKWebView) {
        report(webView)

        // The tab bar settles after the page lays out, sometimes at the end of an animation, without
        // laying the page out again.
        settled?.cancel()
        let settled = DispatchWorkItem { [weak self, weak webView] in
            guard let self, let webView, webView.window != nil else { return }
            self.report(webView)
        }
        self.settled = settled
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5, execute: settled)
    }

    private func report(_ webView: WKWebView) {
        let corners = Self.topCornerClearance(of: webView)
        let fold = Self.fold(in: webView)
        let sideBar = sideBar(in: webView)
        let bottomBar = bottomBar(in: webView)
        let screenCorners = Self.cornerInsets(of: webView)
        guard corners != topCorners || fold != self.fold || sideBar != self.sideBar || bottomBar != self.bottomBar
            || screenCorners != self.corners else { return }

        topCorners = corners
        self.fold = fold
        self.sideBar = sideBar
        self.bottomBar = bottomBar
        self.corners = screenCorners
        plugin?.notifyListeners("layout", data: layout)
    }

    override func viewWillTransition(to size: CGSize, with coordinator: any UIViewControllerTransitionCoordinator) {
        super.viewWillTransition(to: size, with: coordinator)
        // Turning back to a size already seen can bring the stale height back too.
        refreshedTabBarSize = nil
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()

        // UIKit sometimes keeps the portrait tab bar's height in landscape, leaving the bar floating
        // above the bottom edge. Showing it again lays it out afresh, once for each rotation and tab.
        let bar = tabBar.frame
        if showsTabBar, !isTabBarHidden, bar.width > bar.height, bar.midY > view.bounds.midY,
           bar.maxY < view.bounds.maxY - 1, refreshedTabBarSize != view.bounds.size {
            refreshedTabBarSize = view.bounds.size
            setTabBarHidden(true, animated: false)
            setTabBarHidden(false, animated: false)
        }

        if let webView = bridgeViewController.webView, webView.window != nil {
            contentDidLayout(webView)
        }
    }

    // Where the tab bar starts when it runs along the bottom, as on iPhone. It sits in the bottom
    // safe area, so content that pads itself into that area needs to keep clear of it. Not on iPad,
    // where it's at the top, or when it runs down a side.
    private func bottomBar(in webView: WKWebView) -> [String: Double] {
        guard showsTabBar, !tabBar.isHidden, tabBar.window != nil else { return [:] }

        let frame = webView.convert(tabBar.bounds, from: tabBar)
        guard frame.width > frame.height, frame.maxY >= webView.bounds.maxY - 1 else { return [:] }
        return ["top": frame.minY]
    }

    // Where the tab bar starts when it runs down a side, as on iPhone Duo in landscape. Its buttons
    // are anchored to the bottom, leaving the rest of the column free. There's no API for where
    // they are, so this finds the controls in the side's safe area.
    private func sideBar(in webView: WKWebView) -> [String: Double] {
        guard showsTabBar, let window = view.window else { return [:] }

        let bounds = webView.bounds
        let insets = webView.safeAreaInsets
        var frame = CGRect.null

        func visit(_ view: UIView) {
            guard !view.isHidden, view.alpha > 0, !(view is WKWebView) else { return }
            if view is UIControl {
                let control = webView.convert(view.bounds, from: view)
                if control.maxX <= insets.left || control.minX >= bounds.maxX - insets.right {
                    frame = frame.union(control)
                }
            }
            view.subviews.forEach(visit)
        }
        visit(window)

        guard !frame.isNull, frame.height > frame.width else { return [:] }
        return ["top": frame.minY, "x": frame.midX]
    }

    // How much further than the safe area content must keep from each side to clear the screen's
    // rounded corners, for the top of a side where nothing else is reserved.
    private static func cornerInsets(of view: UIView) -> [String: Double] {
        let adapted = view.edgeInsets(for: .safeArea(cornerAdaptation: .horizontal))
        let safe = view.safeAreaInsets
        return ["left": max(0, adapted.left - safe.left), "right": max(0, adapted.right - safe.right)]
    }

    // A fold splitting the page side by side, as when iPhone Duo is partially open in landscape.
    private static func fold(in view: UIView) -> [String: Double] {
        #if compiler(>=6.4)
        guard #available(iOS 27.1, *),
              let frame = view.reservedRegions(kind: .division)
                .first(where: { $0.isActive && $0.frame.height >= view.bounds.height })?.frame else { return [:] }

        return ["x": frame.minX, "width": frame.width]
        #else
        return [:]
        #endif
    }

    // What the system reserves in the top corners, like iPhone Duo's status bar, so content along
    // the top can sit beside it, down to its bottom. The height is only there when it fits in the
    // top safe area, as in inner portrait, leaving the rest of the top edge free. Anything else
    // along the top edge, like a Dynamic Island, means none of it is.
    private static func topCornerClearance(of view: UIView) -> [String: Double] {
        #if compiler(>=6.4)
        guard #available(iOS 27.1, *) else { return [:] }

        var left = 0.0, right = 0.0, height = 0.0
        for region in view.reservedRegions(kind: .occlusion) where region.isActive && region.frame.minY <= 0 {
            if region.frame.maxX >= view.bounds.maxX {
                right = max(right, view.bounds.maxX - region.frame.minX)
            } else if region.frame.minX <= 0 {
                left = max(left, region.frame.maxX)
            } else {
                return [:]
            }
            height = max(height, region.frame.maxY)
        }

        guard left > 0 || right > 0 else { return [:] }

        var corners = ["left": left, "right": right, "bottom": height]
        if height <= view.safeAreaInsets.top {
            corners["height"] = height
        }
        return corners
        #else
        return [:]
        #endif
    }

    // Only called for user interaction, including a tap on the tab that's already selected, which
    // the web app uses to return to that tab's root.
    func tabBarController(_ tabBarController: UITabBarController, shouldSelectTab tab: UITab) -> Bool {
        host(in: container(for: tab.identifier))
        plugin?.notifyListeners("select", data: ["id": tab.identifier])

        return true
    }
}

@available(iOS 26, *)
private final class TabContentViewController: UIViewController {
    // The web app's loading screen.
    private static var pageBackground = UIColor { $0.userInterfaceStyle == .dark
        ? UIColor(red: 0x1E / 255, green: 0x1E / 255, blue: 0x1E / 255, alpha: 1)
        : UIColor(red: 0xF5 / 255, green: 0xF5 / 255, blue: 0xF5 / 255, alpha: 1) }

    private var backgroundObservation: NSKeyValueObservation?
    private var leading: NSLayoutConstraint?
    private var trailing: NSLayoutConstraint?

    var content: WKWebView? {
        didSet {
            oldValue?.removeFromSuperview()
            backgroundObservation = nil

            guard let content else { return }
            view.addSubview(content)

            // The page ends at the keyboard, as Capacitor's own keyboard resizing would leave it.
            content.translatesAutoresizingMaskIntoConstraints = false
            let leading = content.leadingAnchor.constraint(equalTo: view.leadingAnchor)
            let trailing = view.trailingAnchor.constraint(equalTo: content.trailingAnchor)
            NSLayoutConstraint.activate([
                leading,
                trailing,
                content.topAnchor.constraint(equalTo: view.topAnchor),
                content.bottomAnchor.constraint(equalTo: view.keyboardLayoutGuide.topAnchor)
            ])
            self.leading = leading
            self.trailing = trailing
            view.setNeedsLayout()

            // Until the page paints a background, WebKit reports plain white, so the page's colour
            // only replaces the loading screen's once it changes.
            view.backgroundColor = Self.pageBackground
            backgroundObservation = content.observe(\.underPageBackgroundColor, options: [.new]) { [weak self] webView, _ in
                Self.pageBackground = webView.underPageBackgroundColor
                self?.view.backgroundColor = webView.underPageBackgroundColor
            }
        }
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        // Without a keyboard, the page still reaches the bottom edge and pads for it itself.
        view.keyboardLayoutGuide.usesBottomSafeArea = false
    }

    // While the tab bar shows, the page spans the full width and keeps its own content clear of
    // whatever sits on the sides (iPhone Duo's vertical bars), so headers and images can run
    // beneath them. Pages without it aren't built for that, so they're kept clear here, with the
    // page's own background beneath. The top always stays edge to edge.
    override func viewWillLayoutSubviews() {
        super.viewWillLayoutSubviews()

        let insets = (tabBarController as? TabBarController)?.showsTabBar == true ? .zero : view.safeAreaInsets
        leading?.constant = insets.left
        trailing?.constant = insets.right
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()

        if let content {
            (tabBarController as? TabBarController)?.contentDidLayout(content)
        }
    }

    override var childForStatusBarStyle: UIViewController? { children.first }
    override var childForStatusBarHidden: UIViewController? { children.first }
    override var childForHomeIndicatorAutoHidden: UIViewController? { children.first }
}

// Liquid Glass buttons in a row, centred in their frame.
@available(iOS 26, *)
private final class ActionBar: UIView {
    private let stack = UIStackView()
    private let onSelect: (String) -> Void
    private var actions: [NavigationAction] = []

    init(onSelect: @escaping (String) -> Void) {
        self.onSelect = onSelect
        super.init(frame: .zero)

        stack.axis = .horizontal
        stack.alignment = .center
        stack.spacing = 8
        stack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stack)
        NSLayoutConstraint.activate([
            stack.centerXAnchor.constraint(equalTo: centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: centerYAnchor)
        ])
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    // Taps outside the buttons reach the page beneath.
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        let view = super.hitTest(point, with: event)
        return view === self || view === stack ? nil : view
    }

    func set(_ actions: [NavigationAction]) {
        // Rebuilding mid-press would cancel it, so buttons that stay only change their state.
        guard actions.map(\.id) == self.actions.map(\.id) else {
            self.actions = actions
            stack.arrangedSubviews.forEach { $0.removeFromSuperview() }
            actions.map(makeButton).forEach(stack.addArrangedSubview)
            return
        }

        self.actions = actions
        for (button, action) in zip(stack.arrangedSubviews.compactMap { $0 as? UIButton }, actions) {
            button.isEnabled = action.enabled
            button.tintColor = action.tint
        }
    }

    private func makeButton(_ action: NavigationAction) -> UIButton {
        var configuration: UIButton.Configuration = action.prominent ? .prominentGlass() : .glass()
        configuration.image = (UIImage(named: action.icon) ?? UIImage(systemName: action.icon))?
            .withRenderingMode(.alwaysTemplate)
        configuration.preferredSymbolConfigurationForImage = UIImage.SymbolConfiguration(
            pointSize: action.prominent ? 28 : 22,
            weight: .bold
        )
        configuration.baseForegroundColor = action.prominent ? .white : .label
        configuration.cornerStyle = .capsule

        let button = UIButton(configuration: configuration, primaryAction: UIAction { [onSelect] _ in
            onSelect(action.id)
        })
        button.tintColor = action.tint
        button.isEnabled = action.enabled

        let size: CGFloat = action.prominent ? 68 : 56
        button.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            button.widthAnchor.constraint(equalToConstant: size),
            button.heightAnchor.constraint(equalToConstant: size)
        ])
        return button
    }
}
