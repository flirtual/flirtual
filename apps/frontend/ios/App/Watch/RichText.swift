import SwiftUI

// Renders biographies from the web editor. The API sanitizes them to the same tags and styles as
// html.ts: a, b, blockquote, br, em, hr, h3, li, p, span, strong, ul, ol, u, with color,
// background-color and text-align.
struct RichText: View {
    let blocks: [RichBlock]

    init(html: String) {
        blocks = RichBlock.parse(html)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            ForEach(Array(blocks.enumerated()), id: \.offset) { _, block in
                view(for: block)
            }
        }
    }

    @ViewBuilder
    private func view(for block: RichBlock) -> some View {
        switch block.kind {
        case .blank:
            Color.clear.frame(height: 4)
        case .rule:
            Divider()
        case .heading:
            aligned(Text(block.text).font(.headline), block.alignment)
        case .paragraph:
            aligned(Text(block.text).font(.footnote), block.alignment)
        case .quote:
            aligned(Text(block.text).font(.footnote), block.alignment)
                .padding(.leading, 8)
                .overlay(alignment: .leading) {
                    Capsule().fill(.secondary).frame(width: 2)
                }
        case let .item(marker, depth):
            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(marker)
                Text(block.text)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .font(.footnote)
            .padding(.leading, CGFloat(depth) * 10)
        }
    }

    private func aligned(_ text: some View, _ alignment: TextAlignment) -> some View {
        text
            .multilineTextAlignment(alignment)
            .frame(maxWidth: .infinity, alignment: alignment == .center ? .center : alignment == .trailing ? .trailing : .leading)
    }
}

struct RichBlock {
    enum Kind {
        case paragraph
        case heading
        case quote
        case item(marker: String, depth: Int)
        case rule
        case blank
    }

    var kind: Kind
    var alignment: TextAlignment = .leading
    var text = AttributedString()

    private struct Style {
        var bold = false
        var italic = false
        var underline = false
        var color: Color?
        var background: Color?
    }

    private struct List {
        let ordered: Bool
        var count = 0
    }

    // Palette colors that are illegible on a dark background, and the light ones that need dark
    // text over them. Mirrors markLowContrastColors in html.ts for the dark theme.
    private static let darkPalette: Set<String> = ["#444444", "#72142c", "#754f00", "#2b4509", "#0a3738", "#250e49"]
    private static let lightPalette: Set<String> = ["#ffffff", "#f5c6d2", "#ffe8b7", "#ddf6bc", "#beeff1", "#d5c2f3"]

    private static let tag = #/<(\/?)([a-zA-Z0-9]+)([^>]*)>/#

