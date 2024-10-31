import SwiftUI

@main
struct FlirtualVisionApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .frame(minWidth: 350, maxWidth: 750, minHeight: 500)
        }
        .defaultSize(CGSize(width: 450, height: 900))
        .windowResizability(.contentSize)
    }
}
