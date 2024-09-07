import {createEffect, createSignal, onCleanup} from 'solid-js'

export function timeout(duration = 0, start?: () => boolean) {
	const [done, setDone] = createSignal(false)

	createEffect(() => {
		if (start && !start()) return
		const timeout = setTimeout(() => setDone(true), duration)
		onCleanup(() => clearTimeout(timeout))
	})

	return done
}
