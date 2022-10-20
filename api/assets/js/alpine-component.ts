export interface AlpineContext {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	$data: any;
	$el: HTMLElement;
}


export type ComponentIdentity = (this: AlpineContext) => { [K: string]: any };

/**
 * Identity function for defining Alpine data.
 */
export function component(fn: ComponentIdentity) {
	return fn;
}