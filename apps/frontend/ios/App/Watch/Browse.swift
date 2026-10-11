import Foundation
import Observation

@MainActor
@Observable
final class Browse {
    enum Phase {
        case loading
        case ready(User)
        case pending
        case empty
        case failed(String)
    }

    let mode: Mode
    private(set) var phase = Phase.loading
    private(set) var queue: Queue?
    private(set) var busy = false
    var notice: String?
    var match: Match?

    init(mode: Mode) {
        self.mode = mode
    }

    var current: User? {
        if case let .ready(user) = phase { return user }
        return nil
    }

    func load() async {
        guard let api = Account.shared.api else { return }

        while true {
            do {
                show(try await api.queue(mode))
            } catch {
                if !API.isCancellation(error) { phase = .failed(Self.message(for: error)) }
                return
            }

            guard case .pending = phase else { break }
            try? await Task.sleep(for: .seconds(3))
            if Task.isCancelled { return }
        }

        await resolve()
    }

    func respond(_ type: String) async {
        guard let api = Account.shared.api, let user = current, !busy else { return }
        busy = true
        defer { busy = false }

        do {
            let response = try await api.respond(type, to: user.id, mode: mode)
            if response.match { match = Match(user: user, kind: response.matchKind ?? mode) }
            show(response.queue)
            await (response.queue.pending ? load() : resolve())
        } catch let issue as Issue where issue.error == "already_responded" {
            await load()
        } catch {
            if !API.isCancellation(error) { notice = Self.message(for: error) }
        }
    }

    // Reported or blocked profiles leave both queues without a like or pass, as on the web.
    func remove(_ id: String) async {
        guard let queue, queue.next.contains(id) else { return }
        let remaining = Queue(previous: queue.previous, next: queue.next.filter { $0 != id }, limits: queue.limits, pending: queue.pending)
        show(remaining)
        await (remaining.next.isEmpty && remaining.pending ? load() : resolve())
    }

    private func show(_ queue: Queue) {
        self.queue = queue
        if queue.next.isEmpty {
            phase = queue.pending ? .pending : .empty
        }
    }

    private func resolve() async {
        guard let queue, let id = queue.next.first else { return }

        do {
            async let relationship: Void = Users.shared.loadRelationship(id)
            phase = .ready(try await Users.shared.get(id))
            await relationship
        } catch {
            if !API.isCancellation(error) { phase = .failed(Self.message(for: error)) }
            return
        }

        for id in queue.next.dropFirst() {
            _ = try? await Users.shared.get(id)
            await Users.shared.loadRelationship(id)
        }
    }

    static func message(for error: Error) -> String {
        guard let issue = error as? Issue else {
            return t("watch.unreachable")
        }

        switch issue.error {
        case "out_of_likes", "out_of_browses":
            let reset = issue.details?.resetAt.map { $0.formatted(date: .omitted, time: .shortened) }
            let limit = issue.error == "out_of_likes"
                ? t("watch.out_of_likes")
                : t("watch.out_of_browses")
            return reset.map { "\(limit) " + t("watch.come_back_at", ["time": $0]) } ?? limit
        case "finish_profile":
            return t("watch.finish_profile")
        case "confirm_email":
            return t("watch.confirm_email")
        case "account_banned":
            return t("watch.account_banned")
        case "account_deactivated":
            return t("watch.account_deactivated")
        default:
            return t("watch.something_went_wrong")
        }
    }
}

struct Match: Identifiable {
    let user: User
    let kind: Mode

    var id: String { user.id }
}
