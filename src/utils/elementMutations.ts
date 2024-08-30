import {createEffect, createMemo, createSignal, onCleanup} from 'solid-js'

export function elementMutations(element: Element | (() => Element | undefined | null), options: MutationObserverInit) {
	const [records, setRecords] = createSignal<MutationRecord[]>([])
	const elMemo = createMemo(() => (typeof element === 'function' ? element() : element))

	createEffect(() => {
		const el = elMemo()
		if (!el) return

		const observer = new MutationObserver(setRecords)
		observer.observe(el, options)

		onCleanup(() => observer.disconnect())
	})

	return records
}
