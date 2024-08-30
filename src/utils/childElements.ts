import {createEffect, createMemo} from 'solid-js'
import {elementMutations} from './elementMutations.js'
import {arraysEqual} from './arraysEqual.js'

export function childElements(element: Element | (() => Element | undefined | null)) {
	const records = elementMutations(element, {childList: true})
	const elMemo = createMemo(() => (typeof element === 'function' ? element() : element))

	const elements = createMemo(
		() => {
			const el = elMemo()
			if (!el) return [] as Element[]
			records()
			return Array.from(el.children)
		},
		[],
		{equals: arraysEqual},
	)

	return elements
}