    static func parse(_ html: String) -> [RichBlock] {
        var blocks: [RichBlock] = []
        var current: RichBlock?
        var styles = [Style()]
        var lists: [List] = []
        var tags: [String] = []

        func flush() {
            guard let block = current else { return }
            current = nil
            let text = String(block.text.characters).trimmingCharacters(in: .whitespacesAndNewlines)
            if text.isEmpty {
                if case .item = block.kind { return }
                if case .blank = blocks.last?.kind { return }
                blocks.append(RichBlock(kind: .blank))
            } else {
                blocks.append(block)
            }
        }

        func append(_ string: String) {
            if current == nil { current = RichBlock(kind: .paragraph) }

            let style = styles.last!
            var run = AttributedString(string)
            var intent: InlinePresentationIntent = []
            if style.bold { intent.insert(.stronglyEmphasized) }
            if style.italic { intent.insert(.emphasized) }
            if !intent.isEmpty { run.inlinePresentationIntent = intent }
            if style.underline { run.underlineStyle = .single }
            if let color = style.color { run.foregroundColor = color }
            if let background = style.background { run.backgroundColor = background }
            current!.text += run
        }

        var index = html.startIndex
        for match in html.matches(of: tag) {
            let text = decode(String(html[index..<match.range.lowerBound]))
            if !text.isEmpty, !(current == nil && text.allSatisfy(\.isWhitespace)) {
                append(text)
            }
            index = match.range.upperBound

            let closing = !match.output.1.isEmpty
            let name = match.output.2.lowercased()
            let attributes = String(match.output.3)

            if closing {
                guard let open = tags.lastIndex(of: name) else { continue }
                tags.removeSubrange(open...)
                styles.removeSubrange((open + 1)...)

                switch name {
                case "p", "h3", "li", "blockquote": flush()
                case "ul", "ol": if !lists.isEmpty { lists.removeLast() }
                default: break
                }
                continue
            }

            switch name {
            case "br":
                if current == nil { current = RichBlock(kind: .paragraph) } else { append("\n") }
                continue
            case "hr":
                flush()
                blocks.append(RichBlock(kind: .rule))
                continue
            default:
                break
            }

            let css = Self.css(attributes)
            var style = styles.last!
            switch name {
            case "b", "strong": style.bold = true
            case "em": style.italic = true
            case "u", "a": style.underline = true
            case "h3": style.bold = true
            default: break
            }

            let color = css["color"]?.lowercased()
            let background = css["background-color"]?.lowercased()
            if let color { style.color = Color(css: color) }
            if let background { style.background = Color(css: background) }
            if let color, background == nil, darkPalette.contains(color) {
                style.background = .white
            } else if let background, color == nil, lightPalette.contains(background) {
                style.color = .black
            }

            tags.append(name)
            styles.append(style)

            switch name {
            case "p", "h3", "blockquote", "li":
                flush()
                var block = RichBlock(kind: .paragraph)
                switch name {
                case "h3": block.kind = .heading
                case "blockquote": block.kind = .quote
                case "li":
                    if lists.isEmpty { lists.append(List(ordered: false)) }
                    lists[lists.count - 1].count += 1
                    let list = lists[lists.count - 1]
                    block.kind = .item(marker: list.ordered ? "\(list.count)." : "•", depth: lists.count - 1)
                default: break
                }
                switch css["text-align"] {
                case "center": block.alignment = .center
                case "right": block.alignment = .trailing
                default: break
                }
                current = block
            case "ul", "ol":
                flush()
                lists.append(List(ordered: name == "ol"))
            default:
                break
            }
        }

        let rest = decode(String(html[index...]))
        if !rest.allSatisfy(\.isWhitespace) { append(rest) }
        flush()

        while case .blank = blocks.first?.kind { blocks.removeFirst() }
        while case .blank = blocks.last?.kind { blocks.removeLast() }
        return blocks
    }

    private static func css(_ attributes: String) -> [String: String] {
        guard let style = attributes.firstMatch(of: #/style\s*=\s*"([^"]*)"/#)?.output.1 else { return [:] }
        var properties: [String: String] = [:]
        for declaration in style.split(separator: ";") {
            let parts = declaration.split(separator: ":", maxSplits: 1)
            guard parts.count == 2 else { continue }
            properties[parts[0].trimmingCharacters(in: .whitespaces).lowercased()] = parts[1].trimmingCharacters(in: .whitespaces)
        }
        return properties
    }

    private static func decode(_ text: String) -> String {
        var text = text.replacingOccurrences(of: "\n", with: " ")
        for (entity, character) in ["&nbsp;": " ", "&lt;": "<", "&gt;": ">", "&quot;": "\"", "&#39;": "'", "&apos;": "'", "&amp;": "&"] {
            text = text.replacingOccurrences(of: entity, with: character)
        }
        return text
    }
}

private extension Color {
    init?(css value: String) {
        if let match = value.wholeMatch(of: #/#([0-9a-fA-F]{6})/#), let hex = UInt32(match.output.1, radix: 16) {
            self.init(hex: hex)
        } else if let match = value.wholeMatch(of: #/rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/#),
                  let red = Double(match.output.1), let green = Double(match.output.2), let blue = Double(match.output.3) {
            self.init(red: red / 255, green: green / 255, blue: blue / 255)
        } else {
            return nil
        }
    }
}
