import SwiftUI

struct BrowseView: View {
    @AppStorage("mode") private var mode = Mode.love
    @State private var stores = [Mode.love: Browse(mode: .love), Mode.friend: Browse(mode: .friend)]

    private var browse: Browse { stores[mode]! }

    var body: some View {
        @Bindable var browse = browse

        content
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        mode = mode.other
                    } label: {
                        ToolbarIcon(image: Image(mode.other.icon), size: .assetIconSize)
                    }
                    .accessibilityLabel(t(mode == .love ? "watch.switch_to_homie_mode" : "watch.switch_to_date_mode"))
                }
                ToolbarItemGroup(placement: .bottomBar) {
                    if browse.current != nil {
                        Button {
                            Task { await browse.respond("pass") }
                        } label: {
                            ToolbarIcon(image: Image(systemName: "xmark"))
                        }
                        .tint(.gray)
                        .buttonBorderShape(.circle)
                        .accessibilityLabel(t("pass"))

                        Spacer()

                        Button {
                            Task { await browse.respond("like") }
                        } label: {
                            ToolbarIcon(image: Image(mode.icon), size: .assetIconSize)
                        }
                        .tint(mode.tint)
                        .buttonBorderShape(.circle)
                        .accessibilityLabel(t(mode == .love ? "like" : "homie"))
                    }
                }
            }
            .disabled(browse.busy)
            .containerBackground(mode.gradient.opacity(0.4), for: .tabView)
            .task(id: mode) {
                if case .loading = browse.phase { await browse.load() }
            }
            .sheet(item: $browse.match) { match in
                MatchView(user: match.user, kind: match.kind)
            }
            .alert(
                browse.notice ?? "",
                isPresented: Binding(get: { browse.notice != nil }, set: { if !$0 { browse.notice = nil } })
            ) {}
    }

    @ViewBuilder
    private var content: some View {
        switch browse.phase {
        case .loading:
            ProgressView()
        case .pending:
            VStack(spacing: 8) {
                ProgressView()
                Text(t("watch.finding_profiles"))
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        case .empty:
            StatusMessage(
                systemImage: "sparkles",
                title: t("watch.queue_empty_title"),
                detail: t("watch.queue_empty_detail")
            ) {
                Task { await browse.load() }
            }
        case let .failed(message):
            StatusMessage(systemImage: "exclamationmark.triangle", title: t("watch.profiles_failed"), detail: message) {
                Task { await browse.load() }
            }
        case let .ready(user):
            let remove = { for store in stores.values { await store.remove(user.id) } }
            ProfileView(user: user, mode: mode, onReport: remove, onBlock: remove)
                .id(user.id)
        }
    }
}

struct ProfileView: View {
    let user: User
    let mode: Mode
    var clearsBottomBar = true
    let onReport: () async -> Void
    let onBlock: () async -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                PhotoCarousel(user: user)
                    .containerRelativeFrame(.vertical)

                VStack(alignment: .leading, spacing: 14) {
                    if let biography = user.profile.biography, !biography.isEmpty {
                        RichText(html: biography)
                    }

                    ForEach(user.profile.prompts, id: \.promptId) { prompt in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(Translations.shared.attribute("prompt", prompt.promptId) ?? "")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                            Text(prompt.response)
                                .font(.footnote)
                        }
                    }

                    ForEach(Tag.groups(for: user, me: Account.shared.user)) { group in
                        FlowLayout(spacing: 4) {
                            ForEach(group.tags) { tag in
                                Text(tag.name)
                                    .font(.caption2)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(
                                        tag.shared ? AnyShapeStyle(mode.gradient) : AnyShapeStyle(.quaternary),
                                        in: Capsule()
                                    )
                            }
                        }
                    }

                    SafetyButtons(user: user, onReport: onReport, onBlock: onBlock)
                        .padding(.top, 8)
                }
                .padding(.horizontal, .margin)
                .padding(.bottom, (clearsBottomBar ? .buttonClearance : 0) + 16)
            }
        }
        .contentMargins(.horizontal, 0, for: .scrollContent)
        .ignoresSafeArea()
        .hidingTopScrollEdge()
    }
}

