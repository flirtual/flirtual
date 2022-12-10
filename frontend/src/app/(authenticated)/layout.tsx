import { SsrUserProvider } from "~/components/ssr-user-provider";

export default function AuthenticatedLayout({ children }: React.PropsWithChildren) {
	return (
		// @ts-expect-error: Server Component
		<SsrUserProvider>{children}</SsrUserProvider>
	);
}
