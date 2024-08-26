import {createMemo, createSignal, onCleanup} from 'solid-js'
import {arraysEqual} from './arraysEqual.js'

export function slottedElements(slot: HTMLSlotElement) {
	// Trigger reactivity whenever slotted children change.
	const [slotchange, setSlotchange] = createSignal(0)
	const scrollContainerSlot = slot

	const onslotchange = () => setSlotchange(slotchange() + 1)

	// Trigger reactivity whenever slotted children change.
	scrollContainerSlot.addEventListener('slotchange', onslotchange)

	const dispose = onCleanup(() => scrollContainerSlot.removeEventListener('slotchange', onslotchange))

	// TODO return [] if the slot is further assigned to a lower slot?
	return {
		elements: createMemo(() => (slotchange(), slot.assignedElements({flatten: true})), [], {equals: arraysEqual}),
		dispose,
	}
}
