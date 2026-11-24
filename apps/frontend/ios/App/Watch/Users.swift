import Foundation
import Observation

@MainActor
@Observable
final class Users {
    static let shared = Users()

    private(set) var users: [String: User] = [:]
    private(set) var relationships: [String: Relationship] = [:]
    private var genders: [AttributeMetadata]?

    // Matching reveals more of a profile (connections, country), so refresh after one.
    func get(_ id: String, refresh: Bool = false) async throws -> User {
        if !refresh, let user = users[id] { return user }
        guard let api = Account.shared.api else { throw CancellationError() }

        async let user = api.user(id)
        if genders == nil { genders = try? await api.attributes("gender") }

        let loaded = try await user
        users[id] = loaded
        return loaded
    }

    func loadRelationship(_ id: String, refresh: Bool = false) async {
        guard refresh || relationships[id] == nil, let api = Account.shared.api else { return }
        if let relationship = try? await api.relationship(id) {
            relationships[id] = relationship
        }
    }

    func genderTags(of user: User) -> [String] {
        let order = Dictionary((genders ?? []).enumerated().map { ($1.id, $0) }, uniquingKeysWith: { first, _ in first })
        return user.profile.attributes("gender").sorted { order[$0, default: .max] < order[$1, default: .max] }
    }
}
