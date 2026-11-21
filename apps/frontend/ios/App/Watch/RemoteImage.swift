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

// GIFs from the app's picker are sent as nothing but their Klipy URL (isKlipyMedia in
// src/api/embed.ts). Klipy's terms have the person's own device load them straight from Klipy.
func klipyMedia(_ text: String?) -> URL? {
    guard let text = text?.trimmingCharacters(in: .whitespacesAndNewlines),
          let url = URL(string: text), url.scheme == "https",
          let host = url.host(), host.range(of: #"^static\d*\.klipy\.com$"#, options: .regularExpression) != nil else { return nil }
    return url
}

final class Animation: @unchecked Sendable {
    let frames: [CGImage]
    let width: Int
    let height: Int
    private let ends: [TimeInterval]

    init?(frames: [CGImage], delays: [TimeInterval]) {
        guard let first = frames.first, frames.count == delays.count else { return nil }
        self.frames = frames
        width = first.width
        height = first.height
        // Browsers treat near-zero delays as 0.1s, and GIFs are made for browsers.
        var end: TimeInterval = 0
        ends = delays.map { delay in
            end += delay < 0.02 ? 0.1 : delay
            return end
        }
    }

    var cost: Int { frames.count * width * height * 4 }

    func frame(at date: Date) -> CGImage {
        guard frames.count > 1, let duration = ends.last else { return frames[0] }
        let time = date.timeIntervalSinceReferenceDate.truncatingRemainder(dividingBy: duration)
        return frames[ends.firstIndex { time < $0 } ?? frames.count - 1]
    }
}

@MainActor
final class AnimationLoader {
    static let shared = AnimationLoader()

    // Frames are decoded at the size shown, and long animations are thinned out, but a few of
    // them still add up on a watch.
    private static let maximumFrames = 60
    private let cache: NSCache<NSString, Animation> = {
        let cache = NSCache<NSString, Animation>()
        cache.totalCostLimit = 24 * 1024 * 1024
        return cache
    }()
    private var loads: [String: Task<Animation?, Never>] = [:]

    func animation(_ url: URL, size: CGFloat) async -> Animation? {
        let key = "\(Int(size))@\(url.absoluteString)"
        if let animation = cache.object(forKey: key as NSString) { return animation }

        let load = loads[key] ?? Task.detached(priority: .userInitiated) {
            await Self.download(url, size: size)
        }
        loads[key] = load

        let animation = await load.value
        loads[key] = nil
        if let animation { cache.setObject(animation, forKey: key as NSString, cost: animation.cost) }
        return animation
    }

    private nonisolated static func download(_ url: URL, size: CGFloat) async -> Animation? {
        for attempt in 0..<3 {
            if attempt > 0 { try? await Task.sleep(for: .seconds(attempt)) }
            guard let (data, response) = try? await API.session.data(from: url),
                  (response as? HTTPURLResponse)?.statusCode == 200 else { continue }

            return data.starts(with: Array("GIF8".utf8)) ? gif(data, size: size) : webP(data, size: size)
        }
        return nil
    }

    private nonisolated static func gif(_ data: Data, size: CGFloat) -> Animation? {
        guard let source = CGImageSourceCreateWithData(data as CFData, nil) else { return nil }
        let options: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceThumbnailMaxPixelSize: size
        ]

        let count = CGImageSourceGetCount(source)
        let kept = keptFrames(count)
        var frames: [CGImage] = []
        var delays: [TimeInterval] = []
        for index in 0..<count {
            let properties = CGImageSourceCopyPropertiesAtIndex(source, index, nil) as? [CFString: Any]
            let gif = properties?[kCGImagePropertyGIFDictionary] as? [CFString: Any]
            let delay = (gif?[kCGImagePropertyGIFUnclampedDelayTime] ?? gif?[kCGImagePropertyGIFDelayTime]) as? Double ?? 0.1

            if kept.contains(index) {
                guard let frame = CGImageSourceCreateThumbnailAtIndex(source, index, options as CFDictionary) else { return nil }
                frames.append(frame)
                delays.append(delay)
            } else if !delays.isEmpty {
                delays[delays.count - 1] += delay
            }
        }
        return Animation(frames: frames, delays: delays)
    }

    // libwebp composites each frame onto the canvas, so every frame it hands back is complete.
    private nonisolated static func webP(_ data: Data, size: CGFloat) -> Animation? {
        data.withUnsafeBytes { buffer -> Animation? in
            guard let bytes = buffer.bindMemory(to: UInt8.self).baseAddress else { return nil }
            var input = WebPData(bytes: bytes, size: buffer.count)
            var options = WebPAnimDecoderOptions()
            guard WebPAnimDecoderOptionsInit(&options) != 0 else { return nil }
            options.color_mode = MODE_rgbA

            guard let decoder = WebPAnimDecoderNew(&input, &options) else { return nil }
            defer { WebPAnimDecoderDelete(decoder) }

            var info = WebPAnimInfo()
            guard WebPAnimDecoderGetInfo(decoder, &info) != 0 else { return nil }
            let width = Int(info.canvas_width)
            let height = Int(info.canvas_height)
            let kept = keptFrames(Int(info.frame_count))

            var frames: [CGImage] = []
            var delays: [TimeInterval] = []
            var index = 0
            var previous: Int32 = 0
            while WebPAnimDecoderHasMoreFrames(decoder) != 0 {
                var pixels: UnsafeMutablePointer<UInt8>?
                var timestamp: Int32 = 0
                guard WebPAnimDecoderGetNext(decoder, &pixels, &timestamp) != 0, let pixels else { return nil }

                // Each timestamp is when that frame ends.
                let delay = Double(timestamp - previous) / 1000
                previous = timestamp
                defer { index += 1 }

                if kept.contains(index) {
                    guard let frame = scaled(pixels, width: width, height: height, size: size) else { return nil }
                    frames.append(frame)
                    delays.append(delay)
                } else if !delays.isEmpty {
                    delays[delays.count - 1] += delay
                }
            }
            return Animation(frames: frames, delays: delays)
        }
    }

    // Every nth frame, so a long animation keeps its length; a skipped frame's delay goes to the
    // frame before it.
    private nonisolated static func keptFrames(_ count: Int) -> Set<Int> {
        let step = max(1, Int((Double(count) / Double(maximumFrames)).rounded(.up)))
        return Set(stride(from: 0, to: count, by: step))
    }

    private nonisolated static func scaled(_ pixels: UnsafeMutablePointer<UInt8>, width: Int, height: Int, size: CGFloat) -> CGImage? {
        guard let data = CFDataCreate(nil, pixels, width * height * 4),
              let provider = CGDataProvider(data: data),
              let image = CGImage(
                width: width,
                height: height,
                bitsPerComponent: 8,
                bitsPerPixel: 32,
                bytesPerRow: width * 4,
                space: CGColorSpaceCreateDeviceRGB(),
                bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue),
                provider: provider,
                decode: nil,
                shouldInterpolate: true,
                intent: .defaultIntent
              ) else { return nil }

        let scale = min(1, size / CGFloat(max(width, height)))
        guard scale < 1 else { return image }

        let target = (width: max(1, Int((CGFloat(width) * scale).rounded())), height: max(1, Int((CGFloat(height) * scale).rounded())))
        guard let context = CGContext(
            data: nil,
            width: target.width,
            height: target.height,
            bitsPerComponent: 8,
            bytesPerRow: 0,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else { return nil }
        context.interpolationQuality = .medium
        context.draw(image, in: CGRect(x: 0, y: 0, width: target.width, height: target.height))
        return context.makeImage()
    }
}

struct AnimatedRemoteImage: View {
    let url: URL
    let size: CGFloat

    @State private var animation: Animation?
    @State private var visible = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.displayScale) private var displayScale

    var body: some View {
        Group {
            if let animation {
                // Only plays while it's on screen, and not at all with Reduce Motion.
                TimelineView(.animation(paused: !visible || reduceMotion || animation.frames.count < 2)) { context in
                    Image(decorative: animation.frame(at: context.date), scale: displayScale)
                        .resizable()
                        .aspectRatio(CGFloat(animation.width) / CGFloat(animation.height), contentMode: .fit)
                }
            } else {
                Rectangle().fill(.quaternary).aspectRatio(1, contentMode: .fit)
            }
        }
        .onAppear { visible = true }
        .onDisappear { visible = false }
        .task(id: url) {
            animation = await AnimationLoader.shared.animation(url, size: size * displayScale)
        }
    }
}
