import {createEffect, createMemo, createSignal, onCleanup} from 'solid-js'
import {createArrayMemo} from './createArrayMemo.js'

export function slottedElements(slot: HTMLSlotElement | (() => HTMLSlotElement | null | undefined)) {
	const slotMemo = createMemo(() => (typeof slot === 'function' ? slot() : slot))
	const [slotchange, setSlotchange] = createSignal(0)

	createEffect(() => {
		const slot = slotMemo()
		if (!slot) return

		const onslotchange = () => setSlotchange(slotchange() + 1)
		slot.addEventListener('slotchange', onslotchange)
		onCleanup(() => slot.removeEventListener('slotchange', onslotchange))
	})

	// TODO return [] if the slot is further assigned to a lower slot?
	return createArrayMemo(() => {
		const slot = slotMemo()
		if (!slot) return []
		slotchange()
		return slot.assignedElements({flatten: true})
	})
}
