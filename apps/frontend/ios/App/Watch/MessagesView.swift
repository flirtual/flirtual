import SwiftUI
import UIKit

struct ConversationRoute: Hashable {
    let id: String
    let userId: String?
}

struct MessagesView: View {
    private let inbox = Inbox.shared

    var body: some View {
        content
            .navigationTitle(t("matches"))
            .toolbarForegroundStyle(.white, for: .navigationBar)
            .containerBackground(Mode.love.gradient.opacity(0.4), for: .tabView)
        .task {
            while !Task.isCancelled {
                await inbox.load()
                try? await Task.sleep(for: .seconds(30))
            }
        }
    }

    @ViewBuilder
    private var content: some View {
        if let conversations = inbox.conversations {
            if conversations.isEmpty {
                StatusMessage(
                    systemImage: "bubble.left.and.bubble.right",
                    title: t("watch.no_matches_title"),
                    detail: t("watch.no_matches_detail")
                )
            } else {
                List(conversations) { conversation in
                    NavigationLink(value: ConversationRoute(id: conversation.id, userId: conversation.userId)) {
                        ConversationRow(conversation: conversation, user: Users.shared.users[conversation.userId])
                    }
                }
                .refreshable { await inbox.load() }
            }
        } else if let error = inbox.error {
            StatusMessage(systemImage: "exclamationmark.triangle", title: t("watch.messages_failed"), detail: error) {
                Task { await inbox.load() }
            }
        } else {
            ProgressView()
        }
    }
}

struct ConversationRow: View {
    let conversation: Conversation
    let user: User?

    var body: some View {
        HStack(spacing: 8) {
            Avatar(url: user?.profile.images.first.flatMap { Account.shared.api?.imageURL($0, variant: "icon") }, size: 32)

            VStack(alignment: .leading, spacing: 0) {
                Text(user?.name ?? "")
                    .font(.headline)
                    .lineLimit(1)
                Text(summary)
                    .font(.footnote)
                    .fontWeight(conversation.isUnread ? .semibold : .regular)
                    .foregroundStyle(conversation.isUnread ? .primary : .secondary)
                    .lineLimit(2)
            }
            // Every row is as tall as one with a two-line preview, with shorter previews centred.
            .frame(maxWidth: .infinity, minHeight: Self.textHeight, alignment: .leading)

            Image(conversation.kind.icon)
                .resizable()
                .scaledToFit()
                .frame(width: 14, height: 14)
                .foregroundStyle(conversation.kind.tint)
                .accessibilityLabel(t(conversation.kind == .love ? "watch.match" : "homie"))
        }
        .padding(.vertical, 6)
        .accessibilityValue(conversation.isUnread ? t("watch.unread") : "")
    }

    private static var textHeight: CGFloat {
        UIFont.preferredFont(forTextStyle: .headline).lineHeight + 2 * UIFont.preferredFont(forTextStyle: .footnote).lineHeight
    }

    private var summary: String {
        guard let message = conversation.lastMessage, !message.system, let content = message.content else {
            return t("its_a_match")
        }
        return message.senderId == Account.shared.user?.id ? t("level_orange_stingray_fulfill", ["message": content]) : content
    }
}

struct ChatView: View {
    let route: ConversationRoute

    @State private var chat: Chat
    @State private var user: User?
    @State private var failed = false

    private var kind: Mode {
        Inbox.shared.conversations?.first { $0.id == route.id }?.kind ?? .love
    }

    init(route: ConversationRoute) {
        self.route = route
        _chat = State(initialValue: Chat(conversationId: route.id))
    }

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 6) {
                    if let messages = chat.messages {
                        ForEach(messages) { message in
                            MessageBubble(message: message)
                        }
                        ForEach(Array(chat.sending.enumerated()), id: \.offset) { _, text in
                            Bubble(text: text, mine: true)
                                .opacity(0.6)
                        }
                    } else if let error = chat.error {
                        Text(error)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    } else {
                        ProgressView()
                    }

                    if failed {
                        Text(t("watch.send_failed"))
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }

                    TextFieldLink(prompt: Text(t("message"))) {
                        Label(t("watch.reply"), systemImage: "arrowshape.turn.up.left.fill")
                    } onSubmit: { text in
                        Task { failed = !(await chat.send(text)) }
                    }
                    .padding(.top, 4)
                    .id("reply")

                    if let user {
                        NavigationLink {
                            ProfileView(user: user, mode: kind, clearsBottomBar: false, onReport: {}) {
                                Router.shared.path.removeAll()
                                await Inbox.shared.load()
                            }
                        } label: {
                            Label(t("watch.view_profile"), systemImage: "person.crop.circle")
                        }
                        .padding(.top, 16)
                    }
                }
                .padding(.horizontal, .margin)
            }
            .defaultScrollAnchor(.bottom)
            .onChange(of: chat.messages?.last?.id) {
                proxy.scrollTo("reply", anchor: .bottom)
            }
        }
        .navigationTitle(user?.name ?? "")
        .task {
            if let userId = route.userId ?? Inbox.shared.conversations?.first(where: { $0.id == route.id })?.userId {
                user = try? await Users.shared.get(userId)
            }
        }
        .task {
            while !Task.isCancelled {
                await chat.load()
                try? await Task.sleep(for: .seconds(5))
            }
        }
    }
}

struct MessageBubble: View {
    let message: Message

    var body: some View {
        if message.system {
            Text(message.content ?? "")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
        } else {
            Bubble(text: message.content ?? "", mine: message.senderId == Account.shared.user?.id)
        }
    }
}

struct Bubble: View {
    let text: String
    let mine: Bool

    var body: some View {
        Text(text)
            .font(.footnote)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(
                mine ? AnyShapeStyle(Mode.love.gradient) : AnyShapeStyle(.quaternary),
                in: RoundedRectangle(cornerRadius: 14)
            )
            .frame(maxWidth: .infinity, alignment: mine ? .trailing : .leading)
            .padding(mine ? .leading : .trailing, 16)
    }
}
