import SwiftUI

extension Mode {
    var gradient: LinearGradient {
        switch self {
        case .love:
            LinearGradient(colors: [Color(hex: 0xFF8975), Color(hex: 0xE9658B)], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .friend:
            LinearGradient(colors: [Color(hex: 0x82BF72), Color(hex: 0x4D8888)], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }

    var tint: Color {
        switch self {
        case .love: Color(hex: 0xE9658B)
        case .friend: Color(hex: 0x82BF72)
        }
    }

    var icon: String {
        switch self {
        case .love: "heart"
        case .friend: "peace"
        }
    }

    var other: Mode {
        self == .love ? .friend : .love
    }
}

extension CGFloat {
    static let margin: CGFloat = 6
    // Keeps content clear of the Pass and Like buttons in the bottom corners.
    static let buttonClearance: CGFloat = 50
    // The heart and peace artwork is inset within its canvas, so it needs a larger frame to match
    // the SF Symbols beside it.
    static let assetIconSize: CGFloat = 22
}

extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}

struct Avatar: View {
    let url: URL?
    var size: CGFloat = 40

    var body: some View {
        RemoteImage(url: url, size: size * 3)
            .frame(width: size, height: size)
        .clipShape(Circle())
    }
}
