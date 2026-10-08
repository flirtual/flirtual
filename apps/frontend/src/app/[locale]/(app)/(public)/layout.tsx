import { Outlet } from "react-router";

import { ModelCardBack } from "~/components/model-card";

export default function AppPublicLayout() {
	return (
		<ModelCardBack>
			<Outlet />
		</ModelCardBack>
	);
}
