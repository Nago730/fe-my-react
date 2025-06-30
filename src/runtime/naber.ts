import { callFunctionComponent } from '@src/renderUtils';
import type { Naber, VNode } from '@src/types/base.types';

/**
 * 전역 naber 상태를 담는 객체입니다.
 * - `naberRoot`: 루트 Naber 트리
 * - `currentlyRenderingNaber`: 현재 렌더링 중인 함수형 컴포넌트 Naber
 */
const naberManager = {
	/** 최상위 Naber 트리 객체 */
	naberRoot: null as Naber | null,

	/** 현재 렌더링 중인 함수형 컴포넌트의 Naber 객체 */
	currentlyRenderingNaber: null as Naber | null,
};

const setNaberRoot = (naber: Naber) => (naberManager.naberRoot = naber);

const setCurrentlyRenderingNaber = (value: Naber | null) =>
	(naberManager.currentlyRenderingNaber = value);

/**
 * 루트 Naber 객체를 반환합니다.
 * @returns {Naber | null} 현재 저장된 루트 Naber 객체
 */
const getNaberRoot = (): Naber | null => naberManager.naberRoot;

/**
 * 현재 렌더링 중인 함수형 컴포넌트의 Naber 객체를 반환합니다.
 * @returns {Naber | null} 현재 렌더링 중인 Naber 객체
 */
const getCurrentWorkingNaber = (): Naber | null =>
	naberManager.currentlyRenderingNaber;

/**
 * 단일 VNode를 기반으로 Naber 객체를 생성합니다.
 * @param {VNode} vnode - 변환 대상 VNode
 * @returns {Naber} 생성된 Naber 객체
 */
const createNaber = (vnode: VNode): Naber => {
	const { children, ...restProps } = vnode.props;
	return {
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
		// 조건부 렌더링 시 vnodeChildren에 [false]가 들어오면 vnode가 false가 됨
		// vnode가 객체가 아니므로 createNaber 에러 발생
		// false일 경우 return
		if (!vnode) return;
		const newNextNaber: Naber = createNaber(vnode);

		parentNaber.children.push(newNextNaber);

		if (typeof newNextNaber.type === 'function') {
			const newChildVNode: VNode = callFunctionComponent(
				newNextNaber,
				newNextNaber.type,
				vnode.props,
			);

			const newChildNaber = createNaber(newChildVNode);
			// 함수형 컴포넌트 호출 후 부모와 연결
			newNextNaber.children = [newChildNaber];
			const children = newChildVNode.props.children ?? [];
			buildNaberTree(newChildNaber, children);
		} else {
			const children = vnode.props.children ?? [];
			buildNaberTree(newNextNaber, children);
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
	setNaberRoot(naberRoot);

	if (typeof vnode.type !== 'function') {
		buildNaberTree(naberRoot, vnode.props.children);
		return naberRoot;
	}

	const newChildVNode: VNode = callFunctionComponent(
		naberRoot,
		naberRoot.type as Function,
		vnode.props,
	);
	const newChildNaber: Naber = createNaber(newChildVNode);
	naberRoot.children = [newChildNaber];
	const children: VNode[] = newChildVNode.props.children || [];
	buildNaberTree(newChildNaber, children);

	return naberRoot;
};

export {
	setCurrentlyRenderingNaber,
	getNaberRoot,
	getCurrentWorkingNaber,
	getNaberTree,
	createNaber,
	buildNaberTree,
};
