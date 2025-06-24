import type { Naber, VNode } from '@src/types/base.types';
import { getTag } from './tag';

/**
 * 전역 naber 상태를 담는 객체입니다.
 * - `naberRoot`: 루트 Naber 트리
 * - `currentlyRenderingNaber`: 현재 렌더링 중인 함수형 컴포넌트 Naber
 */
const naber = {
	/** 최상위 Naber 트리 객체 */
	naberRoot: null as Naber | null,

	/** 현재 렌더링 중인 함수형 컴포넌트의 Naber 객체 */
	currentlyRenderingNaber: null as Naber | null,
};

const setCurrentlyRenderingNaber = (value: Naber | null) =>
	(naber.currentlyRenderingNaber = value);

/**
 * 루트 Naber 객체를 반환합니다.
 * @returns {Naber | null} 현재 저장된 루트 Naber 객체
 */
const getNaberRoot = (): Naber | null => naber.naberRoot;

/**
 * 현재 렌더링 중인 함수형 컴포넌트의 Naber 객체를 반환합니다.
 * @returns {Naber | null} 현재 렌더링 중인 Naber 객체
 */
const getCurrentWorkingNaber = (): Naber | null =>
	naber.currentlyRenderingNaber;

/**
 * 단일 VNode를 기반으로 Naber 객체를 생성합니다.
 * @param {VNode} vnode - 변환 대상 VNode
 * @returns {Naber} 생성된 Naber 객체
 */
const createNaber = (vnode: VNode): Naber => {
	const { children, ...restProps } = vnode.props;
	return {
		tag: getTag(vnode.type),
		type: vnode.type,
		props: restProps,
		children: [],
		key: vnode.key || null,
		ref: vnode.ref || null,
		memoizedState: [],
		hookIndex: 0,
	};
};

/**
 * Naber 트리를 재귀적으로 구축합니다.
 * @param {Naber} parentNaber - 현재 부모 Naber 객체
 * @param {VNode[]} vnodeChildren - 자식 VNode 목록
 */
const buildNaberTree = (parentNaber: Naber, vnodeChildren: VNode[]): void => {
	for (const vnode of vnodeChildren) {
		const naber: Naber = createNaber(vnode);

		parentNaber.children.push(naber);

		if (typeof naber.type === 'function') {
			const newVNode = (naber.type as Function)(vnode.props);
			const children = newVNode.props.children ?? [];
			buildNaberTree(naber, children);
		} else {
			const children = vnode.props.children ?? [];
			buildNaberTree(naber, children);
		}
	}
};

/**
 * 주어진 VNode를 기반으로 전체 Naber 트리를 생성합니다.
 * @param {VNode} vnode - 루트 VNode
 * @returns {Naber} 구축된 Naber 트리의 루트 객체
 */
const getNaberTree = (vnode: VNode): Naber => {
	const naberRoot: Naber = createNaber(vnode);
	buildNaberTree(naberRoot, vnode.props.children);
	return naberRoot;
};

export {
	getNaberRoot,
	getCurrentWorkingNaber,
	getNaberTree,
	createNaber,
	buildNaberTree,
};
