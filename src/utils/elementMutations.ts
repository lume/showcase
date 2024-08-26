import {createSignal, onCleanup} from 'solid-js'

export function elementMutations(el: Element, options: MutationObserverInit) {
	const [records, setRecords] = createSignal<MutationRecord[]>([])
	const observer = new MutationObserver(setRecords)
	observer.observe(el, options)
	const dispose = onCleanup(() => observer.disconnect())
	return {records, dispose}
}
