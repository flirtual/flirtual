import { AuthProvider } from "~/components/auth-provider";

export const dynamic = "force-dynamic";

export default function AuthenticatedLayout({ children }: React.PropsWithChildren) {
	return (
		// @ts-expect-error: Server Component
		<AuthProvider emailConfirmedOptional visibleOptional>
			{children}
		</AuthProvider>
	);
}
