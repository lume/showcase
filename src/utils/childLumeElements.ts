import {createMemo} from 'solid-js'
import type {Element3D} from 'lume'
import {childElements} from './childElements.js'
import {arraysEqual} from './arraysEqual.js'

export function childLumeElements(el: Element) {
	const {elements, dispose} = childElements(el)
	return {
		elements: createMemo(() => elements().filter(el => (el as Element3D).isElement3D) as Element3D[], [], {
			equals: arraysEqual,
		}),
		dispose,
	}
}
