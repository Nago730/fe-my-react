import {
	activateComponentScope,
	buildNiberTree,
	createNiber,
} from '@src/core/niber';
import type { Niber, VNode } from '@src/shared/types';
import {
	buildPrevNiberMap,
	isFunctionType,
	isSameFunctionComponentType,
	isSameHostElementType,
} from './utils';

/**
 * 이전 Niber 배열과 새로운 VNode 배열을 비교하여 업데이트된 Niber 배열을 생성합니다.
 * 이 함수는 `key` 프로퍼티를 사용하여 리스트 요소의 효율적인 재조정을 시도합니다.
 *
 * 이 함수는 다음과 같은 과정을 수행합니다:
 * 1. 이전 `Niber` 배열에서 `key`를 가진 요소들의 Map을 생성하여 빠른 조회를 가능하게 합니다.
 * 2. 새로운 `VNode` 배열을 순회하며 각 `VNode`에 대해 이전 `Niber`를 찾습니다.
 * - `VNode`에 `key`가 존재하면, 해당 `key`로 이전 Map에서 일치하는 `Niber`를 찾습니다.
 * - `key`가 없거나 일치하는 `key`가 없다면, 현재 인덱스에 해당하는 이전 `Niber`를 고려합니다.
 * **주의**: `key`가 없는 요소들은 배열의 인덱스를 기준으로 비교됩니다. 이는 리스트의 중간에 요소가 삽입, 삭제 또는 이동될 경우
 * 성능 저하 및 예상치 못한 UI 업데이트를 초래할 수 있으므로, 리스트 렌더링 시에는 **항상 고유한 `key`를 사용하는 것이 강력히 권장됩니다.**
 * 3. 이전 `Niber`와 새로운 `VNode`의 타입이 동일한 경우 (`FunctionComponentDiff` 또는 `HostElementDiff`) 재사용 및 업데이트를 시도하고,
 * 타입이 다르거나 이전 `Niber`가 없는 경우에는 새로운 Niber 트리를 생성합니다 (`createNewNiberTree`).
 * 4. 재귀적으로 자식 요소들에 대해서도 `diff`를 수행하여 전체 트리를 업데이트합니다.
 *
 * @param {Niber[]} prevNibers - 이전 렌더링에서 해당 위치에 존재했던 Niber 객체들의 배열입니다.
 * @param {VNode[]} nextVNodes - 다음 렌더링을 위해 해당 위치에 존재하는 새로운 VNode 객체들의 배열입니다.
 * @returns {Niber[]} 재조정되어 업데이트된 새로운 Niber 객체들의 배열을 반환합니다.
 */
export function diff(prevNibers: Niber[], nextVNodes: VNode[]): Niber[] {
	const prevMap = buildPrevNiberMap(prevNibers);
	// JSX에서 조건부 렌더링 시 값이 false인 경우가 생김. 필터링 로직으로 구분
	const filteredNextVNodes = nextVNodes.filter((v) => typeof v === 'object');

	const newNextNibers: Niber[] = filteredNextVNodes.reduce(
		(newNextNibers: Niber[], next: VNode, i) => {
			const prev: Niber | undefined = prevNibers[i];
			const matchedByKey: Niber | null | undefined = next?.key
				? prevMap.get(next.key)
				: null;

			// 'key'가 있으면 해당 Niber를 우선적으로 사용하고, 없으면 현재 인덱스의 이전 Niber를 사용합니다.
			// 'key'가 없는 요소의 경우, 배열 인덱스 기반으로 비교가 수행되며,
			// 요소의 삽입/삭제/이동 시 비효율적인 재조정이 발생할 수 있습니다.
			const targetPrev = matchedByKey || prev;

			let newNextNiber: Niber;

			if (isSameFunctionComponentType(targetPrev, next))
				newNextNiber = FunctionComponentDiff(targetPrev, next);
			else if (isSameHostElementType(targetPrev, next))
				newNextNiber = HostElementDiff(targetPrev, next);
			else newNextNiber = createNewNiberTree(next);

			newNextNibers[i] = newNextNiber;
			return newNextNibers;
		},
		[],
	);

	return newNextNibers;
}

/**
 * 이전 Niber와 새로운 VNode가 **동일한 타입의 함수 컴포넌트**인 경우의 차이를 비교하고 처리합니다.
 *
 * 이 함수는 다음과 같은 과정을 수행합니다:
 * 1. `nextVNode`를 기반으로 새로운 Niber 객체를 생성합니다.
 * 2. 이전 `prevNiber`가 가지고 있던 **`memoizedState` (컴포넌트의 상태)**를 새로 생성된 Niber로 복사하여 상태를 보존합니다.
 * 3. 새로운 Niber의 타입(함수 컴포넌트)을 `nextVNode.props`와 함께 실행하여 새로운 자식 VNode들을 얻습니다.
 * 4. 이전 Niber의 자식들(`prevNiber.children`)과 새로 얻은 자식 VNode들을 `diff` 함수를 통해 **재귀적으로 비교**하고, 그 결과를 현재 Niber의 자식으로 설정합니다.
 *
 * 이 함수는 항상 **새롭게 생성된 Niber 객체**를 반환하며, 이 객체는 이전 컴포넌트의 상태와 재귀적으로 업데이트된 자식 Niber들을 포함합니다.
 *
 * @param {Niber} prevNiber - 이전 렌더링에서 해당 위치에 존재했던 함수 컴포넌트 Niber 객체입니다.
 * @param {VNode} nextVNode - 다음 렌더링을 위해 해당 위치에 존재하는 새로운 함수 컴포넌트 VNode 객체입니다.
 * @returns {Niber} 이전 Niber의 상태를 계승하고 자식들이 재귀적으로 비교되어 업데이트된 **새로운 Niber 객체**를 반환합니다.
 */
