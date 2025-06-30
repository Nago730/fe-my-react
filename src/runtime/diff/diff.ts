import { callFunctionComponent } from '@src/renderUtils';
import type { Naber, VNode } from '../../types/base.types';
import { buildNaberTree, createNaber } from '../naber';
import type { NaberMap } from './diff.types';

/**
 * 이전 Naber 배열과 새로운 VNode 배열을 비교하여 업데이트된 Naber 배열을 생성합니다.
 * 이 함수는 `key` 프로퍼티를 사용하여 리스트 요소의 효율적인 재조정을 시도합니다.
 *
 * 이 함수는 다음과 같은 과정을 수행합니다:
 * 1. 이전 `Naber` 배열에서 `key`를 가진 요소들의 Map을 생성하여 빠른 조회를 가능하게 합니다.
 * 2. 새로운 `VNode` 배열을 순회하며 각 `VNode`에 대해 이전 `Naber`를 찾습니다.
 * - `VNode`에 `key`가 존재하면, 해당 `key`로 이전 Map에서 일치하는 `Naber`를 찾습니다.
 * - `key`가 없거나 일치하는 `key`가 없다면, 현재 인덱스에 해당하는 이전 `Naber`를 고려합니다.
 * **주의**: `key`가 없는 요소들은 배열의 인덱스를 기준으로 비교됩니다. 이는 리스트의 중간에 요소가 삽입, 삭제 또는 이동될 경우
 * 성능 저하 및 예상치 못한 UI 업데이트를 초래할 수 있으므로, 리스트 렌더링 시에는 **항상 고유한 `key`를 사용하는 것이 강력히 권장됩니다.**
 * 3. 이전 `Naber`와 새로운 `VNode`의 타입이 동일한 경우 (`FunctionComponentDiff` 또는 `HostElementDiff`) 재사용 및 업데이트를 시도하고,
 * 타입이 다르거나 이전 `Naber`가 없는 경우에는 새로운 Naber 트리를 생성합니다 (`createNewNaberTree`).
 * 4. 재귀적으로 자식 요소들에 대해서도 `diff`를 수행하여 전체 트리를 업데이트합니다.
 *
 * @param {Naber[]} prevNabers - 이전 렌더링에서 해당 위치에 존재했던 Naber 객체들의 배열입니다.
 * @param {VNode[]} nextVNodes - 다음 렌더링을 위해 해당 위치에 존재하는 새로운 VNode 객체들의 배열입니다.
 * @returns {Naber[]} 재조정되어 업데이트된 새로운 Naber 객체들의 배열을 반환합니다.
 */
export function diff(prevNabers: Naber[], nextVNodes: VNode[]): Naber[] {
	const prevMap = buildPrevNaberMap(prevNabers);
	// JSX에서 조건부 렌더링 시 값이 false인 경우가 생김. 필터링 로직으로 구분
	const filteredNextVNodes = nextVNodes.filter((v) => typeof v === 'object');

	const newNextNabers: Naber[] = filteredNextVNodes.reduce(
		(newNextNabers: Naber[], next: VNode, i) => {
			const prev: Naber | undefined = prevNabers[i];
			const matchedByKey: Naber | null | undefined = next?.key
				? prevMap.get(next.key)
				: null;

			// 'key'가 있으면 해당 Naber를 우선적으로 사용하고, 없으면 현재 인덱스의 이전 Naber를 사용합니다.
			// 'key'가 없는 요소의 경우, 배열 인덱스 기반으로 비교가 수행되며,
			// 요소의 삽입/삭제/이동 시 비효율적인 재조정이 발생할 수 있습니다.
			const targetPrev = matchedByKey || prev;

			let newNextNaber: Naber;

			if (isSameFunctionComponentType(targetPrev, next))
				newNextNaber = FunctionComponentDiff(targetPrev, next);
			else if (isSameHostElementType(targetPrev, next))
				newNextNaber = HostElementDiff(targetPrev, next);
			else newNextNaber = createNewNaberTree(next);

			newNextNabers[i] = newNextNaber;
			return newNextNabers;
		},
		[],
	);

	return newNextNabers;
}

