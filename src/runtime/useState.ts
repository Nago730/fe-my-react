import type { Naber, VNode } from '../types/base.types';
import { buildNaberTree, createNaber, getCurrentWorkingNaber } from './naber';
import { TAG, getTag } from './tag';

export function useState<T>(initialValue: T): [T, (newValue: T) => void] {
	const currentWorkingNaber: Naber | null = getCurrentWorkingNaber();
	if (!currentWorkingNaber) throw new Error('현재 작업 중인 Naber가 없습니다');

	// 현재 Fiber의 hookIndex에 해당하는 상태를 가져오거나 초기값으로 설정합니다.
	const { memoizedState, hookIndex } = currentWorkingNaber;
	const oldState = memoizedState[hookIndex];
	const state: T = oldState === undefined ? initialValue : oldState;

	// setState 함수
	const setState = (param: T) => {
		if (typeof param === 'function') memoizedState[hookIndex] = param(state);
		else memoizedState[hookIndex] = param;

		reRender(currentWorkingNaber);
	};

	// 다음 useState 호출을 위해 hookIndex를 증가시킵니다.
	currentWorkingNaber.hookIndex++;

	return [state, setState];
}

export function reRender(currentWorkingNaber: Naber) {
	const { children: prevNaberChildren, type: FC } = currentWorkingNaber;
	const nextNaberChildren: VNode[] = (FC as Function)();

	diff(prevNaberChildren, nextNaberChildren);
}

/**
 * 작성 중...
 * @param parentNaber
 * @param prevNaber
 * @param nextNaber
 */
function diff(prev: Naber[], next: VNode[]): void {
	const prevMap = new Map();
	// prev를 순회하며 prevMap 완성

	let nextVNode: VNode;

	for (let i = 0; i < Math.max(prev.length, next.length); i++) {
		const currentPrevNaber = prev[i];
		const currentNextVNode = next[i];
		// type이 FC일 때
		if (typeof currentNextVNode.type === 'function') {
			// FC를 호출하여 prevNaber와 비교할 nextVNode를 생성
			nextVNode = (currentNextVNode.type as Function)(currentNextVNode.props);
			// type이 string일 때
		} else if (typeof currentNextVNode.type === 'string') {
			// currentNextVNode에 key가 존재할 때
			if (currentNextVNode.key) {
				// prevMap에 key가 존재할 때 diff 재귀
				if (prevMap.get(currentNextVNode.key)) {
					// prevMap에 key가 존재하고, type도 같은지 확인
					const isEqualType = isSameType(
						prevMap.get(currentNextVNode.key),
						currentNextVNode,
					);
					// type까지 같으면 diff
					if (isEqualType)
						diff(currentPrevNaber.children, currentNextVNode.props.children);
					// type은 다르면 buildNaberTree
					else buildNaberTree(currentNextVn);
				}
				// prevMap에 key가 없을 때 buildNaberTree 재귀
				else
					buildNaberTree(
						createNaber(currentNextVNode),
						currentNextVNode.props.children,
					);
			} else {
				// typeof type === string, currentNextVNode.key === null 일 때
				// currentPrevNaber와 currentNextVNode의 얕은 비교
				const isSame = isSameNaber(currentPrevNaber, currentNextVNode);
				// 같은 노드면 diff 재귀
				if (isSame) diff();
				// 다르면 buildNaberTree 재귀
				else
					buildNaberTree(
						createNaber(currentNextVNode),
						currentNextVNode.props.children,
					);
			}
		}
	}
}

function isSameType(prev: Naber, next: VNode): boolean {
	if (prev.key !== next.key) return false;
	return true;
}

function isSameNaber(prev: Naber, next: VNode): boolean {
	if (prev.key !== next.key) return false;
	if (prev.type !== next.type) return false;
	return true;
}

// function isSameNaber(prev: Naber, next: Naber): boolean {
// 	if (prev.key !== next.key) return false;
// 	if (prev.type !== next.type) return false;
// 	// props shallow compare
// 	for (const key in prev.props)
// 		if (prev.props[key] !== next.props[key]) return false;

// 	for (const key in next.props)
// 		if (next.props[key] !== prev.props[key]) return false;

// 	return true;
// }
