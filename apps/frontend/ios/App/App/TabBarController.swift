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
    private(set) var topCorners: [String: Double] = [:]

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
        let corners = Self.topCornerClearance(of: webView)
        guard corners != topCorners else { return }

        topCorners = corners
        plugin?.notifyListeners("layout", data: corners.mapValues { $0 as JSValue })
    }

    // What the system reserves in the top corners, like iPhone Duo's status bar in inner portrait,
    // which leaves the rest of the top edge free for the page. Anything else along the top edge,
    // like a Dynamic Island, means it isn't.
    private static func topCornerClearance(of view: UIView) -> [String: Double] {
        guard #available(iOS 27.1, *) else { return [:] }

        var left = 0.0, right = 0.0, height = 0.0
        for region in view.reservedRegions(kind: .occlusion) where region.isActive && region.frame.minY <= 0 {
            // Taller than the top safe area means a status bar down the side, as in landscape.
            guard region.frame.maxY <= view.safeAreaInsets.top else { return [:] }

            if region.frame.maxX >= view.bounds.maxX {
                right = max(right, view.bounds.maxX - region.frame.minX)
            } else if region.frame.minX <= 0 {
                left = max(left, region.frame.maxX)
            } else {
                return [:]
            }
            height = max(height, region.frame.maxY)
        }

        return height > 0 ? ["left": left, "right": right, "height": height] : [:]
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

        let insets = tabBarController?.isTabBarHidden == false ? .zero : view.safeAreaInsets
        content?.frame = view.bounds.inset(by: UIEdgeInsets(top: 0, left: insets.left, bottom: 0, right: insets.right))

        if let content {
            (tabBarController as? TabBarController)?.contentDidLayout(content)
        }
    }

    override var childForStatusBarStyle: UIViewController? { children.first }
    override var childForStatusBarHidden: UIViewController? { children.first }
    override var childForHomeIndicatorAutoHidden: UIViewController? { children.first }
}
