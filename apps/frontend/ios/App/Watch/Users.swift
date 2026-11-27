import Foundation
import Observation

@MainActor
@Observable
final class Users {
    static let shared = Users()

    private(set) var users: [String: User] = [:]
    private(set) var relationships: [String: Relationship] = [:]

    // Matching reveals more of a profile (connections, country), so refresh after one.
    func get(_ id: String, refresh: Bool = false) async throws -> User {
        if !refresh, let user = users[id] { return user }
        guard let api = Account.shared.api else { throw CancellationError() }

        async let user = api.user(id)
        await Translations.shared.loadNames()

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
        user.profile.tags("genders")
    }
}
