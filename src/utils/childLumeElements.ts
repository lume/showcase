import {createMemo} from 'solid-js'
import type {Element3D} from 'lume'
import {childElements} from './childElements.js'
import {arraysEqual} from './arraysEqual.js'

export function childLumeElements(el: Element | (() => Element | undefined | null)) {
	const elements = childElements(el)
	return createMemo(() => elements().filter(el => (el as Element3D).isElement3D) as Element3D[], [], {
		equals: arraysEqual,
	})
}
