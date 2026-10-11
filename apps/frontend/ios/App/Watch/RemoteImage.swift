import ImageIO
import SwiftUI
import UIKit

// AsyncImage loses its load when a List row re-renders and never retries. Loads here are shared,
// cached and outlive the view that started them.
@MainActor
final class ImageLoader {
    static let shared = ImageLoader()

    private let cache = NSCache<NSString, UIImage>()
    private var loads: [String: Task<UIImage?, Never>] = [:]

    func cached(_ url: URL, size: CGFloat) -> UIImage? {
        cache.object(forKey: Self.key(url, size) as NSString)
    }

    func image(_ url: URL, size: CGFloat) async -> UIImage? {
        let key = Self.key(url, size)
        if let image = cache.object(forKey: key as NSString) { return image }

        let load = loads[key] ?? Task.detached(priority: .userInitiated) {
            await Self.download(url, size: size)
        }
        loads[key] = load

        let image = await load.value
        loads[key] = nil
        if let image { cache.setObject(image, forKey: key as NSString) }
        return image
    }

    private static func key(_ url: URL, _ size: CGFloat) -> String {
        "\(Int(size))@\(url.absoluteString)"
    }

    private nonisolated static func download(_ url: URL, size: CGFloat) async -> UIImage? {
        for attempt in 0..<3 {
            if attempt > 0 { try? await Task.sleep(for: .seconds(attempt)) }
            guard let (data, response) = try? await API.session.data(from: url),
                  (response as? HTTPURLResponse)?.statusCode == 200,
                  let source = CGImageSourceCreateWithData(data as CFData, nil) else { continue }

            let options: [CFString: Any] = [
                kCGImageSourceCreateThumbnailFromImageAlways: true,
                kCGImageSourceCreateThumbnailWithTransform: true,
                kCGImageSourceThumbnailMaxPixelSize: size
            ]
            guard let image = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else { return nil }
            return UIImage(cgImage: image)
        }
        return nil
    }
}

struct RemoteImage: View {
    let url: URL?
    let size: CGFloat

    @State private var image: UIImage?

    init(url: URL?, size: CGFloat) {
        self.url = url
        self.size = size
        _image = State(initialValue: url.flatMap { ImageLoader.shared.cached($0, size: size) })
    }

    var body: some View {
        Color.clear
            .overlay {
                if let image {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                } else {
                    Rectangle().fill(.quaternary)
                }
            }
            .clipped()
            .task(id: url) {
                guard let url, image == nil else { return }
                image = await ImageLoader.shared.image(url, size: size)
            }
    }
}
