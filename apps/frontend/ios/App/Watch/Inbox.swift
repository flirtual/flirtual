import Foundation
import Observation

@MainActor
@Observable
final class Inbox {
    static let shared = Inbox()

    private(set) var conversations: [Conversation]?
    private(set) var error: String?

    func load() async {
        guard let api = Account.shared.api else { return }

        do {
            let conversations = try await api.conversations().data
            await withTaskGroup(of: Void.self) { group in
                for id in Set(conversations.map(\.userId)) {
                    group.addTask { _ = try? await Users.shared.get(id) }
                }
            }
            self.conversations = conversations
            error = nil
        } catch {
            if conversations == nil, !API.isCancellation(error) { self.error = Browse.message(for: error) }
        }
    }

    func didRead(_ conversationId: String) {
        guard conversations?.contains(where: { $0.id == conversationId && $0.isUnread }) == true else { return }
        Task { await load() }
    }
}

@MainActor
@Observable
final class Chat {
    let conversationId: String

    private(set) var messages: [Message]?
    private(set) var error: String?
    private(set) var sending: [String] = []

    init(conversationId: String) {
        self.conversationId = conversationId
    }

    func load() async {
        guard let api = Account.shared.api else { return }

        do {
            let messages = try await api.messages(conversationId)
            let unread = messages.contains { $0.viewed == false }
            self.messages = messages.reversed()
            error = nil

            if unread {
                try? await api.markRead(conversationId)
                Inbox.shared.didRead(conversationId)
            }
        } catch {
            if messages == nil, !API.isCancellation(error) { self.error = Browse.message(for: error) }
        }
    }

    func send(_ text: String) async -> Bool {
        let text = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, let api = Account.shared.api else { return true }

        sending.append(text)
        defer { sending.firstIndex(of: text).map { _ = sending.remove(at: $0) } }

        do {
            try await api.send(text, to: conversationId)
            await load()
            return true
        } catch {
            return false
        }
    }
}