struct PhotoCarousel: View {
    static let photoSize: CGFloat = 600

    let user: User
    @State private var index = 0

    var body: some View {
        let images = user.profile.images

        ZStack(alignment: .bottomLeading) {
            Color.black
            if images.indices.contains(index) {
                RemoteImage(url: Self.url(images[index]), size: Self.photoSize)
                    .id(images[index].id)
            }

            VStack(spacing: 0) {
                LinearGradient(colors: [.black.opacity(0.45), .clear], startPoint: .top, endPoint: .bottom)
                    .frame(height: 36)
                Spacer()
                LinearGradient(colors: [.clear, .black.opacity(0.75)], startPoint: .top, endPoint: .bottom)
                    .frame(height: 140)
            }

            if images.count > 1 {
                HStack(spacing: 3) {
                    ForEach(images.indices, id: \.self) { offset in
                        Capsule()
                            .fill(.white.opacity(offset == index ? 1 : 0.4))
                            .frame(height: 3)
                    }
                }
                // Clears the display's rounded corners.
                .padding(.horizontal, 40)
                .padding(.top, 4)
                .frame(maxHeight: .infinity, alignment: .top)
            }

            VStack(alignment: .leading, spacing: 0) {
                Text(user.name)
                    .font(.title3.bold())
                    .lineLimit(2)

                summary
                status
            }
            .foregroundStyle(.white)
            .padding(.horizontal, .margin)
            .padding(.bottom, 10)
        }
        .clipped()
        .contentShape(Rectangle())
        .onTapGesture(perform: next)
        .task(id: index) { await preloadNext() }
        .accessibilityElement(children: .combine)
        .accessibilityAction(named: t("watch.next_photo"), next)
    }

    @ViewBuilder
    private var summary: some View {
        let flag = user.profile.country.flatMap(Self.flag)
        let genders = Users.shared.genderTags(of: user).compactMap { Translations.shared.attribute("gender", $0) }

        // Separate items so wrapped lines break between them, joined by dots and commas.
        let items: [String] = {
            var items: [String] = []
            if let age = user.age { items.append(age.formatted()) }
            for (offset, gender) in genders.enumerated() {
                let text = offset < genders.count - 1 ? "\(gender)," : gender
                items.append(offset == 0 && !items.isEmpty ? "· \(text)" : text)
            }
            if flag != nil, !items.isEmpty { items[0] = "· \(items[0])" }
            return items
        }()

        if flag != nil || !items.isEmpty {
            FlowLayout(spacing: 4, lineSpacing: -3) {
                if let flag {
                    Text(flag)
                        .font(.body)
                }
                ForEach(Array(items.enumerated()), id: \.offset) { _, item in
                    Text(item)
                }
            }
            .font(.footnote)
        }
    }

    // Mirrors the web profile's activity, distance and time difference row.
    @ViewBuilder
    private var status: some View {
        let relationship = Users.shared.relationships[user.id]
        let activity = user.activeAt.flatMap(Self.activity)
        let distance = relationship?.distance
        let timeDiff = relationship?.timeDiff.map(Self.timeDiff)

        if activity != nil || distance != nil || timeDiff != nil {
            FlowLayout(spacing: 8, lineSpacing: -3) {
                if let activity {
                    HStack(spacing: 3) {
                        Circle()
                            .fill(.green)
                            .frame(width: 7, height: 7)
                        Text(activity)
                    }
                }
                if let distance {
                    Label(distance, systemImage: "mappin")
                        .labelStyle(StatusLabelStyle())
                }
                if let timeDiff {
                    Label(timeDiff, systemImage: "clock")
                        .labelStyle(StatusLabelStyle())
                }
            }
            .font(.footnote)
            .lineLimit(1)
        }
    }

    // The web's "Active today" and "Active recently" don't fit beside the distance on a watch.
    private static func activity(_ activeAt: Date) -> String? {
        let elapsed = Date.now.timeIntervalSince(activeAt)
        return elapsed > 14 * 86_400 ? nil : t("watch.active")
    }

