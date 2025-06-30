import type { MutableRefObject, Ref, VNodeProps } from '@src/shared/types';

export function applyRef(dom: Node, ref: Ref | undefined) {
	if (typeof ref === 'function') {
		ref(dom);
	} else if (ref && typeof ref === 'object' && 'current' in ref) {
		(ref as MutableRefObject<Node>).current = dom;
	}
}

export function applyProps(dom: Node, props: VNodeProps) {
	for (const [key, value] of Object.entries(props)) {
		if (key === 'children') continue;
		(dom as any)[key] = value;
	}
}
