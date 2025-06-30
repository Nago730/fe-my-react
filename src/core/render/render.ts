import {
	activateComponentScope,
	getNiberTree,
	getRootNiber,
} from '@src/core/niber';
import { diff } from '@src/core/reconciler';
import { applyProps, applyRef } from '@src/dom/domEffects';
import { FRAGMENT, TEXT_ELEMENT } from '@src/shared/constants';
import type { FragmentVNode, Niber, TextVNode, VNode } from '@src/shared/types';

export function createDom(niber: Niber, fragment: Node): void {
	// Niber가 FunctionComponent 일 때, 자식을 재귀 (함수 컴포넌트 자체는 DOM을 생성하지 않음)
	if (typeof niber.type === 'function') {
		for (const child of niber.children) createDom(child, fragment);
		return;
	}

	// Niber가 HostElement 일 때
	const { type, props, children, ref } = niber;

	let dom: Node;

	if (type === TEXT_ELEMENT) dom = document.createTextNode(props.nodeValue);
	else if (type === FRAGMENT) dom = document.createDocumentFragment();
	else if (typeof type === 'string') {
		dom = document.createElement(type);

		if (props) applyProps(dom, props);
		if (ref) applyRef(dom, ref);
	} else {
		// type이 예상하지 못한 값일 때, appenChild를 하지 않기 위해 return함
		return;
	}

	if (children) for (const child of children) createDom(child, dom);

	fragment.appendChild(dom);
}

let rootElement: Element;

export function render(
	vnode: VNode | TextVNode | FragmentVNode,
	container: Element,
): void {
	rootElement = container;

	const niber = getNiberTree(vnode);

	commit(niber, container);
}

export function updateComponent(currentWorkingNiber: Niber) {
	const { props, children: prevNibers } = currentWorkingNiber;

	const nextVNode: VNode = activateComponentScope(currentWorkingNiber, props);

	const newNextNibers: Niber[] = diff(prevNibers, [nextVNode]);

	currentWorkingNiber.children = newNextNibers;

	const rootNiber = getRootNiber();

	if (!rootNiber) return console.error('rootNiber가 존재하지 않음');

	commit(rootNiber, rootElement);
}

function commit(niber: Niber, container: Element): void {
	const fragment = document.createDocumentFragment();

	createDom(niber, fragment);

	container.innerHTML = '';
	container.appendChild(fragment);
}
