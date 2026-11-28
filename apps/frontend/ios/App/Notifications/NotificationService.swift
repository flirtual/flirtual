import ImageIO
import Intents
import UIKit
import UniformTypeIdentifiers
import UserNotifications

final class NotificationService: UNNotificationServiceExtension {
    private var contentHandler: ((UNNotificationContent) -> Void)?
    private var bestAttempt: UNMutableNotificationContent?
    private var task: Task<Void, Never>?

    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        self.contentHandler = contentHandler

        guard let content = request.content.mutableCopy() as? UNMutableNotificationContent else {
            return contentHandler(request.content)
        }
        bestAttempt = content

        task = Task {
            let delivered = await Self.enrich(content)
            guard !Task.isCancelled else { return }
            contentHandler(delivered)
        }
    }

    override func serviceExtensionTimeWillExpire() {
        task?.cancel()
        if let contentHandler, let bestAttempt { contentHandler(bestAttempt) }
    }

    private static func enrich(_ content: UNMutableNotificationContent) async -> UNNotificationContent {
        let info = content.userInfo
        guard let conversationId = info["conversation_id"] as? String,
              let sender = info["sender"] as? [String: Any],
              let senderId = sender["id"] as? String,
              let senderName = sender["name"] as? String
        else { return content }

        async let avatar = download(sender["avatar"] as? String, limit: 2_000_000)
        async let gif = attachment(info["gif"] as? String)

        if let gif = await gif { content.attachments = [gif] }

        let intent = messageIntent(
            conversationId: conversationId,
            senderId: senderId,
            senderName: senderName,
            avatar: await avatar,
            body: content.body
        )

        let interaction = INInteraction(intent: intent, response: nil)
        interaction.direction = .incoming
        try? await interaction.donate()

        do {
            if #available(iOS 18.0, *), let body = attributedBody(content.body) {
                let context = UNNotificationAttributedMessageContext(sendMessageIntent: intent, attributedContent: body)
                return try content.updating(from: context)
            }
            return try content.updating(from: intent)
        } catch {
            return content
        }
    }

    private static func messageIntent(
        conversationId: String,
        senderId: String,
        senderName: String,
        avatar: Data?,
        body: String
    ) -> INSendMessageIntent {
        let person = INPerson(
            personHandle: INPersonHandle(value: senderId, type: .unknown),
            nameComponents: nil,
            displayName: senderName,
            image: avatar.map { INImage(imageData: $0) },
            contactIdentifier: nil,
            customIdentifier: senderId
        )

        let intent = INSendMessageIntent(
            recipients: nil,
            outgoingMessageType: .outgoingMessageText,
            content: body,
            speakableGroupName: nil,
            conversationIdentifier: conversationId,
            serviceName: nil,
            sender: person,
            attachments: nil
        )
        if let image = person.image { intent.setImage(image, forParameterNamed: \.sender) }

        return intent
    }

    private static func download(_ string: String?, limit: Int) async -> Data? {
        guard let string, let url = URL(string: string), url.scheme == "https" else { return nil }

        var request = URLRequest(url: url)
        request.timeoutInterval = 10

        guard let (data, response) = try? await URLSession.shared.data(for: request),
              (response as? HTTPURLResponse)?.statusCode == 200,
              data.count <= limit
        else { return nil }

        return data
    }

    private static func attachment(_ string: String?) async -> UNNotificationAttachment? {
        guard let string, let url = URL(string: string), let host = url.host,
              host.range(of: #"^static\d*\.klipy\.com$"#, options: .regularExpression) != nil,
              let data = await download(string, limit: 10_000_000),
              let source = CGImageSourceCreateWithData(data as CFData, nil),
              let type = CGImageSourceGetType(source).flatMap({ UTType($0 as String) }),
              let fileExtension = type.preferredFilenameExtension
        else { return nil }

        let file = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString)
            .appendingPathExtension(fileExtension)

        do {
            try data.write(to: file)
            return try UNNotificationAttachment(
                identifier: "gif",
                url: file,
                options: [UNNotificationAttachmentOptionsTypeHintKey: type.identifier]
            )
        } catch {
            return nil
        }
    }

    @available(iOS 18.0, *)
    private static func attributedBody(_ body: String) -> NSAttributedString? {
        guard let pattern = try? NSRegularExpression(pattern: #":(\w{1,32}):"#) else { return nil }

        let text = body as NSString
        let result = NSMutableAttributedString()
        var offset = 0
        var replaced = false

        for match in pattern.matches(in: body, range: NSRange(location: 0, length: text.length)) {
            let name = text.substring(with: match.range(at: 1))
            guard let glyph = CustomEmoji.glyph(named: name) else { continue }

            result.append(NSAttributedString(string: text.substring(with: NSRange(location: offset, length: match.range.location - offset))))
            result.append(NSAttributedString(adaptiveImageGlyph: glyph, attributes: [:]))
            offset = match.range.location + match.range.length
            replaced = true
        }

        guard replaced else { return nil }

        result.append(NSAttributedString(string: text.substring(from: offset)))
        return result
    }
}

@available(iOS 18.0, *)
private enum CustomEmoji {
    private static let sizes = [40, 64, 96, 160, 320]
    private static let aliases = ["developer": "mascot-hardhat"]

    static func glyph(named name: String) -> NSAdaptiveImageGlyph? {
        guard let image = image(named: name), let data = glyphData(image, name: name) else { return nil }
        return NSAdaptiveImageGlyph(imageContent: data)
    }

    private static func image(named name: String) -> CGImage? {
        let file = aliases[name] ?? name
        let url = ["png", "gif"].lazy.compactMap { fileExtension in
            Bundle.main.url(forResource: file, withExtension: fileExtension, subdirectory: "emoji")
                ?? Bundle.main.url(forResource: file, withExtension: fileExtension)
        }.first

        guard let url, let source = CGImageSourceCreateWithURL(url as CFURL, nil) else { return nil }
        return CGImageSourceCreateImageAtIndex(source, 0, nil)
    }

    private static func glyphData(_ image: CGImage, name: String) -> Data? {
        let data = NSMutableData()
        guard let destination = CGImageDestinationCreateWithData(data, UTType.heic.identifier as CFString, sizes.count, nil) else { return nil }

        let properties = [
            kCGImagePropertyTIFFDictionary: [
                kCGImagePropertyTIFFDocumentName: "flirtual.emoji.\(name)",
                kCGImagePropertyTIFFImageDescription: name
            ]
        ] as CFDictionary

        for size in sizes {
            guard let strike = resized(image, to: size) else { return nil }
            CGImageDestinationAddImage(destination, strike, properties)
        }

        return CGImageDestinationFinalize(destination) ? data as Data : nil
    }

    private static func resized(_ image: CGImage, to size: Int) -> CGImage? {
        guard let context = CGContext(
            data: nil,
            width: size,
            height: size,
            bitsPerComponent: 8,
            bytesPerRow: 0,
            space: CGColorSpace(name: CGColorSpace.sRGB) ?? CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else { return nil }

        context.interpolationQuality = .high
        let scale = min(CGFloat(size) / CGFloat(image.width), CGFloat(size) / CGFloat(image.height))
        let width = CGFloat(image.width) * scale
        let height = CGFloat(image.height) * scale
        context.draw(image, in: CGRect(x: (CGFloat(size) - width) / 2, y: (CGFloat(size) - height) / 2, width: width, height: height))

        return context.makeImage()
    }
}