function FunctionComponentDiff(prevNiber: Niber, nextVNode: VNode): Niber {
	const newNextNiber: Niber = createNiber(nextVNode);
	newNextNiber.memoizedState = prevNiber.memoizedState;

	const newNextVNode: VNode =
		activateComponentScope(newNextNiber, nextVNode.props) || [];

	const newNextNiberChildren: Niber[] = diff(prevNiber.children, [
		newNextVNode,
	]);
	newNextNiber.children = newNextNiberChildren;

	return newNextNiber;
}

/**
 * 이전 Niber와 새로운 VNode가 **동일한 타입의 호스트 엘리먼트** (예: `div`, `span` 등의 HTML 태그)인 경우의 차이를 비교하고 처리합니다.
 *
 * 이 함수는 다음과 같은 과정을 수행합니다:
 * 1. `nextVNode`를 기반으로 새로운 Niber 객체를 생성합니다.
 * 2. 호스트 엘리먼트는 함수 컴포넌트처럼 `memoizedState`를 직접 관리하지 않으므로, 상태 복사 과정은 없습니다.
 * 3. `nextVNode.props.children`에서 새로운 자식 VNode들을 가져옵니다.
 * 4. 이전 Niber의 자식들(`prevNiber.children`)과 새로 얻은 자식 VNode들을 `diff` 함수를 통해 **재귀적으로 비교**하고, 그 결과를 현재 Niber의 자식으로 설정합니다.
 *
 * 이 함수는 항상 **새롭게 생성된 Niber 객체**를 반환하며, 이 객체는 재귀적으로 업데이트된 자식 Niber들을 포함합니다.
 * (참고: 호스트 엘리먼트 자체의 `props` 변경에 대한 직접적인 DOM 업데이트 로직은 이 함수에서 처리하지 않습니다.)
 *
 * @param {Niber} prevNiber - 이전 렌더링에서 해당 위치에 존재했던 호스트 엘리먼트 Niber 객체입니다.
 * @param {VNode} nextVNode - 다음 렌더링을 위해 해당 위치에 존재하는 새로운 호스트 엘리먼트 VNode 객체입니다.
 * @returns {Niber} 자식들이 재귀적으로 비교되어 업데이트된 **새로운 Niber 객체**를 반환합니다.
 */
function HostElementDiff(prevNiber: Niber, nextVNode: VNode): Niber {
	const newNextNiber = createNiber(nextVNode);
	const newNextVNodes = nextVNode.props.children || [];

	const newNextNiberChildren = diff(prevNiber.children, newNextVNodes);
	newNextNiber.children = newNextNiberChildren;

	return newNextNiber;
}

/**
 * 주어진 VNode를 기반으로 **완전히 새로운 Niber 트리**를 생성합니다.
 * 이 함수는 기존의 Niber 정보나 상태를 재사용하지 않고, 지정된 VNode로부터 새로운 Niber 객체를 만들고
 * 해당 Niber의 하위 트리를 처음부터 (재조정 없이) 구축합니다.
 *
 * 주로 다음 경우에 사용됩니다:
 * - 이전 렌더링에 존재하지 않았던 **새로운 컴포넌트나 엘리먼트**가 추가될 때.
 * - 이전 컴포넌트나 엘리먼트의 **타입이 변경될 때** (예: `div`가 `span`으로 바뀌거나, `ComponentA`가 `ComponentB`로 바뀔 때).
 *
 * 함수 컴포넌트의 경우: VNode의 타입을 함수로 실행하여 자식 VNode들을 얻습니다.
 * 호스트 엘리먼트의 경우: VNode의 `props.children`에서 자식 VNode들을 직접 가져옵니다.
 *
 * @param {VNode} vnode - Niber로 변환하고 하위 트리를 구축할 대상이 되는 가상 노드입니다.
 * @returns {Niber} `vnode`로부터 **새롭게 생성되고 하위 트리까지 구축이 완료된 Niber 객체**를 반환합니다.
 */
function createNewNiberTree(vnode: VNode): Niber {
	const newNiber: Niber = createNiber(vnode);
	let newNextVNode: VNode;

	if (isFunctionType(newNiber.type))
		newNextVNode = activateComponentScope(newNiber, vnode.props);
	else newNextVNode = vnode.props.children;

	buildNiberTree(newNiber, [newNextVNode]);

	return newNiber;
}
