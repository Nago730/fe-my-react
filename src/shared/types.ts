import type { FRAGMENT, TEXT_ELEMENT } from '@src/shared/constants';

// DOM 요소의 속성에 대한 기본 타입
export type DomAttributes = {
	[key: string]: any; // 필요에 따라 특정 DOM 속성들로 더 세분화할 수 있습니다.
};

// Ref 타입 정의
export type RefCallback = (instance: Node | null) => void;
export type RefObject<T> = { readonly current: T | null };
export type MutableRefObject<T> = { current: T | null };
export type Ref = RefCallback | RefObject<Node> | MutableRefObject<Node>;

// 가상 노드의 props 타입 (특별 props 제외)
export type VNodeProps = DomAttributes;

// 자식 노드가 될 수 있는 타입: 단일 VNode, VNode 배열 또는 undefined
export type VNodeChildren = VNode | VNode[] | undefined;

// 기본 가상 노드 타입
export interface VNode {
	type: string | Function | symbol; // 요소 태그 이름, 함수형 컴포넌트, 또는 특별 심볼
	props: VNodeProps;
	key?: string | null;
	ref?: Ref;
}

// 텍스트 요소를 위한 특정 VNode
export interface TextVNode extends VNode {
	type: typeof TEXT_ELEMENT;
	props: { nodeValue: string };
}

// Fragment를 위한 특정 VNode
export interface FragmentVNode extends VNode {
	type: typeof FRAGMENT;
	props: {};
}

export interface Niber {
	type: string | Function | symbol;
	props: VNodeProps;
	children: Niber[];
	key: string | null;
	ref: Ref | null;
	memoizedState: any[];
	hookIndex: number;
}
