import * as React from "react";
import { twMerge } from "tailwind-merge";

const Table = React.forwardRef<
	HTMLTableElement,
	React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, reference) => (
	<div className="w-full overflow-auto">
		<table
			className={twMerge("w-full caption-bottom text-sm", className)}
			ref={reference}
			{...props}
		/>
	</div>
));
Table.displayName = "Table";

const TableHeader = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, reference) => (
	<thead
		className={twMerge("bg-brand-gradient", className)}
		ref={reference}
		{...props}
	/>
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, reference) => (
	<tbody
		className={twMerge("bg-black-60 font-nunito", className)}
		ref={reference}
		{...props}
	/>
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
	HTMLTableSectionElement,
	React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, reference) => (
	<tfoot
		className={twMerge("bg-black-80 font-medium text-white-20", className)}
		ref={reference}
		{...props}
	/>
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<
	HTMLTableRowElement,
	React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, reference) => (
	<tr
		ref={reference}
		className={twMerge(
			"transition-colors even:bg-black-50 data-[state=selected]:brightness-75",
			className
		)}
		{...props}
	/>
));
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
	HTMLTableCellElement,
	React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, reference) => (
	<th
		ref={reference}
		className={twMerge(
			"h-12 px-4 text-left align-middle font-montserrat font-semibold text-white-20 [&:has([role=checkbox])]:pr-0",
			className
		)}
		{...props}
	/>
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
	HTMLTableCellElement,
	React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, reference) => (
	<td
		ref={reference}
		className={twMerge(
			"p-4 align-middle [&:has([role=checkbox])]:pr-0",
			className
		)}
		{...props}
	/>
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
	HTMLTableCaptionElement,
	React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, reference) => (
	<caption
		className={twMerge("mt-4 text-sm text-white-40", className)}
		ref={reference}
		{...props}
	/>
));
TableCaption.displayName = "TableCaption";

export {
	Table,
	TableHeader,
	TableBody,
	TableFooter,
	TableHead,
	TableRow,
	TableCell,
	TableCaption
};
