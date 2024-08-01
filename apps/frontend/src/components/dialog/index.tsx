export const dialogOverlayClassName =
	"fixed inset-0 z-50 bg-black-80/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0";
export const dialogContentClassName =
	"fixed left-1/2 top-1/2 z-50 max-h-[calc(95svh-env(safe-area-inset-top,0rem)-env(safe-area-inset-bottom,0rem))] w-full max-w-[95svw] -translate-x-1/2 -translate-y-1/2 rounded-3xl font-nunito shadow-brand-1 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] android:max-h-[calc(95svh-var(--safe-area-inset-top,0rem))] desktop:max-w-md";
export const dialogContentInnerClassName =
	"grid max-h-[calc(95svh-env(safe-area-inset-top,0rem)-env(safe-area-inset-bottom,0rem)-3.5rem)] gap-4 overflow-y-auto rounded-[1.25rem] bg-white-30 p-6 text-black-80 shadow-brand-inset android:max-h-[calc(95svh-var(--safe-area-inset-top,0rem)-4.25rem)] dark:bg-black-70 dark:text-white-20";
export const dialogTitleClassName =
	"select-none font-montserrat text-lg font-semibold";
export const dialogDescriptionClassName =
	"text-sm text-black-60 dark:text-white-40";
