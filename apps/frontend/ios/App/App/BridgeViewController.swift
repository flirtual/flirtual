import Capacitor
import WebKit

@objc(BridgeViewController)
class BridgeViewController: CAPBridgeViewController {
    private var navigationProxy: WebViewRetryProxy?

    override func viewDidLoad() {
        super.viewDidLoad()

        guard let webView = self.webView, let inner = webView.navigationDelegate else { return }

        let proxy = WebViewRetryProxy(inner: inner)
        navigationProxy = proxy
        webView.navigationDelegate = proxy
    }
}

// Forwards all WKNavigationDelegate messages to Capacitor's WebViewDelegationHandler and adds
// retries for network errors.
private final class WebViewRetryProxy: NSObject, WKNavigationDelegate {
    private weak var inner: WKNavigationDelegate?
    private var retryCount = 0
    private var lastRequestedURL: URL?

    private let maxRetries = 8

    private let transientErrorCodes: Set<Int> = [
        NSURLErrorTimedOut,               // -1001
        NSURLErrorCannotFindHost,         // -1003
        NSURLErrorCannotConnectToHost,    // -1004
        NSURLErrorNetworkConnectionLost,  // -1005
        NSURLErrorDNSLookupFailed,        // -1006
        NSURLErrorNotConnectedToInternet  // -1009
    ]

    init(inner: WKNavigationDelegate) {
        self.inner = inner
    }

    // Forward any selector we don't implement to Capacitor.
    override func responds(to aSelector: Selector!) -> Bool {
        super.responds(to: aSelector) || inner?.responds(to: aSelector) == true
    }

    override func forwardingTarget(for aSelector: Selector!) -> Any? { inner }

    func webView(
        _ webView: WKWebView,
        decidePolicyFor navigationAction: WKNavigationAction,
        decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
    ) {
        if let url = navigationAction.request.url, url.scheme == "http" || url.scheme == "https" {
            lastRequestedURL = url
        }
        // Default-allow if unimplemented so decisionHandler isn't dropped.
        let selector = Selector("webView:decidePolicyForNavigationAction:decisionHandler:")
        guard let inner = inner, inner.responds(to: selector) else {
            decisionHandler(.allow)
            return
        }
        inner.webView!(webView, decidePolicyFor: navigationAction, decisionHandler: decisionHandler)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        retryCount = 0
        inner?.webView?(webView, didFinish: navigation)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        inner?.webView?(webView, didFail: navigation, withError: error)
        scheduleRetryIfNeeded(webView: webView, error: error)
    }

    func webView(
        _ webView: WKWebView,
        didFailProvisionalNavigation navigation: WKNavigation!,
        withError error: Error
    ) {
        inner?.webView?(webView, didFailProvisionalNavigation: navigation, withError: error)
        scheduleRetryIfNeeded(webView: webView, error: error)
    }

    private func scheduleRetryIfNeeded(webView: WKWebView, error: Error) {
        let nsError = error as NSError
        guard nsError.domain == NSURLErrorDomain,
              transientErrorCodes.contains(nsError.code),
              retryCount < maxRetries,
              let url = lastRequestedURL else {
            return
        }

        retryCount += 1
        let delay = min(pow(2.0, Double(retryCount - 1)) * 0.25, 5.0)
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak webView] in
            webView?.load(URLRequest(url: url))
        }
    }
}
