import { FRAGMENT, TEXT_ELEMENT } from '../core';

export const TAG = {
	FunctionComponent: 'FunctionComponent',
	HostComponent: 'HostComponent',
	Fragment: 'Fragment',
	Text: 'Text',
	Unknown: 'Unknown',
} as const;

export type FiberTag = (typeof TAG)[keyof typeof TAG];

export function getTag(type: any): FiberTag {
	if (typeof type === 'function') return TAG.FunctionComponent;
	if (typeof type === 'string') return TAG.HostComponent;
	if (type === FRAGMENT) return TAG.Fragment;
	if (type === TEXT_ELEMENT) return TAG.Text;
	return TAG.Unknown;
}
