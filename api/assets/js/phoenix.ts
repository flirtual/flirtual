import { Socket } from "phoenix";
import { LiveSocket } from "phoenix_live_view";

import { getCSRFToken } from "./utilities";

const liveSocket = new LiveSocket("/live", Socket, {
	params: {
		_csrf_token: getCSRFToken()
	}
});

liveSocket.connect();
export {};
