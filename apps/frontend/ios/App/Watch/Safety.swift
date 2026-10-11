import SwiftUI

struct SafetyButtons: View {
    let user: User
    let onReport: () async -> Void
    let onBlock: () async -> Void

    var body: some View {
        HStack(spacing: 8) {
            ReportButton(user: user, onReport: onReport)
            BlockButton(user: user, onBlock: onBlock)
        }
        .labelStyle(.iconOnly)
        .font(.title3)
    }
}

struct ReportButton: View {
    let user: User
    let onReport: () async -> Void

    @State private var reporting = false
    @State private var reported = false

    var body: some View {
        Button(t("report"), systemImage: "flag.fill") {
            reporting = true
        }
        .sheet(isPresented: $reporting) {
            if reported { Task { await onReport() } }
        } content: {
            ReportView(user: user, reported: $reported)
        }
    }
}

struct BlockButton: View {
    let user: User
    let onBlock: () async -> Void

    @State private var confirming = false
    @State private var failed = false

    var body: some View {
        Button(t("block"), systemImage: "nosign") {
            confirming = true
        }
        .confirmationDialog(t("block_name", ["name": user.name]), isPresented: $confirming, titleVisibility: .visible) {
            Button(t("block"), role: .destructive) {
                Task { await block() }
            }
            Button(t("cancel"), role: .cancel) {}
        } message: {
            Text(t("barbarous_hypnotic_thank_book"))
        }
        .alert(t("watch.something_went_wrong"), isPresented: $failed) {}
    }

    private func block() async {
        do {
            try await Account.shared.api?.block(user.id)
            await onBlock()
        } catch {
            if !API.isCancellation(error) { failed = true }
        }
    }
}

struct ReportView: View {
    let user: User
    @Binding var reported: Bool

    @Environment(\.dismiss) private var dismiss
    @State private var reasons: [String]?
    @State private var loadFailed = false
    @State private var reason: String?
    @State private var details = ""
    @State private var sending = false
    @State private var failed = false

    // Mirrors detailsRequiredReasons in the web's report dialog.
    private static let detailsRequired: Set<String> = [
        "AFe9ijRg9MYGubm2Efi4Ki",
        "Ec5fqqgVo5X3s4QCeFUJ6D",
        "MyexHAyY8gzQjBQ6agCSx3",
        "zu6HcxQxmJDDq4rmvJazkf",
        "BtJvp62cJ5vm6CeuCPTP5H",
        "9iwmQ8huhkngyY9BgLDE9W"
    ]

    var body: some View {
        content
            .navigationTitle(t("report"))
            .task { await load() }
    }

    @ViewBuilder
    private var content: some View {
        if reported {
            ScrollView {
                VStack(spacing: 10) {
                    Text(t("day_front_cat_cry"))
                        .multilineTextAlignment(.center)
                    Button(t("close")) { dismiss() }
                }
                .padding(.horizontal, .margin)
            }
        } else if let reason {
            form(reason)
        } else if let reasons {
            List {
                Section(t("report_profile")) {
                    ForEach(reasons, id: \.self) { id in
                        Button(Self.name(id)) { reason = id }
                    }
                }
            }
        } else if loadFailed {
            StatusMessage(systemImage: "exclamationmark.triangle", title: t("watch.something_went_wrong"), detail: "") {
                Task { await load() }
            }
        } else {
            ProgressView()
        }
    }

    private func load() async {
        guard let api = Account.shared.api else { return }
        loadFailed = false

        do {
            reasons = try await api.attributes("report-reason").map(\.id)
        } catch {
            if !API.isCancellation(error) { loadFailed = true }
        }
    }

    private func form(_ reason: String) -> some View {
        let required = Self.detailsRequired.contains(reason)

        return ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                Button {
                    self.reason = nil
                } label: {
                    Text(Self.name(reason))
                        .frame(maxWidth: .infinity, alignment: .leading)
                }

                TextFieldLink(prompt: Text(t(required ? "report_details_required_placeholder" : "report_details_optional_placeholder"))) {
                    Label(details.isEmpty ? t("details") : details, systemImage: "text.bubble")
                        .lineLimit(3)
                } onSubmit: { text in
                    details = text
                }

                if failed {
                    Text(t("watch.something_went_wrong"))
                        .font(.footnote)
                        .foregroundStyle(.red)
                }

                Button(t("report"), role: .destructive) {
                    Task { await send(reason) }
                }
                .disabled(sending || (required && details.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty))
            }
            .padding(.horizontal, .margin)
        }
    }

    private func send(_ reason: String) async {
        guard let api = Account.shared.api else { return }
        sending = true
        defer { sending = false }

        do {
            try await api.report(user.id, reason: reason, message: details)
            reported = true
        } catch {
            if !API.isCancellation(error) { failed = true }
        }
    }

    private static func name(_ id: String) -> String {
        Translations.shared.attribute("report-reason", id) ?? id
    }
}
