import { setRootNiber } from '@src/core/niber';
import { activateComponentScope } from '@src/core/niber/utils';
import type { Niber, VNode } from '@src/shared/types';

/**
 * 단일 VNode를 기반으로 Niber 객체를 생성합니다.
 * @param {VNode} vnode - 변환 대상 VNode
 * @returns {Niber} 생성된 Niber 객체
 */
const createNiber = (vnode: VNode): Niber => {
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
 * Niber 트리를 재귀적으로 구축합니다.
 * @param {Niber} parentNiber - 현재 부모 Niber 객체
 * @param {VNode[]} vnodeChildren - 자식 VNode 목록
 */
const buildNiberTree = (parentNiber: Niber, vnodeChildren: VNode[]): void => {
	for (const vnode of vnodeChildren) {
		// 조건부 렌더링 시 vnodeChildren에 [false]가 들어오면 vnode가 false가 됨
		// vnode가 객체가 아니므로 createNiber 에러 발생
		// false일 경우 return
		if (!vnode) return;
		const newNextNiber: Niber = createNiber(vnode);

		parentNiber.children.push(newNextNiber);

		if (typeof newNextNiber.type === 'function') {
			const newChildVNode: VNode = activateComponentScope(
				newNextNiber,
				vnode.props,
			);

			const newChildNiber = createNiber(newChildVNode);
			// 함수형 컴포넌트 호출 후 부모와 연결
			newNextNiber.children = [newChildNiber];
			const children = newChildVNode.props.children ?? [];
			buildNiberTree(newChildNiber, children);
		} else {
			const children = vnode.props.children ?? [];
			buildNiberTree(newNextNiber, children);
		}
	}
};

/**
 * 주어진 VNode를 기반으로 전체 Niber 트리를 생성합니다.
 * @param {VNode} vnode - 루트 VNode
 * @returns {Niber} 구축된 Niber 트리의 루트 객체
 */
const getNiberTree = (vnode: VNode): Niber => {
	const niberRoot: Niber = createNiber(vnode);
	setRootNiber(niberRoot);

	if (typeof vnode.type !== 'function') {
		buildNiberTree(niberRoot, vnode.props.children);
		return niberRoot;
	}

	const newChildVNode: VNode = activateComponentScope(niberRoot, vnode.props);
	const newChildNiber: Niber = createNiber(newChildVNode);
	niberRoot.children = [newChildNiber];
	const children: VNode[] = newChildVNode.props.children || [];
	buildNiberTree(newChildNiber, children);

	return niberRoot;
};

export { getNiberTree, createNiber, buildNiberTree };
