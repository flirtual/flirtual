"use client";

import { ArrowLongLeftIcon, ArrowLongRightIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import AnsiConvert from "ansi-to-html";
import { useCallback, useMemo, useState } from "react";

import { api } from "~/api";
import { Form, FormButton } from "~/components/forms";
import { InputSlider } from "~/components/inputs/slider";
import { InputTextArea } from "~/components/inputs/textarea";
import { SoleModelLayout } from "~/components/layout/sole-model";
import { ModelCard } from "~/components/model-card";

const ansiConvert = new AnsiConvert();

interface InputOutput {
	input: string;
	output: string;
}

const ConsoleView: React.FC<InputOutput & { idx: number }> = ({ input, output, idx }) => {
	const outputHtml = useMemo(() => ansiConvert.toHtml(output), [output]);

	return (
		<div className="flex h-full flex-col gap-4 overflow-y-scroll whitespace-pre p-4 text-xs">
			<code className="flex flex-col">
				{input.split("\n").map((value, valueIdx) => (
					<span key={valueIdx}>
						<span className="select-none">{`${valueIdx === 0 ? "iex" : "..."}(${idx})> `}</span>
						{value}
					</span>
				))}
			</code>
			<code
				dangerouslySetInnerHTML={{
					__html: outputHtml
				}}
			/>
		</div>
	);
};

export default function DebuggerConsolePage() {
	const [history, setHistory] = useState<Array<InputOutput>>([]);
	const [historyIdx, setHistoryIdx] = useState(0);

	const previousHistoryIdx = historyIdx - 1 < 0 ? history.length - 1 : historyIdx - 1;
	const nextHistoryIdx = (historyIdx + 1) % history.length;

	const doSubmit = useCallback(async (input: string, limit: number) => {
		const io = await api.debug.evaluate({ body: { input, limit } });

		setHistory((history) => {
			const newHistory = [...history, io];

			setHistoryIdx(newHistory.length - 1);
			return newHistory;
		});
	}, []);

	return (
		<SoleModelLayout footer={{ desktopOnly: true }}>
			<ModelCard
				className="sm:max-w-5xl"
				containerProps={{ className: "sm:grid grid-cols-12 gap-8" }}
				title="Debugger"
			>
				<Form
					className="col-span-5 flex flex-col gap-4"
					fields={{ input: "", limit: 10 }}
					requireChange={false}
					onSubmit={async (body, form) => {
						form.fields.input.props.onChange(body.input);
						await doSubmit(body.input, body.limit);
					}}
				>
					{({ FormField, fields }) => (
						<>
							<FormField name="input">
								{(field) => (
									<>
										<InputTextArea
											spellCheck={false}
											{...field.props}
											className="font-mono"
											rows={4}
										/>
									</>
								)}
							</FormField>
							<div className="flex items-center gap-4">
								<FormButton className="w-fit" size="sm">
									Execute
								</FormButton>
								<FormField className="w-full" name="limit">
									{({ props }) => <InputSlider {...props} max={100} min={10} />}
								</FormField>
								<span>
									{fields.limit.props.value === 100 ? "Infinity" : fields.limit.props.value}
								</span>
							</div>
						</>
					)}
				</Form>
				<div className="col-span-7 flex max-h-96 w-full flex-col overflow-hidden overflow-x-auto rounded-xl bg-black-80 shadow-brand-1">
					<div className="flex items-center justify-between gap-4 p-4 pb-0">
						{history[previousHistoryIdx] && nextHistoryIdx !== historyIdx && (
							<button
								className="flex items-center gap-2"
								type="button"
								onClick={() => setHistoryIdx(previousHistoryIdx)}
							>
								<ArrowLongLeftIcon className="h-5 w-5 shrink-0" />
								<span className="font-mono text-sm">{previousHistoryIdx}</span>
							</button>
						)}
						{history[historyIdx] && (
							<div className="flex gap-2">
								<span className="w-full truncate text-center font-mono text-sm">
									{history[historyIdx].input.replaceAll("\n", "").slice(0, 24)} ({historyIdx})
								</span>
								<button
									type="button"
									onClick={async () => {
										await doSubmit(history[historyIdx].input, 100);
									}}
								>
									<ArrowPathIcon className="h-5 w-5 shrink-0" />
								</button>
							</div>
						)}
						{history[nextHistoryIdx] &&
							nextHistoryIdx !== historyIdx &&
							nextHistoryIdx !== previousHistoryIdx && (
								<button
									className="flex items-center gap-2"
									type="button"
									onClick={() => setHistoryIdx(nextHistoryIdx)}
								>
									<span className="font-mono text-sm">{nextHistoryIdx}</span>
									<ArrowLongRightIcon className="h-5 w-5 shrink-0" />
								</button>
							)}
					</div>
					{history[historyIdx] && <ConsoleView {...history[historyIdx]} idx={historyIdx} />}
				</div>
			</ModelCard>
		</SoleModelLayout>
	);
}
