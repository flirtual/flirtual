import Foundation
import SwiftUI
import WebKit

struct WebView: UIViewRepresentable {
    typealias UIViewType = WKWebView
    
    var vm: WebViewModel
    
    init(viewModel: WebViewModel) {
        self.vm = viewModel
    }
    
    func makeUIView(context: Context) -> WKWebView {
        return vm.webView
    }
    
    func updateUIView(_ uiView: WKWebView, context: Context) {
    }
    
    func makeCoordinator() -> Coordinator {
        return Coordinator(viewModel: vm)
    }
}

extension WebView {
    class Coordinator: NSObject, WKNavigationDelegate {
        var viewModel: WebViewModel
        
        init(viewModel: WebViewModel) {
            self.viewModel = viewModel
        }
    }
}