/**
 * 이전 Naber와 새로운 VNode가 **동일한 타입의 함수 컴포넌트**인 경우의 차이를 비교하고 처리합니다.
 *
 * 이 함수는 다음과 같은 과정을 수행합니다:
 * 1. `nextVNode`를 기반으로 새로운 Naber 객체를 생성합니다.
 * 2. 이전 `prevNaber`가 가지고 있던 **`memoizedState` (컴포넌트의 상태)**를 새로 생성된 Naber로 복사하여 상태를 보존합니다.
 * 3. 새로운 Naber의 타입(함수 컴포넌트)을 `nextVNode.props`와 함께 실행하여 새로운 자식 VNode들을 얻습니다.
 * 4. 이전 Naber의 자식들(`prevNaber.children`)과 새로 얻은 자식 VNode들을 `diff` 함수를 통해 **재귀적으로 비교**하고, 그 결과를 현재 Naber의 자식으로 설정합니다.
 *
 * 이 함수는 항상 **새롭게 생성된 Naber 객체**를 반환하며, 이 객체는 이전 컴포넌트의 상태와 재귀적으로 업데이트된 자식 Naber들을 포함합니다.
 *
 * @param {Naber} prevNaber - 이전 렌더링에서 해당 위치에 존재했던 함수 컴포넌트 Naber 객체입니다.
 * @param {VNode} nextVNode - 다음 렌더링을 위해 해당 위치에 존재하는 새로운 함수 컴포넌트 VNode 객체입니다.
 * @returns {Naber} 이전 Naber의 상태를 계승하고 자식들이 재귀적으로 비교되어 업데이트된 **새로운 Naber 객체**를 반환합니다.
 */
function FunctionComponentDiff(prevNaber: Naber, nextVNode: VNode): Naber {
	const newNextNaber: Naber = createNaber(nextVNode);
	newNextNaber.memoizedState = prevNaber.memoizedState;

	const newNextVNode: VNode =
		callFunctionComponent(
			newNextNaber,
			newNextNaber.type as Function,
			nextVNode.props,
		) || [];

	const newNextNaberChildren: Naber[] = diff(prevNaber.children, [
		newNextVNode,
	]);
	newNextNaber.children = newNextNaberChildren;

	return newNextNaber;
}

/**
 * 이전 Naber와 새로운 VNode가 **동일한 타입의 호스트 엘리먼트** (예: `div`, `span` 등의 HTML 태그)인 경우의 차이를 비교하고 처리합니다.
 *
 * 이 함수는 다음과 같은 과정을 수행합니다:
 * 1. `nextVNode`를 기반으로 새로운 Naber 객체를 생성합니다.
 * 2. 호스트 엘리먼트는 함수 컴포넌트처럼 `memoizedState`를 직접 관리하지 않으므로, 상태 복사 과정은 없습니다.
 * 3. `nextVNode.props.children`에서 새로운 자식 VNode들을 가져옵니다.
 * 4. 이전 Naber의 자식들(`prevNaber.children`)과 새로 얻은 자식 VNode들을 `diff` 함수를 통해 **재귀적으로 비교**하고, 그 결과를 현재 Naber의 자식으로 설정합니다.
 *
 * 이 함수는 항상 **새롭게 생성된 Naber 객체**를 반환하며, 이 객체는 재귀적으로 업데이트된 자식 Naber들을 포함합니다.
 * (참고: 호스트 엘리먼트 자체의 `props` 변경에 대한 직접적인 DOM 업데이트 로직은 이 함수에서 처리하지 않습니다.)
 *
 * @param {Naber} prevNaber - 이전 렌더링에서 해당 위치에 존재했던 호스트 엘리먼트 Naber 객체입니다.
 * @param {VNode} nextVNode - 다음 렌더링을 위해 해당 위치에 존재하는 새로운 호스트 엘리먼트 VNode 객체입니다.
 * @returns {Naber} 자식들이 재귀적으로 비교되어 업데이트된 **새로운 Naber 객체**를 반환합니다.
 */
function HostElementDiff(prevNaber: Naber, nextVNode: VNode): Naber {
	const newNextNaber = createNaber(nextVNode);
	const newNextVNodes = nextVNode.props.children || [];

	const newNextNaberChildren = diff(prevNaber.children, newNextVNodes);
	newNextNaber.children = newNextNaberChildren;

	return newNextNaber;
}

