import type { MutableRefObject, Ref, VNodeProps } from '../types/base.types';

export function applyRef(dom: Node, ref: Ref | undefined) {
	if (typeof ref === 'function') {
		ref(dom);
	} else if (ref && typeof ref === 'object' && 'current' in ref) {
		(ref as MutableRefObject<Node>).current = dom;
	}
}

export function applyProps(dom: Node, props: VNodeProps) {
	for (const [key, value] of Object.entries(props)) {
		if (key === 'children') continue;

		// 'onClick' 속성만 특별히 처리합니다.
		if (key === 'onclick' && typeof value === 'function') {
			// DOM 요소에 클릭 이벤트 리스너를 추가합니다.
			(dom as Element).addEventListener('click', value);
		} else {
			// 그 외의 모든 속성은 기존처럼 할당합니다.
			(dom as any)[key] = value;
		}
	}
}
