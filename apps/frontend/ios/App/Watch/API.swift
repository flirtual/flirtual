import CryptoKit
import Foundation

enum Mode: String, Codable, CaseIterable, Sendable {
    case love
    case friend
}

struct Issue: Error, Decodable, Sendable {
    struct Details: Decodable, Sendable {
        let resetAt: Date?
    }

    let error: String
    let details: Details?
    var status = 0

    private enum CodingKeys: String, CodingKey {
        case error, details
    }

    init(error: String, status: Int) {
        self.error = error
        self.details = nil
        self.status = status
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        error = try container.decode(String.self, forKey: .error)
        details = try? container.decodeIfPresent(Details.self, forKey: .details)
    }
}

struct SessionResponse: Decodable, Sendable {
    let user: User
}

struct User: Decodable, Identifiable, Sendable {
    struct Preferences: Decodable, Sendable {
        let language: String?
        let nsfw: Bool?
    }

    let id: String
    let age: Int?
    let activeAt: Date?
    let preferences: Preferences?
    let profile: Profile

    var name: String { profile.displayName ?? "" }
}

struct Profile: Decodable, Sendable {
    struct Prompt: Decodable, Sendable {
        let promptId: String
        let response: String
    }

    let displayName: String?
    let biography: String?
    let images: [ProfileImage]
    let attributes: [String: [String]]
    let customInterests: [String]
    let prompts: [Prompt]
    let relationships: [String]
    let languages: [String]
    let monopoly: String?
    let domsub: String?
    let country: String?
    let openness: Int?
    let conscientiousness: Int?
    let agreeableness: Int?

    private enum CodingKeys: String, CodingKey {
        case displayName, biography, images, attributes, customInterests, prompts, relationships, languages
        case monopoly, domsub, country, openness, conscientiousness, agreeableness
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        displayName = try container.decodeIfPresent(String.self, forKey: .displayName)
        biography = try container.decodeIfPresent(String.self, forKey: .biography)
        images = try container.decodeIfPresent([ProfileImage].self, forKey: .images) ?? []
        attributes = (try? container.decodeIfPresent([String: [String]].self, forKey: .attributes)) ?? [:]
        customInterests = try container.decodeIfPresent([String].self, forKey: .customInterests) ?? []
        prompts = try container.decodeIfPresent([Prompt].self, forKey: .prompts) ?? []
        relationships = try container.decodeIfPresent([String].self, forKey: .relationships) ?? []
        languages = try container.decodeIfPresent([String].self, forKey: .languages) ?? []
        monopoly = try container.decodeIfPresent(String.self, forKey: .monopoly)
        domsub = try container.decodeIfPresent(String.self, forKey: .domsub)
        country = try container.decodeIfPresent(String.self, forKey: .country)
        openness = try? container.decodeIfPresent(Int.self, forKey: .openness)
        conscientiousness = try? container.decodeIfPresent(Int.self, forKey: .conscientiousness)
        agreeableness = try? container.decodeIfPresent(Int.self, forKey: .agreeableness)
    }

    func attributes(_ type: String) -> [String] {
        attributes[type] ?? []
    }
}

struct Relationship: Decodable, Sendable {
    let timeDiff: Int?
    let distance: String?
}

struct ProfileImage: Decodable, Identifiable, Sendable {
    let id: String
}

struct AttributeMetadata: Decodable, Identifiable, Sendable {
    let id: String
    let aliasOf: String?
    let simple: Bool?
    let fallback: Bool?
}

struct QueueLimits: Decodable, Sendable {
    struct Usage: Decodable, Sendable {
        let used: Int
        let max: Int
    }

    let likes: Usage
    let browses: Usage
    let resetAt: Date?
}

struct Queue: Decodable, Sendable {
    let previous: String?
    let next: [String]
    let limits: QueueLimits?
    let pending: Bool
}

struct Response: Decodable, Sendable {
    let match: Bool
    let matchKind: Mode?
    let queue: Queue
}

struct Message: Decodable, Identifiable, Sendable {
    let id: String
    let content: String?
    let senderId: String?
    let system: Bool
    let viewed: Bool?
    let createdAt: Date
}

struct Conversation: Decodable, Identifiable, Sendable {
    let id: String
    let kind: Mode
    let lastMessage: Message?
    let isUnread: Bool
    let userId: String
    let createdAt: Date
}

