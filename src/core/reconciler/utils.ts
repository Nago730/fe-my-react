import type { Naber, VNode } from '@src/shared/types';
import type { NaberMap } from './types';

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
		!!targetPrev && isFunctionType(next.type) && targetPrev.type === next.type
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
		!!targetPrev && !isFunctionType(next.type) && targetPrev.type === next.type
	);
}

export {
	buildPrevNaberMap,
	isFunctionType,
	isSameFunctionComponentType,
	isSameHostElementType,
};
