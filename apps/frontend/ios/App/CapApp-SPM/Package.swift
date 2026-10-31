// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.5.3"),
        .package(name: "CapacitorCommunityInAppReview", path: "../../../../../node_modules/.pnpm/@capacitor-community+in-app-review@8.0.0_@capacitor+core@8.5.3/node_modules/@capacitor-community/in-app-review"),
        .package(name: "CapacitorCommunitySafeArea", path: "../../../../../node_modules/.pnpm/@capacitor-community+safe-area@8.0.1_@capacitor+core@8.5.3/node_modules/@capacitor-community/safe-area"),
        .package(name: "CapacitorApp", path: "../../../../../node_modules/.pnpm/@capacitor+app@8.1.2_@capacitor+core@8.5.3/node_modules/@capacitor/app"),
        .package(name: "CapacitorClipboard", path: "../../../../../node_modules/.pnpm/@capacitor+clipboard@8.0.1_@capacitor+core@8.5.3/node_modules/@capacitor/clipboard"),
        .package(name: "CapacitorDevice", path: "../../../../../node_modules/.pnpm/@capacitor+device@8.0.3_@capacitor+core@8.5.3/node_modules/@capacitor/device"),
        .package(name: "CapacitorDialog", path: "../../../../../node_modules/.pnpm/@capacitor+dialog@8.0.1_@capacitor+core@8.5.3/node_modules/@capacitor/dialog"),
        .package(name: "CapacitorGeolocation", path: "../../../../../node_modules/.pnpm/@capacitor+geolocation@8.2.4_@capacitor+core@8.5.3/node_modules/@capacitor/geolocation"),
        .package(name: "CapacitorKeyboard", path: "../../../../../node_modules/.pnpm/@capacitor+keyboard@8.0.6_@capacitor+core@8.5.3/node_modules/@capacitor/keyboard"),
        .package(name: "CapacitorPreferences", path: "../../../../../node_modules/.pnpm/@capacitor+preferences@8.0.1_@capacitor+core@8.5.3/node_modules/@capacitor/preferences"),
        .package(name: "CapacitorPushNotifications", path: "../../../../../node_modules/.pnpm/@capacitor+push-notifications@8.1.3_@capacitor+core@8.5.3/node_modules/@capacitor/push-notifications"),
        .package(name: "CapacitorShare", path: "../../../../../node_modules/.pnpm/@capacitor+share@8.0.3_@capacitor+core@8.5.3/node_modules/@capacitor/share"),
        .package(name: "CapacitorToast", path: "../../../../../node_modules/.pnpm/@capacitor+toast@8.0.1_@capacitor+core@8.5.3/node_modules/@capacitor/toast"),
        .package(name: "CapawesomeTeamCapacitorDatetimePicker", path: "../../../../../node_modules/.pnpm/@capawesome-team+capacitor-datetime-picker@8.2.0_@capacitor+core@8.5.3/node_modules/@capawesome-team/capacitor-datetime-picker"),
        .package(name: "CapawesomeCapacitorAgeSignals", path: "../../../../../node_modules/.pnpm/@capawesome+capacitor-age-signals@0.5.1_@capacitor+core@8.5.3/node_modules/@capawesome/capacitor-age-signals"),
        .package(name: "CapawesomeCapacitorAppUpdate", path: "../../../../../node_modules/.pnpm/@capawesome+capacitor-app-update@8.1.1_@capacitor+core@8.5.3/node_modules/@capawesome/capacitor-app-update"),
        .package(name: "CapgoCapacitorInappbrowser", path: "../../../../../node_modules/.pnpm/@capgo+capacitor-inappbrowser@8.26.2_@capacitor+core@8.5.3/node_modules/@capgo/capacitor-inappbrowser"),
        .package(name: "CapgoCapacitorSocialLogin", path: "../../../../../node_modules/.pnpm/@capgo+capacitor-social-login@8.7.5_@capacitor+core@8.5.3/node_modules/@capgo/capacitor-social-login"),
        .package(name: "RevenuecatPurchasesCapacitor", path: "../../../../../node_modules/.pnpm/@revenuecat+purchases-capacitor@13.8.0_@capacitor+core@8.5.3/node_modules/@revenuecat/purchases-capacitor"),
        .package(name: "CapacitorNativeSettings", path: "../../../../../node_modules/.pnpm/capacitor-native-settings@8.2.0_@capacitor+core@8.5.3/node_modules/capacitor-native-settings")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapacitorCommunityInAppReview", package: "CapacitorCommunityInAppReview"),
                .product(name: "CapacitorCommunitySafeArea", package: "CapacitorCommunitySafeArea"),
                .product(name: "CapacitorApp", package: "CapacitorApp"),
                .product(name: "CapacitorClipboard", package: "CapacitorClipboard"),
                .product(name: "CapacitorDevice", package: "CapacitorDevice"),
                .product(name: "CapacitorDialog", package: "CapacitorDialog"),
                .product(name: "CapacitorGeolocation", package: "CapacitorGeolocation"),
                .product(name: "CapacitorKeyboard", package: "CapacitorKeyboard"),
                .product(name: "CapacitorPreferences", package: "CapacitorPreferences"),
                .product(name: "CapacitorPushNotifications", package: "CapacitorPushNotifications"),
                .product(name: "CapacitorShare", package: "CapacitorShare"),
                .product(name: "CapacitorToast", package: "CapacitorToast"),
                .product(name: "CapawesomeTeamCapacitorDatetimePicker", package: "CapawesomeTeamCapacitorDatetimePicker"),
                .product(name: "CapawesomeCapacitorAgeSignals", package: "CapawesomeCapacitorAgeSignals"),
                .product(name: "CapawesomeCapacitorAppUpdate", package: "CapawesomeCapacitorAppUpdate"),
                .product(name: "CapgoCapacitorInappbrowser", package: "CapgoCapacitorInappbrowser"),
                .product(name: "CapgoCapacitorSocialLogin", package: "CapgoCapacitorSocialLogin"),
                .product(name: "RevenuecatPurchasesCapacitor", package: "RevenuecatPurchasesCapacitor"),
                .product(name: "CapacitorNativeSettings", package: "CapacitorNativeSettings")
            ]
        )
    ]
)
