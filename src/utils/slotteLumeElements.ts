import {createMemo} from 'solid-js'
import type {Element3D} from 'lume'
import {slottedElements} from './slottedElements.js'
import {arraysEqual} from './arraysEqual.js'

export function slottedLumeElements(slot: HTMLSlotElement) {
	const {elements, dispose} = slottedElements(slot)

	return {
		elements: createMemo(() => elements().filter(el => (el as Element3D).isElement3D) as Element3D[], [], {
			equals: arraysEqual,
		}),
		dispose,
	}
}
