import SwiftUI

struct LikedYouBanner: View {
    let user: User
    let kind: Mode

    var body: some View {
        HStack(spacing: 6) {
            Image(kind.icon)
                .resizable()
                .scaledToFit()
                .frame(width: 18, height: 18)
            Text(t("profile_responded_to_you", ["status": kind == .love ? "liked" : "homied", "name": user.name]))
                .font(.footnote.weight(.semibold))
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(kind.gradient, in: RoundedRectangle(cornerRadius: 12))
    }
}

struct ConnectionList: View {
    let user: User

    var body: some View {
        let discord = nonEmpty(user.connection("discord")?.displayName) ?? nonEmpty(user.profile.discord)
        let vrchat = nonEmpty(user.profile.vrchatName)
        let meta = nonEmpty(user.connection("meta")?.displayName)

        if discord != nil || vrchat != nil || meta != nil {
            VStack(alignment: .leading, spacing: 6) {
                if let discord {
                    row("discord", t("discord_username", ["name": discord]))
                }
                if let vrchat {
                    row("vrchat", t("vrchat_username", ["name": vrchat]))
                }
                if let meta {
                    row("meta", t("meta_username", ["name": meta]))
                }
            }
        }
    }

    private func row(_ icon: String, _ text: String) -> some View {
        HStack(spacing: 6) {
            Image(icon)
                .resizable()
                .scaledToFit()
                .frame(width: 18, height: 18)
            Text(text)
                .font(.footnote)
        }
    }

    private func nonEmpty(_ value: String?) -> String? {
        value?.isEmpty == false ? value : nil
    }
}

struct UnmatchButton: View {
    let user: User
    let onUnmatch: () async -> Void

    @State private var busy = false
    @State private var failed = false

    var body: some View {
        Button(t("unmatch"), systemImage: "person.crop.circle.badge.xmark") {
            Task { await unmatch() }
        }
        .disabled(busy)
        .alert(t("watch.something_went_wrong"), isPresented: $failed) {}
    }

    private func unmatch() async {
        guard let api = Account.shared.api else { return }
        busy = true
        defer { busy = false }

        do {
            try await api.unmatch(user.id)
            await Users.shared.loadRelationship(user.id, refresh: true)
            await onUnmatch()
        } catch {
            if !API.isCancellation(error) { failed = true }
        }
    }
}

struct RespondingProfileView: View {
    let user: User
    let mode: Mode
    var source: String?
    var offersResponses = true
    var onUnmatch: (() async -> Void)?
    let onReport: () async -> Void
    let onBlock: () async -> Void
    let onResponded: () async -> Void

    @State private var busy = false
    @State private var match: Match?
    @State private var notice: String?

    var body: some View {
        ProfileView(
            user: user,
            mode: mode,
            clearsBottomBar: offersResponses,
            onUnmatch: onUnmatch,
            onReport: onReport,
            onBlock: onBlock
        )
        .toolbar {
            ToolbarItemGroup(placement: .bottomBar) {
                if offersResponses {
                    Button {
                        Task { await respond("pass", .love) }
                    } label: {
                        ToolbarIcon(image: Image(systemName: "xmark"))
                    }
                    .tint(.gray)
                    .buttonBorderShape(.circle)
                    .accessibilityLabel(t("pass"))

                    Spacer()

                    Button {
                        Task { await respond("like", .love) }
                    } label: {
                        ToolbarIcon(image: Image(Mode.love.icon), size: .assetIconSize)
                    }
                    .tint(Mode.love.tint)
                    .buttonBorderShape(.circle)
                    .accessibilityLabel(t("like"))

                    if Features.homieMode {
                        Spacer()

                        Button {
                            Task { await respond("like", .friend) }
                        } label: {
                            ToolbarIcon(image: Image(Mode.friend.icon), size: .assetIconSize)
                        }
                        .tint(Mode.friend.tint)
                        .buttonBorderShape(.circle)
                        .accessibilityLabel(t("homie"))
                    }
                }
            }
        }
        .disabled(busy)
        .sheet(item: $match, onDismiss: { Task { await onResponded() } }) { match in
            MatchView(user: match.user, kind: match.kind)
        }
        .alert(
            notice ?? "",
            isPresented: Binding(get: { notice != nil }, set: { if !$0 { notice = nil } })
        ) {}
    }

    private func respond(_ type: String, _ kind: Mode) async {
        guard let api = Account.shared.api, !busy else { return }
        busy = true
        defer { busy = false }

        do {
            let response = try await api.respond(type, to: user.id, mode: kind, source: source)
            if response.match {
                match = Match(user: user, kind: response.matchKind ?? kind)
                Task { await Inbox.shared.load() }
            } else {
                await onResponded()
            }
        } catch let issue as Issue where issue.error == "already_responded" {
            await onResponded()
        } catch {
            if !API.isCancellation(error) { notice = Browse.message(for: error) }
        }
    }
}
