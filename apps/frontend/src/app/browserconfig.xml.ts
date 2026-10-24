import * as brand from "~/brand";

export function loader() {
	return `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
    <msapplication>
        <tile>
            <square150x150logo src="/mstile-150x150.png"/>
            <TileColor>${brand.accentColor}</TileColor>
        </tile>
    </msapplication>
</browserconfig>
`;
}
