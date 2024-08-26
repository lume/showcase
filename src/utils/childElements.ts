import {createMemo} from 'solid-js'
import {elementMutations} from './elementMutations.js'
import {arraysEqual} from './arraysEqual.js'

export function childElements(el: Element) {
	const {records, dispose} = elementMutations(el, {childList: true})

	const elements = createMemo(
		() => {
			records()
			return Array.from(el.children)
		},
		[],
		{equals: arraysEqual},
	)

	return {elements, dispose}
}
