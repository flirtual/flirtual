import * as React from "react";
import { twMerge } from "tailwind-merge";

function Table({ ref: reference, className, ...props }: { ref?: React.RefObject<HTMLTableElement | null> } & React.HTMLAttributes<HTMLTableElement>) {
	return (
		<div className="unhide-scrollbar w-full overflow-x-auto overflow-y-hidden rounded-xl shadow-brand-1">
			<table
				className={twMerge("w-full caption-bottom text-sm", className)}
				ref={reference}
				{...props}
			/>
		</div>
	);
}
Table.displayName = "Table";

function TableHeader({ ref: reference, className, ...props }: { ref?: React.RefObject<HTMLTableSectionElement | null> } & React.HTMLAttributes<HTMLTableSectionElement>) {
	return (
		<thead
			className={twMerge("bg-brand-gradient bg-fixed", className)}
			ref={reference}
			{...props}
		/>
	);
}
TableHeader.displayName = "TableHeader";

function TableBody({ ref: reference, className, ...props }: { ref?: React.RefObject<HTMLTableSectionElement | null> } & React.HTMLAttributes<HTMLTableSectionElement>) {
	return (
		<tbody
			className={twMerge("bg-white-30 font-nunito dark:bg-black-60", className)}
			ref={reference}
			{...props}
		/>
	);
}
TableBody.displayName = "TableBody";

function TableFooter({ ref: reference, className, ...props }: { ref?: React.RefObject<HTMLTableSectionElement | null> } & React.HTMLAttributes<HTMLTableSectionElement>) {
	return (
		<tfoot
			className={twMerge("bg-black-80 font-medium text-white-20", className)}
			ref={reference}
			{...props}
		/>
	);
}
TableFooter.displayName = "TableFooter";

function TableRow({ ref: reference, className, ...props }: { ref?: React.RefObject<HTMLTableRowElement | null> } & React.HTMLAttributes<HTMLTableRowElement>) {
	return (
		<tr
			className={twMerge(
				"transition-colors even:bg-white-10/10 data-[state=selected]:brightness-75 dark:even:bg-black-90/5",
				className
			)}
			ref={reference}
			{...props}
		/>
	);
}
TableRow.displayName = "TableRow";

function TableHead({ ref: reference, className, ...props }: { ref?: React.RefObject<HTMLTableCellElement | null> } & React.ThHTMLAttributes<HTMLTableCellElement>) {
	return (
		<th
			className={twMerge(
				"h-12 px-4 text-left align-middle font-montserrat font-semibold text-white-20 [&:has([role=checkbox])]:pr-0",
				className
			)}
			ref={reference}
			{...props}
		/>
	);
}
TableHead.displayName = "TableHead";

function TableCell({ ref: reference, className, ...props }: { ref?: React.RefObject<HTMLTableCellElement | null> } & React.TdHTMLAttributes<HTMLTableCellElement>) {
	return (
		<td
			className={twMerge(
				"w-0 p-4 align-middle [&:has([role=checkbox])]:pr-0",
				className
			)}
			ref={reference}
			{...props}
		/>
	);
}
TableCell.displayName = "TableCell";

function TableCaption({ ref: reference, className, ...props }: { ref?: React.RefObject<HTMLTableCaptionElement | null> } & React.HTMLAttributes<HTMLTableCaptionElement>) {
	return (
		<caption
			className={twMerge("mt-4 text-sm text-white-40", className)}
			ref={reference}
			{...props}
		/>
	);
}
TableCaption.displayName = "TableCaption";

export {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow
};
