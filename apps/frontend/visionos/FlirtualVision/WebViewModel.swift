import Foundation
import SwiftUI
@preconcurrency import WebKit

@objcMembers
class WebViewModel: NSObject, ObservableObject, WKNavigationDelegate, WKScriptMessageHandler, WKUIDelegate {
    @Published var webResource: String?
    @Published var currentURL: String = ""
    
    var webView: WKWebView
    var onUrlChange: ((URL) -> Void)?
    var onOpenExternalURL: ((URL) -> Void)?
    
    override init() {
        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.allowsInlineMediaPlayback = true
        config.allowsAirPlayForMediaPlayback = true
        config.allowsPictureInPictureMediaPlayback = true
        
        let userContentController = WKUserContentController()
        config.userContentController = userContentController
        
        let js = """
            (function() {
                function notifyUrlChange() {
                    window.webkit.messageHandlers.urlObserver.postMessage(window.location.href);
                }

                var pushState = history.pushState;
                history.pushState = function() {
                    pushState.apply(this, arguments);
                    notifyUrlChange();
                };

                var replaceState = history.replaceState;
                history.replaceState = function() {
                    replaceState.apply(this, arguments);
                    notifyUrlChange();
                };

                window.addEventListener('popstate', function() {
                    notifyUrlChange();
                });

                notifyUrlChange();
            })();
        """
        let userScript = WKUserScript(source: js, injectionTime: .atDocumentEnd, forMainFrameOnly: true)
        userContentController.addUserScript(userScript)
        
        self.webView = WKWebView(frame: .zero, configuration: config)
        self.webView.isOpaque = false
        self.webView.backgroundColor = UIColor.clear
        
        super.init()
        userContentController.add(self, name: "urlObserver")
        self.webView.navigationDelegate = self
        self.webView.uiDelegate = self
        
        webView.evaluateJavaScript("navigator.userAgent") { [weak webView] (result, error) in
            if let webView = webView, let userAgent = result as? String {
                webView.customUserAgent = userAgent + " Flirtual-Vision"
            }
        }
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if let url = webView.url {
            self.currentURL = url.absoluteString
        }
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("Failed to load: \(error.localizedDescription)")
    }
    
    func webView(_ webView: WKWebView,
                 createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction,
                 windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url {
            DispatchQueue.main.async {
                self.onOpenExternalURL?(url)
            }
        }
        return nil
    }
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "urlObserver", let urlString = message.body as? String {
            if let url = URL(string: urlString) {
                DispatchQueue.main.async {
                    self.currentURL = url.absoluteString
                    self.onUrlChange?(url)
                }
            }
        }
    }
    
    func loadWebPage() {
        if let webResource = webResource {
            guard let url = URL(string: webResource) else {
                print("Bad URL")
                return
            }
            
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }
}
