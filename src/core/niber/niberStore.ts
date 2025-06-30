import type { Niber } from '@src/shared/types';

let rootNiber: Niber | null;
let currentlyRenderingNiber: Niber | null;

function setRootNiber(arg: Niber | null): void {
	rootNiber = arg;
}

function getRootNiber() {
	return rootNiber;
}

function setCurrentlyRenderingNiber(arg: Niber | null) {
	currentlyRenderingNiber = arg;
}

function getCurrentWorkingNiber() {
	return currentlyRenderingNiber;
}

export {
	setRootNiber,
	getRootNiber,
	setCurrentlyRenderingNiber,
	getCurrentWorkingNiber,
};
