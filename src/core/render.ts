import { withNaberScope } from '@src/renderUtils';
import { diff } from '../runtime/diff';
import { getNaberRoot, getNaberTree } from '../runtime/naber';
import type {
	FragmentVNode,
	Naber,
	TextVNode,
	VNode,
} from '../types/base.types';
import { FRAGMENT, TEXT_ELEMENT } from './constants';
import { applyProps, applyRef } from './domEffects';

export function createDom(naber: Naber, fragment: Node): void {
	// Naber가 FunctionComponent 일 때, 자식을 재귀 (함수 컴포넌트 자체는 DOM을 생성하지 않음)
	if (typeof naber.type === 'function') {
		for (const child of naber.children) createDom(child, fragment);
		return;
	}

	// Naber가 HostElement 일 때
	const { type, props, children, ref } = naber;

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

	const naber = getNaberTree(vnode);

	commit(naber, container);
}

export function updateComponent(currentWorkingNaber: Naber) {
	const { props, children: prevNabers, type: FC } = currentWorkingNaber;

	const nextVNode: VNode = withNaberScope(
		currentWorkingNaber,
		FC as Function,
		props,
	);

	const newNextNabers: Naber[] = diff(prevNabers, [nextVNode]);

	currentWorkingNaber.children = newNextNabers;

	const rootNaber = getNaberRoot();

	if (!rootNaber) return console.error('rootNaber가 존재하지 않음');

	commit(rootNaber, rootElement);
}

function commit(naber: Naber, container: Element): void {
	const fragment = document.createDocumentFragment();

	createDom(naber, fragment);

	container.innerHTML = '';
	container.appendChild(fragment);
}