/**
 * 주어진 VNode를 기반으로 **완전히 새로운 Naber 트리**를 생성합니다.
 * 이 함수는 기존의 Naber 정보나 상태를 재사용하지 않고, 지정된 VNode로부터 새로운 Naber 객체를 만들고
 * 해당 Naber의 하위 트리를 처음부터 (재조정 없이) 구축합니다.
 *
 * 주로 다음 경우에 사용됩니다:
 * - 이전 렌더링에 존재하지 않았던 **새로운 컴포넌트나 엘리먼트**가 추가될 때.
 * - 이전 컴포넌트나 엘리먼트의 **타입이 변경될 때** (예: `div`가 `span`으로 바뀌거나, `ComponentA`가 `ComponentB`로 바뀔 때).
 *
 * 함수 컴포넌트의 경우: VNode의 타입을 함수로 실행하여 자식 VNode들을 얻습니다.
 * 호스트 엘리먼트의 경우: VNode의 `props.children`에서 자식 VNode들을 직접 가져옵니다.
 *
 * @param {VNode} vnode - Naber로 변환하고 하위 트리를 구축할 대상이 되는 가상 노드입니다.
 * @returns {Naber} `vnode`로부터 **새롭게 생성되고 하위 트리까지 구축이 완료된 Naber 객체**를 반환합니다.
 */
function createNewNaberTree(vnode: VNode): Naber {
	const newNaber: Naber = createNaber(vnode);
	let newNextVNode: VNode;

	if (isFunctionType(newNaber.type))
		newNextVNode = callFunctionComponent(
			newNaber,
			newNaber.type as Function,
			vnode.props,
		);
	else newNextVNode = vnode.props.children;

	buildNaberTree(newNaber, [newNextVNode]);

	return newNaber;
}

/**
 * 이전 Naber 배열(`prevNabers`)에서 `key` 프로퍼티를 가진 Naber 객체들만을 추출하여 Map을 생성합니다.
 * 이 Map은 `key`를 기준으로 Naber 객체를 빠르게 찾아낼 수 있도록 최적화된 자료구조입니다.
 *
 * 이는 리스트 렌더링 시 요소의 추가, 삭제, 이동을 효율적으로 감지하고,
 * `key`가 일치하는 이전 요소를 새로운 위치에서 찾아내어 재사용하는 데 중요한 역할을 합니다.
 * `key`가 없는 Naber 객체는 Map에 포함되지 않습니다.
 *
 * @param {Naber[]} prevNabers - 이전 렌더링에서 생성된 Naber 배열입니다.
 * @returns {Map<string | number, Naber>} `key`가 있는 Naber 객체들만을 담은 Map 객체를 반환합니다.
 * Map의 키는 Naber의 `key` 프로퍼티(문자열 또는 숫자)이고, 값은 해당 Naber 객체입니다.
 */
function buildPrevNaberMap(prevNabers: Naber[]): NaberMap {
	const map = new Map<string | number, Naber>();

	return prevNabers.reduce((accMap, naber) => {
		if (naber.key) accMap.set(naber.key, naber);
		return accMap;
	}, map);
}

/**
 * 주어진 'type'이 JavaScript 함수인지 여부를 확인합니다.
 * 이 유틸리티 함수는 VNode의 'type' 속성이 함수 컴포넌트인지 (예: `MyComponent`) 아니면
 * 호스트 엘리먼트(HTML 태그 문자열, 예: `'div'`)인지를 구분하는 데 사용됩니다.
 *
 * @param {any} type - 확인할 값. 일반적으로 VNode의 `type` 속성입니다.
 * @returns {boolean} `type`이 'function'이면 `true`를 반환하고, 그렇지 않으면 `false`를 반환합니다.
 */
function isFunctionType(type: any): boolean {
	return typeof type === 'function';
}

/**
 * 이전 Naber와 현재 Naber가 동일한 함수 컴포넌트 타입인지 확인합니다.
 * @param targetPrev 이전 Naber (선택적)
 * @param next 현재 Naber
 * @returns 두 Naber가 동일한 함수 컴포넌트 타입이면 true, 그렇지 않으면 false.
 */
function isSameFunctionComponentType(
	targetPrev: Naber | null,
	next: VNode,
): boolean {
	return (
		targetPrev !== null &&
		isFunctionType(next.type) &&
		targetPrev.type === next.type
	);
}

/**
 * 이전 Naber와 현재 Naber가 동일한 호스트 엘리먼트 타입인지 확인합니다.
 * @param targetPrev 이전 Naber (선택적)
 * @param next 현재 Naber
 * @returns 두 Naber가 동일한 호스트 엘리먼트 타입이면 true, 그렇지 않으면 false.
 */
function isSameHostElementType(targetPrev: Naber | null, next: VNode): boolean {
	return (
		targetPrev !== null &&
		!isFunctionType(next.type) &&
		targetPrev.type === next.type
	);
}
