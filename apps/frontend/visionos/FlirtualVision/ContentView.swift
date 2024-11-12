import SwiftUI

extension Binding {
    func onUpdate(_ closure: @escaping () -> Void) -> Binding<Value> {
        Binding(get: {
            wrappedValue
        }, set: { newValue in
            wrappedValue = newValue
            closure()
        })
    }
}

struct ContentView: View {
    private let BASE_URL = "https://flirtu.al"
    @ObservedObject private var vm = WebViewModel()
    @State private var selectedTab = 0
    @State private var isProgrammaticTabChange = false
    @Environment(\.openURL) var openURL

    var body: some View {
        VStack {
            TabView(selection: $selectedTab.onUpdate{
                if !isProgrammaticTabChange {
                    switch selectedTab {
                    case 0:
                        vm.webResource = BASE_URL + "/browse"
                    case 1:
                        vm.webResource = BASE_URL + "/browse?kind=friend"
                    case 2:
                        vm.webResource = BASE_URL + "/matches"
                    case 3:
                        vm.webResource = BASE_URL + "/me"
                    case 4:
                        vm.webResource = BASE_URL + "/settings"
                    default:
                        break
                    }
                    vm.loadWebPage()
                }
                isProgrammaticTabChange = false
            }) {
                Text("").tabItem {
                    Image("heart")
                    Text("Browse")
                }
                .tag(0)
                
                Text("").tabItem {
                    Image("peace")
                    Text("Homies")
                }
                .tag(1)
                
                Text("").tabItem {
                    Image(systemName: "bubble")
                    Text("Matches")
                }
                .tag(2)
                
                Text("").tabItem {
                    Image(systemName: "person")
                    Text("Profile")
                }
                .tag(3)
                
                Text("").tabItem {
                    Image(systemName: "gear")
                    Text("Settings")
                }
                .tag(4)
            }
            .onAppear {
                selectedTab = 0
                vm.webResource = BASE_URL
                vm.loadWebPage()
            }
        }
        .overlay(
            WebView(viewModel: vm)
                .onAppear {
                    vm.onUrlChange = { url in
                        if let components = URLComponents(url: url, resolvingAgainstBaseURL: false) {
                            var newTab: Int? = nil
                            if components.path.starts(with: "/browse") {
                                if components.queryItems?.contains(where: { $0.name == "kind" && $0.value == "friend" }) == true {
                                    newTab = 1
                                } else {
                                    newTab = 0
                                }
                            } else if components.path.starts(with: "/matches") {
                                newTab = 2
                            } else if components.path.starts(with: "/me") {
                                newTab = 3
                            } else if components.path.starts(with: "/settings") {
                                newTab = 4
                            }

                            if let tab = newTab, selectedTab != tab {
                                isProgrammaticTabChange = true
                                selectedTab = tab
                            }
                        }
                    }
                    
                    vm.onOpenExternalURL = { url in
                        openURL(url)
                    }
                }
        )
    }
}

#Preview(windowStyle: .automatic) {
    ContentView()
}
