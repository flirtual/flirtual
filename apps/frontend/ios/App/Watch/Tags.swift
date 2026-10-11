import SwiftUI

struct TagGroup: Identifiable {
    let id: String
    let tags: [Tag]
}

// The web profile's pill collection, in the same order: relationships, sexualities, personality,
// interests, games, dom/sub, monopoly, kinks, languages, platforms. Tags you share are marked.
struct Tag: Identifiable {
    let id: String
    let name: String
    let shared: Bool

    @MainActor
    static func groups(for user: User, me: User?) -> [TagGroup] {
        let profile = user.profile
        let mine = me?.profile
        let other = me?.id != user.id
        let nsfw = me?.preferences?.nsfw ?? false
        let t = Translations.shared

        func attributes(_ type: String, mine: [String]? = nil) -> [Tag] {
            profile.attributes(type).compactMap { id in
                guard let name = t.attribute(type, id) else { return nil }
                return Tag(id: "\(type):\(id)", name: name, shared: other && (mine ?? []).contains(id))
            }
        }

        var groups: [TagGroup] = []
        func add(_ id: String, _ tags: [Tag]) {
            if !tags.isEmpty { groups.append(TagGroup(id: id, tags: tags)) }
        }

        let relationshipOrder = ["serious", "vr", "hookups", "friends"]
        add("relationship", profile.relationships
            .sorted { (relationshipOrder.firstIndex(of: $0) ?? .max) < (relationshipOrder.firstIndex(of: $1) ?? .max) }
            .map { Tag(id: "relationship:\($0)", name: t.attribute("relationship", $0) ?? $0, shared: other && mine?.relationships.contains($0) == true) })

        add("sexuality", attributes("sexuality", mine: mine?.attributes("sexuality")))

        let personality = personalityLabels(profile)
        let myPersonality = mine.map(personalityLabels) ?? []
        add("personality", personality.map { Tag(id: "personality:\($0)", name: t.message($0) ?? $0, shared: other && myPersonality.contains($0)) })

        let myCustom = Set((mine?.customInterests ?? []).map(normalize))
        let interests = attributes("interest", mine: mine?.attributes("interest"))
            .sorted { $0.name.localizedCompare($1.name) == .orderedAscending }
            + profile.customInterests.map { Tag(id: "custom:\($0)", name: $0, shared: other && myCustom.contains(normalize($0))) }
        add("interest", interests.filter(\.shared) + interests.filter { !$0.shared })

        add("game", attributes("game", mine: mine?.attributes("game")))

        if nsfw, let domsub = profile.domsub {
            let match = Set([domsub, mine?.domsub ?? ""])
            let shared = (domsub == "switch" && mine?.domsub == "switch") || match == ["dominant", "submissive"]
            add("domsub", [Tag(id: "domsub", name: t.message(domsub) ?? domsub, shared: other && shared)])
        }

        if let monopoly = profile.monopoly {
            add("monopoly", [Tag(id: "monopoly", name: t.message(monopoly) ?? monopoly, shared: other && mine?.monopoly == monopoly)])
        }

        if nsfw {
            add("kink", attributes("kink"))
        }

        add("language", profile.languages.map { code in
            Tag(
                id: "language:\(code)",
                name: t.attribute("language", code) ?? Locale.current.localizedString(forIdentifier: code) ?? code,
                shared: other && mine?.languages.contains(code) == true
            )
        })

        add("platform", attributes("platform", mine: mine?.attributes("platform")))
        return groups
    }

    private static func personalityLabels(_ profile: Profile) -> [String] {
        guard let openness = profile.openness, openness != 0,
              let conscientiousness = profile.conscientiousness, conscientiousness != 0,
              let agreeableness = profile.agreeableness, agreeableness != 0 else { return [] }

        return [
            openness > 0 ? "open_minded" : "practical",
            conscientiousness > 0 ? "reliable" : "free_spirited",
            agreeableness > 0 ? "friendly" : "straightforward"
        ]
    }

    private static func normalize(_ value: String) -> String {
        value.lowercased().filter { $0.isLetter || $0.isNumber }
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 4
    var lineSpacing: CGFloat?

    private var rowSpacing: CGFloat { lineSpacing ?? spacing }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let rows = rows(for: subviews, width: proposal.width ?? .infinity)
        let height = rows.map(\.height).reduce(0, +) + rowSpacing * CGFloat(max(rows.count - 1, 0))
        let width = rows.map(\.width).max() ?? 0
        return CGSize(width: proposal.width ?? width, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var y = bounds.minY
        for row in rows(for: subviews, width: bounds.width) {
            var x = bounds.minX
            for (index, size) in row.items {
                subviews[index].place(at: CGPoint(x: x, y: y + (row.height - size.height) / 2), proposal: ProposedViewSize(size))
                x += size.width + spacing
            }
            y += row.height + rowSpacing
        }
    }

    private struct Row {
        var items: [(Int, CGSize)] = []
        var width: CGFloat = 0
        var height: CGFloat = 0
    }

    private func rows(for subviews: Subviews, width: CGFloat) -> [Row] {
        var rows: [Row] = []
        var row = Row()

        for index in subviews.indices {
            let size = subviews[index].sizeThatFits(ProposedViewSize(width: width, height: nil))
            if !row.items.isEmpty, row.width + spacing + size.width > width {
                rows.append(row)
                row = Row()
            }
            row.width += (row.items.isEmpty ? 0 : spacing) + size.width
            row.height = max(row.height, size.height)
            row.items.append((index, size))
        }

        if !row.items.isEmpty { rows.append(row) }
        return rows
    }
}
