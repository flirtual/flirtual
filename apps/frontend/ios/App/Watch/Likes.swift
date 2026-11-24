import SwiftUI

@MainActor
@Observable
final class Likes {
    static let shared = Likes()

    private(set) var likes: [Like]?
    private(set) var error: String?
    private var next: String?
    private var loadingMore = false

    func load() async {
        guard let api = Account.shared.api else { return }

        do {
            let page = try await api.likes()
            await preload(page.data)
            likes = page.data
            next = page.metadata.next
            error = nil
        } catch {
            if likes == nil, !API.isCancellation(error) { self.error = Browse.message(for: error) }
        }
    }

    func loadMore() async {
        guard let api = Account.shared.api, let cursor = next, !loadingMore else { return }
        loadingMore = true
        defer { loadingMore = false }

        guard let page = try? await api.likes(cursor: cursor) else { return }
        await preload(page.data)
        let known = Set(likes?.map(\.id) ?? [])
        likes = (likes ?? []) + page.data.filter { !known.contains($0.id) }
        next = page.metadata.next
    }

    func remove(_ id: String) {
        likes?.removeAll { $0.id == id }
    }

    private func preload(_ likes: [Like]) async {
        await withTaskGroup(of: Void.self) { group in
            for id in Set(likes.map(\.profileId)) {
                group.addTask { _ = try? await Users.shared.get(id) }
            }
        }
    }
}

struct LikesView: View {
    private let store = Likes.shared

    var body: some View {
        content
            .navigationTitle(t("likes_you"))
            .toolbarForegroundStyle(.white, for: .navigationBar)
            .containerBackground(Mode.love.gradient.opacity(0.4), for: .tabView)
            .task { await store.load() }
    }

    @ViewBuilder
    private var content: some View {
        if let likes = store.likes {
            let loaded = likes.filter { Users.shared.users[$0.profileId] != nil }

            if loaded.isEmpty {
                StatusMessage(systemImage: "heart", title: t("no_likes_yet"), detail: t("no_likes_yet_description"))
            } else {
                List(loaded) { like in
                    if let user = Users.shared.users[like.profileId] {
                        NavigationLink {
                            LikeProfileView(user: user, like: like)
                        } label: {
                            LikeRow(like: like, user: user)
                        }
                        .onAppear {
                            if like.id == loaded.last?.id { Task { await store.loadMore() } }
                        }
                    }
                }
                .refreshable { await store.load() }
            }
        } else if let error = store.error {
            StatusMessage(systemImage: "exclamationmark.triangle", title: t("watch.profiles_failed"), detail: error) {
                Task { await store.load() }
            }
        } else {
            ProgressView()
        }
    }
}

struct LikeRow: View {
    let like: Like
    let user: User

    var body: some View {
        HStack(spacing: 8) {
            Avatar(url: user.profile.images.first.flatMap { Account.shared.api?.imageURL($0, variant: "icon") }, size: 32)

            VStack(alignment: .leading, spacing: 0) {
                Text(user.name)
                    .font(.headline)
                    .lineLimit(1)
                if !summary.isEmpty {
                    Text(summary)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Image(like.kind.icon)
                .resizable()
                .scaledToFit()
                .frame(width: 14, height: 14)
                .foregroundStyle(like.kind.tint)
                .accessibilityLabel(t(like.kind == .love ? "like" : "homie"))
        }
        .padding(.vertical, 6)
    }

    private var summary: String {
        [user.age.map { $0.formatted() }, user.profile.country.flatMap(PhotoCarousel.flag)]
            .compactMap { $0 }
            .joined(separator: " ")
    }
}

struct LikeProfileView: View {
    let user: User
    let like: Like

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        RespondingProfileView(user: user, mode: like.kind, source: "likes", onReport: leave, onBlock: leave, onResponded: leave)
            .task { await Users.shared.loadRelationship(user.id) }
    }

    private func leave() async {
        Likes.shared.remove(user.id)
        dismiss()
    }
}
