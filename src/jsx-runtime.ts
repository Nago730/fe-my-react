import { FRAGMENT, TEXT_ELEMENT } from '@src/shared/constants';
import type {
	FragmentVNode,
	TextVNode,
	VNode,
	VNodeChildren,
} from '@src/shared/types';

function wrapChild(child: VNode | string | number): TextVNode | VNode {
	if (typeof child === 'string' || typeof child === 'number') {
		return {
			type: TEXT_ELEMENT,
			props: { nodeValue: String(child) },
		};
	}
	return child;
}

function normalizeChildren(children: VNodeChildren): VNode[] {
	const flat = (Array.isArray(children) ? children : [children])
		.flat(Number.POSITIVE_INFINITY)
		.filter((child) => child !== null && child !== undefined);
	return flat.map(wrapChild);
}

function jsx(
	type: string | Function,
	props: Record<string, any>,
	key: string | null = null,
): VNode {
	const { ref, ...restProps } = props;

	const vnode: VNode = {
		type,
		props: restProps,
	};

	if (key !== null) vnode.key = key;

	if (vnode.props.children !== undefined)
		vnode.props.children = normalizeChildren(vnode.props.children);

	if (ref !== undefined) vnode.ref = ref;

	return vnode;
}

const jsxs = jsx;

function Fragment(props: { children?: VNodeChildren }): FragmentVNode {
	return {
		type: FRAGMENT,
		props: {
			children: props.children ? normalizeChildren(props.children) : [],
		},
	};
}

export { jsx, jsxs, Fragment };
