export const dialogOverlayClassName =
	"fixed inset-0 z-50 bg-black-80/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0";
export const dialogContentClassName =
	"fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-3xl font-nunito shadow-brand-1 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] md:w-full";
export const dialogContentInnerClassName =
	"grid gap-4 rounded-3xl bg-white-30 px-6 py-4 text-black-80 dark:bg-black-70 dark:text-white-20";
export const dialogTitleClassName =
	"font-montserrat text-lg font-semibold select-none";
export const dialogDescriptionClassName =
	"text-sm text-black-60 dark:text-white-40";
