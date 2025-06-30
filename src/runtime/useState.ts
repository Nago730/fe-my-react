import { updateComponent } from '../core';
import type { Naber } from '../types/base.types';
import { getCurrentWorkingNaber } from './naberStore';

export function useState<T>(initialValue: T): [T, (newValue: T) => void] {
	const currentWorkingNaber: Naber | null = getCurrentWorkingNaber();
	if (!currentWorkingNaber)
		throw new Error(
			'useState는 함수형 컴포넌트 내부에서만 호출될 수 있습니다.',
		);

	const { memoizedState, hookIndex } = currentWorkingNaber;
	const oldState = memoizedState[hookIndex];
	const state: T = oldState === undefined ? initialValue : oldState;
	memoizedState[hookIndex] = state;

	const setState = (param: T) => {
		if (typeof param === 'function') memoizedState[hookIndex] = param(state);
		else memoizedState[hookIndex] = param;

		updateComponent(currentWorkingNaber);
	};

	currentWorkingNaber.hookIndex++;

	return [state, setState];
}
