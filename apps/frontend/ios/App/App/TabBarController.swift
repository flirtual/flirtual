import Capacitor
import UIKit
import WebKit

struct NavigationTab: Equatable {
    let id: String
    let title: String
    let icon: String
}

// Hosts the one Capacitor bridge under a native tab bar. Each tab gets an empty container, and the
// bridge moves into whichever container is selected, so switching tabs never reloads the page. The
// web app owns the tabs and the selection; this only mirrors what it sends and reports taps back.
@available(iOS 26, *)
final class TabBarController: UITabBarController, UITabBarControllerDelegate {
    private let bridgeViewController: BridgeViewController
    private var items: [NavigationTab] = []
    private var containers: [String: TabContentViewController] = [:]
    private var sidebarHidden = false
    // Whether the page asked for the tab bar. isTabBarHidden can't say, since the bar is briefly
    // hidden and shown again to refresh it after new tabs.
    fileprivate private(set) var showsTabBar = false
    private var topCorners: [String: Double] = [:]
    private var fold: [String: Double] = [:]
    private var sideBar: [String: Double] = [:]
    private var settled: DispatchWorkItem?

    var layout: JSObject {
        [
            "topCorners": topCorners.mapValues { $0 as JSValue },
            "fold": fold.mapValues { $0 as JSValue },
            "sideBar": sideBar.mapValues { $0 as JSValue }
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
        mode = .tabSidebar

        sidebarHidden = sidebar.isHidden
        sidebar.isHidden = true
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

            for (item, tab) in zip(tabBar.items ?? [], newItems) {
                item.accessibilityLabel = tab.title
            }

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

        if visible {
            sidebar.isHidden = sidebarHidden
        } else {
            sidebarHidden = sidebar.isHidden
            sidebar.isHidden = true
        }

        setTabBarHidden(!visible, animated: true)
        selectedViewController?.view.setNeedsLayout()
    }

    private func makeTab(_ item: NavigationTab) -> UITab {
        let image = UIImage(named: item.icon) ?? UIImage(systemName: item.icon)

        // Icons only on iPhone, which never shows the sidebar. The title stays for VoiceOver.
        let title = traitCollection.userInterfaceIdiom == .phone ? "" : item.title

        return UITab(title: title, image: image, identifier: item.id) { [unowned self] tab in
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

        bridgeViewController.willMove(toParent: nil)
        previous?.content = nil
        bridgeViewController.removeFromParent()

        container.addChild(bridgeViewController)
        bridgeViewController.loadViewIfNeeded()
        container.content = bridgeViewController.webView
        bridgeViewController.didMove(toParent: container)

        if let scrollView = bridgeViewController.webView?.scrollView {
            container.setContentScrollView(scrollView)
        }
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
        guard corners != topCorners || fold != self.fold || sideBar != self.sideBar else { return }

        topCorners = corners
        self.fold = fold
        self.sideBar = sideBar
        plugin?.notifyListeners("layout", data: layout)
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()

        if let webView = bridgeViewController.webView, webView.window != nil {
            contentDidLayout(webView)
        }
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
        return ["top": frame.minY]
    }

    // A fold splitting the page side by side, as when iPhone Duo is partially open in landscape.
    private static func fold(in view: UIView) -> [String: Double] {
        guard #available(iOS 27.1, *),
              let frame = view.reservedRegions(kind: .division)
                .first(where: { $0.isActive && $0.frame.height >= view.bounds.height })?.frame else { return [:] }

        return ["x": frame.minX, "width": frame.width]
    }

    // What the system reserves in the top corners, like iPhone Duo's status bar, so content along
    // the top can sit beside it, down to its bottom. The height is only there when it fits in the
    // top safe area, as in inner portrait, leaving the rest of the top edge free. Anything else
    // along the top edge, like a Dynamic Island, means none of it is.
    private static func topCornerClearance(of view: UIView) -> [String: Double] {
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
    private var backgroundObservation: NSKeyValueObservation?

    var content: WKWebView? {
        didSet {
            oldValue?.removeFromSuperview()
            backgroundObservation = nil

            guard let content else { return }
            view.addSubview(content)
            view.setNeedsLayout()

            backgroundObservation = content.observe(\.underPageBackgroundColor, options: [.initial, .new]) { [weak self] webView, _ in
                self?.view.backgroundColor = webView.underPageBackgroundColor
            }
        }
    }

    // While the tab bar shows, the page spans the full width and keeps its own content clear of
    // whatever sits on the sides (iPhone Duo's vertical bars, the iPad sidebar), so headers and
    // images can run beneath them. Pages without it aren't built for that, so they're kept clear
    // here, with the page's own background beneath. Top and bottom always stay edge to edge.
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()

        let insets = (tabBarController as? TabBarController)?.showsTabBar == true ? .zero : view.safeAreaInsets
        content?.frame = view.bounds.inset(by: UIEdgeInsets(top: 0, left: insets.left, bottom: 0, right: insets.right))

        if let content {
            (tabBarController as? TabBarController)?.contentDidLayout(content)
        }
    }

    override var childForStatusBarStyle: UIViewController? { children.first }
    override var childForStatusBarHidden: UIViewController? { children.first }
    override var childForHomeIndicatorAutoHidden: UIViewController? { children.first }
}
