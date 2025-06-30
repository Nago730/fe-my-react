import { setCurrentlyRenderingNiber } from '@src/core/niber';
import type { Niber, VNode } from '@src/shared/types';

/**
 * 함수형 컴포넌트 렌더링 시 현재 작업 중인 Niber를 설정하고 해제하는 스코프를 제공합니다.
 * 이 함수는 useState와 같은 훅이 올바른 Niber에 연결되도록 합니다.
 *
 * @param {Niber} niber - 현재 렌더링될 함수형 컴포넌트의 Niber 객체
 * @param {Function} ComponentType - 렌더링할 함수형 컴포넌트의 타입
 * @param {VNode['props']} props -
 *  함수형 컴포넌트에 전달될 props
 * @returns {VNode} 함수형 컴포넌트가 반환하는 VNode
 */
export function activateComponentScope(
	niber: Niber,
	props: VNode['props'],
): VNode {
	// 훅의 인덱스를 초기화합니다. (매 렌더링마다 훅의 순서가 동일해야 함)
	niber.hookIndex = 0;

	// 현재 작업 중인 Niber를 설정하여 useState와 같은 훅이 이 Niber에 연결되도록 합니다.
	setCurrentlyRenderingNiber(niber);

	// 함수형 컴포넌트를 호출하여 VNode를 얻습니다.
	const newVNode = (niber.type as Function)(props);

	// 컴포넌트 렌더링이 완료된 후, 현재 작업 중인 Niber를 초기화합니다.
	// 이는 다음 훅 호출이 이전 컴포넌트의 Niber에 잘못 연결되는 것을 방지합니다.
	setCurrentlyRenderingNiber(null);

	return newVNode;
}
