import type { Naber } from '@src/types/base.types';

let rootNaber: Naber | null;
let currentlyRenderingNaber: Naber | null;

function setRootNaber(arg: Naber | null): void {
	rootNaber = arg;
}

function getRootNaber() {
	return rootNaber;
}

function setCurrentlyRenderingNaber(arg: Naber | null) {
	currentlyRenderingNaber = arg;
}

function getCurrentWorkingNaber() {
	return currentlyRenderingNaber;
}

export {
	setRootNaber,
	getRootNaber,
	setCurrentlyRenderingNaber,
	getCurrentWorkingNaber,
};
