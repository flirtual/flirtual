/**
 * Identity function for defining Alpine data.
 */
export function component(fn: (this: AlpineContext) => unknown) {
	return fn;
}

export interface AlpineContext {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	$data: any;
	$el: HTMLElement;
}
