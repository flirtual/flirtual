import { cookies, headers } from "next/headers";

import { DebugInfo } from "../../../(public)/debugger/debug-info";
import { Codeblock } from "../codeblock";

export default async function () {
	return (
		<div className="mt-8 desktop:max-w-3xl">
			<Codeblock className="w-full rounded-none desktop:rounded-xl">
				<DebugInfo />
				<span className="text-lg font-bold">Headers</span>
				{[...headers().entries()]
					.filter(([key]) => !["cookie"].includes(key))
					.map(([key, value]) => (
						<div className="flex flex-col" key={key}>
							<span className="font-bold">{key}</span>
							<span>{value}</span>
						</div>
					))}
				<span className="text-lg font-bold">Cookies</span>
				{[...cookies().getAll()]
					.filter(({ name }) => !["cookie"].includes(name))
					.map(({ name, value }) => (
						<div className="flex flex-col" key={name}>
							<span className="font-bold">{name}</span>
							<span>{value}</span>
						</div>
					))}
			</Codeblock>
		</div>
	);
}
