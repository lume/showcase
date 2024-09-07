import {createMemo} from 'solid-js'
import {elementMutations} from './elementMutations.js'
import {createArrayMemo} from './createArrayMemo.js'

export function childElements(element: Element | (() => Element | undefined | null)) {
	const records = elementMutations(element, {childList: true})
	const elMemo = createMemo(() => (typeof element === 'function' ? element() : element))

	const elements = createArrayMemo(() => {
		const el = elMemo()
		if (!el) return [] as Element[]
		records()
		return Array.from(el.children)
	})

	return elements
}