    private static func timeDiff(_ seconds: Int) -> String {
        let sign = seconds < 0 ? "-" : "+"
        let hours = abs(seconds) / 3600
        let minutes = abs(seconds) % 3600 / 60
        let key = minutes > 0 ? "time_diff_hm" : "time_diff_h"
        return t(key, ["sign": sign, "hours": String(hours), "minutes": String(minutes)])
    }

    private func next() {
        let count = user.profile.images.count
        guard count > 1 else { return }
        index = (index + 1) % count
    }

    private func preloadNext() async {
        let images = user.profile.images
        guard images.count > 1, images.indices.contains(index) else { return }
        await Self.load(images[index])
        await Self.load(images[(index + 1) % images.count])
    }

    private static func url(_ image: ProfileImage) -> URL? {
        Account.shared.api?.imageURL(image)
    }

    static func load(_ image: ProfileImage) async {
        guard let url = url(image) else { return }
        _ = await ImageLoader.shared.image(url, size: photoSize)
    }

    private static func flag(_ country: String) -> String? {
        let letters = country.uppercased().unicodeScalars
        guard letters.count == 2, letters.allSatisfy({ ("A"..."Z").contains($0) }) else { return nil }
        return String(String.UnicodeScalarView(letters.compactMap { Unicode.Scalar(0x1F1E6 + $0.value - 65) }))
    }
}

extension View {
    // The system dims content under the clock, which hid the photo progress bar.
    @ViewBuilder
    func hidingTopScrollEdge() -> some View {
        if #available(watchOS 26.0, *) {
            scrollEdgeEffectHidden(true, for: .top)
        } else {
            self
        }
    }
}

struct ToolbarIcon: View {
    let image: Image
    var size: CGFloat = 18

    var body: some View {
        image
            .resizable()
            .scaledToFit()
            .fontWeight(.semibold)
            .foregroundStyle(.white)
            .frame(width: size, height: size)
    }
}

struct StatusLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: 2) {
            configuration.icon
                .imageScale(.small)
            configuration.title
        }
    }
}

struct MatchView: View {
    let user: User
    let kind: Mode

    @Environment(\.dismiss) private var dismiss
    @State private var sent: Bool?

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                Avatar(url: user.profile.images.first.flatMap { Account.shared.api?.imageURL($0, variant: "icon") }, size: 64)
                Text("\(t("its_a_match")) \(kind == .love ? "❤️" : "✌️")")
                    .font(.headline)
                Text(t("green_aqua_ibex_value", ["name": user.name]))
                    .font(.footnote)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)

                if sent == true {
                    Label(t("watch.sent"), systemImage: "checkmark")
                        .foregroundStyle(.secondary)
                } else if let me = Account.shared.user {
                    if sent == false {
                        Text(t("watch.match_send_failed"))
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                    }

                    TextFieldLink(prompt: Text(t("watch.say_hi"))) {
                        Label(t("message"), systemImage: "message.fill")
                    } onSubmit: { text in
                        Task { sent = await send(text, from: me) }
                    }
                }

                Button(t("continue_browsing")) { dismiss() }
            }
            .padding(.horizontal, .margin)
        }
        .containerBackground(kind.gradient, for: .navigation)
    }

    // The conversation is created just after the match, so the first message can beat it there.
    private func send(_ text: String, from me: User) async -> Bool {
        guard let api = Account.shared.api else { return false }
        let conversationId = API.conversationId(me.id, user.id)

        for attempt in 0..<3 {
            if attempt > 0 { try? await Task.sleep(for: .seconds(2)) }
            if (try? await api.send(text, to: conversationId)) != nil { return true }
        }
        return false
    }
}

struct StatusMessage: View {
    let systemImage: String
    let title: String
    let detail: String
    var retry: (() -> Void)?

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                Image(systemName: systemImage)
                    .font(.title2)
                Text(title)
                    .font(.headline)
                    .multilineTextAlignment(.center)
                Text(detail)
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                if let retry {
                    Button(t("try_again"), action: retry)
                        .padding(.top, 4)
                }
            }
            .padding(.horizontal, .margin)
        }
    }
}
