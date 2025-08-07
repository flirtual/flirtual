import { Outlet } from "react-router";

export default function MinimalLayout() {
	return (
		<div className="flex min-h-screen w-full grow flex-col items-center desktop:flex-col desktop:p-8">
			<Outlet />
		</div>
	);
}
