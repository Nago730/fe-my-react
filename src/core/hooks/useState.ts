import { getCurrentWorkingNiber } from '@src/core/niber/niberStore';
import { updateComponent } from '@src/core/render';
import type { Niber } from '@src/shared/types';

export function useState<T>(initialValue: T): [T, (newValue: T) => void] {
	const currentWorkingNiber: Niber | null = getCurrentWorkingNiber();
	if (!currentWorkingNiber)
		throw new Error(
			'useState는 함수형 컴포넌트 내부에서만 호출될 수 있습니다.',
		);

	const { memoizedState, hookIndex } = currentWorkingNiber;
	const oldState = memoizedState[hookIndex];
	const state: T = oldState === undefined ? initialValue : oldState;
	memoizedState[hookIndex] = state;

	const setState = (param: T) => {
		if (typeof param === 'function') memoizedState[hookIndex] = param(state);
		else memoizedState[hookIndex] = param;

		updateComponent(currentWorkingNiber);
	};

	currentWorkingNiber.hookIndex++;

	return [state, setState];
}
