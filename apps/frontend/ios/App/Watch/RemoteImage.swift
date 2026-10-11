import ImageIO
import libwebp
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
                  (response as? HTTPURLResponse)?.statusCode == 200 else { continue }

            return (thumbnail(data, size: size) ?? webP(data, size: size)).map(UIImage.init(cgImage:))
        }
        return nil
    }

    private nonisolated static func thumbnail(_ data: Data, size: CGFloat) -> CGImage? {
        guard let source = CGImageSourceCreateWithData(data as CFData, nil) else { return nil }
        let options: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceThumbnailMaxPixelSize: size
        ]
        return CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary)
    }

    private nonisolated static func webP(_ data: Data, size: CGFloat) -> CGImage? {
        var config = WebPDecoderConfig()
        guard WebPInitDecoderConfig(&config) != 0 else { return nil }

        return data.withUnsafeBytes { buffer -> CGImage? in
            guard let bytes = buffer.bindMemory(to: UInt8.self).baseAddress,
                  WebPGetFeatures(bytes, buffer.count, &config.input) == VP8_STATUS_OK else { return nil }

            let scale = min(1, size / CGFloat(max(config.input.width, config.input.height)))
            let width = max(1, Int((CGFloat(config.input.width) * scale).rounded()))
            let height = max(1, Int((CGFloat(config.input.height) * scale).rounded()))
            config.options.use_scaling = 1
            config.options.scaled_width = Int32(width)
            config.options.scaled_height = Int32(height)
            config.output.colorspace = MODE_rgbA

            guard WebPDecode(bytes, buffer.count, &config) == VP8_STATUS_OK else { return nil }
            defer { WebPFreeDecBuffer(&config.output) }

            let rgba = config.output.u.RGBA
            guard let pixels = CFDataCreate(nil, rgba.rgba, rgba.size),
                  let provider = CGDataProvider(data: pixels) else { return nil }

            return CGImage(
                width: width,
                height: height,
                bitsPerComponent: 8,
                bitsPerPixel: 32,
                bytesPerRow: Int(rgba.stride),
                space: CGColorSpaceCreateDeviceRGB(),
                bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue),
                provider: provider,
                decode: nil,
                shouldInterpolate: true,
                intent: .defaultIntent
            )
        }
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
