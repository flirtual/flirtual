import Capacitor
import GoogleSignIn
import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        if #available(iOS 26, *), let bridge = window?.rootViewController as? BridgeViewController {
            window?.rootViewController = TabBarController(bridgeViewController: bridge)
        }

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        UIApplication.shared.applicationIconBadgeNumber = 0
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        // Google sign-in handles its own OAuth callback URL.
        let contexts = URLContexts.filter { !GIDSignIn.sharedInstance.handle($0.url) }
        guard !contexts.isEmpty else { return }

        SceneDelegateProxy.shared.scene(scene, openURLContexts: contexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
