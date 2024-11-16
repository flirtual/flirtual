/* eslint-disable tailwindcss/no-custom-classname */
export const EditorSkeleton: React.FC = () => {
	return (
		<div className="quill">
			<div className="ql-toolbar">
				<span className="ql-formats">
					<span className="ql-button" />
				</span>
			</div>
			<div className="ql-container">
				<div className="ql-editor flex flex-col gap-2">
					<div className="flex gap-2">
						<div className="h-4 w-10 bg-white-10/20" />
						<div className="h-4 w-16 bg-white-10/20" />
						<div className="h-4 w-10 bg-white-10/20" />
						<div className="h-4 w-32 bg-white-10/20" />
					</div>
					<div className="flex gap-2">
						<div className="h-4 w-16 bg-white-10/20" />
						<div className="h-4 w-24 bg-white-10/20" />
						<div className="h-4 w-8 bg-white-10/20" />
						<div className="h-4 w-48 bg-white-10/20" />
						<div className="h-4 w-8 bg-white-10/20" />
					</div>
					<div className="flex gap-2">
						<div className="h-4 w-32 bg-white-10/20" />
						<div className="h-4 w-8 bg-white-10/20" />
						<div className="h-4 w-24 bg-white-10/20" />
						<div className="h-4 w-12 bg-white-10/20" />
					</div>
				</div>
			</div>
		</div>
	);
};