struct ConversationList: Decodable, Sendable {
    struct Metadata: Decodable, Sendable {
        let next: String?
    }

    let data: [Conversation]
    let metadata: Metadata
}

private struct Empty: Decodable {}

struct API: Sendable {
    let baseURL: URL

    func session() async throws -> SessionResponse {
        try await request("session")
    }

    func queue(_ mode: Mode) async throws -> Queue {
        try await request("queue", query: ["mode": mode.rawValue])
    }

    func respond(_ type: String, to userId: String, mode: Mode) async throws -> Response {
        try await request("queue", method: "POST", body: [
            "type": type,
            "mode": mode.rawValue,
            "user_id": userId,
            "source": mode.rawValue
        ])
    }

    func user(_ id: String) async throws -> User {
        try await request("users/\(id)")
    }

    func relationship(_ userId: String) async throws -> Relationship {
        try await request("users/\(userId)/relationship")
    }

    func attributes(_ type: String) async throws -> [AttributeMetadata] {
        try await request("attributes/\(type)")
    }

    func conversations(cursor: String? = nil) async throws -> ConversationList {
        try await request("conversations", query: cursor.map { ["cursor": $0] } ?? [:])
    }

    func messages(_ conversationId: String) async throws -> [Message] {
        try await request("conversations/\(conversationId)/messages")
    }

    func send(_ text: String, to conversationId: String) async throws {
        let _: Empty = try await request("conversations/\(conversationId)/messages", method: "POST", body: ["text": text])
    }

    func markRead(_ conversationId: String) async throws {
        let _: Empty = try await request("conversations/\(conversationId)/unread", method: "DELETE")
    }

    func imageURL(_ image: ProfileImage, variant: String = "profile") -> URL {
        var components = URLComponents(url: baseURL.appendingPathComponent("images/\(image.id)/view"), resolvingAgainstBaseURL: false)!
        components.queryItems = [URLQueryItem(name: "type", value: variant)]
        return components.url!
    }

    // Matches Talkjs.new_conversation_id/2 on the API.
    static func conversationId(_ userId: String, _ targetId: String) -> String {
        let ids = [userId, targetId].sorted().map { "\"\($0)\"" }.joined(separator: ",")
        let digest = Insecure.SHA1.hash(data: Data("[\(ids)]".utf8))
        return String(digest.map { String(format: "%02x", $0) }.joined().prefix(20))
    }

    // The watch's network path takes a moment to come up after launch, and often drops while
    // switching between the phone's Bluetooth proxy and Wi-Fi.
    static let session: URLSession = {
        let configuration = URLSessionConfiguration.default
        configuration.waitsForConnectivity = true
        configuration.timeoutIntervalForResource = 60
        return URLSession(configuration: configuration)
    }()

    static func isCancellation(_ error: Error) -> Bool {
        error is CancellationError || (error as? URLError)?.code == .cancelled
    }

    private static let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .custom { decoder in
            let value = try decoder.singleValueContainer().decode(String.self)
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = formatter.date(from: value) { return date }
            formatter.formatOptions = [.withInternetDateTime]
            if let date = formatter.date(from: value) { return date }
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: value))
        }
        return decoder
    }()

    private func request<T: Decodable>(
        _ path: String,
        method: String = "GET",
        query: [String: String] = [:],
        body: [String: String]? = nil
    ) async throws -> T {
        var components = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false)!
        if !query.isEmpty {
            components.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
        }

        var request = URLRequest(url: components.url!)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(body)
        }

        let (data, response) = try await data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0

        guard (200..<300).contains(status) else {
            var issue = (try? Self.decoder.decode(Issue.self, from: data)) ?? Issue(error: "unknown", status: status)
            issue.status = status
            throw issue
        }

        if T.self == Empty.self { return Empty() as! T }
        return try Self.decoder.decode(T.self, from: data)
    }

    private func data(for request: URLRequest) async throws -> (Data, URLResponse) {
        var attempt = 0
        while true {
            do {
                return try await Self.session.data(for: request)
            } catch let error as URLError where request.httpMethod == "GET" && error.code != .cancelled && attempt < 2 {
                attempt += 1
                try await Task.sleep(for: .seconds(attempt))
            }
        }
    }
}
