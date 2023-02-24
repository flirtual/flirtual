import { AuthProvider } from "~/components/auth-provider";

export default function AuthenticatedEmailConfirmedLayout({ children }: React.PropsWithChildren) {
	return (
		// @ts-expect-error: Server Component
		<AuthProvider>{children}</AuthProvider>
	);
}
