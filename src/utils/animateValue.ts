import {Easing} from '@tweenjs/tween.js'
import {createEffect, createSignal, onCleanup, untrack} from 'solid-js'

export function animateValue<T extends number>(
	getValue: () => T,
	setValue: (v: T) => {},
	targetValue: T,
	{
		duration = 1000,
		curve = Easing.Cubic.InOut,
		start,
	}: {
		/** Duration of the animation in milliseconds. */
		duration?: number
		/**
		 * The easing curve to use. The function
		 * accepts a value between 0 and 1 indicating start to finish time,
		 * and returns a value between 0 and 1 indicating start to finish
		 * position. You can pass any Tween.js Easing curve here, for
		 * example. Defaults to Tween.js Easing.Cubic.InOut
		 */
		curve?: (amount: number) => number

		/**
		 * A boolean signal that if provided, prevents the animation from
		 * starting until it is true. Toggling it back to false also stops the
		 * animation, setting back to true starts it again.
		 */
		start?: () => boolean
	} = {},
) {
	const [done, setDone] = createSignal(false)
	const startValue = untrack(getValue)

	createEffect(() => {
		if (untrack(getValue) === targetValue) return setDone(true)

		if (start && !start()) return

		let frame = 0
		const startTime = performance.now()

		frame = requestAnimationFrame(function loop(time) {
			let val = getValue()

			const elapsed = time - startTime
			const elapsedPortion = elapsed / duration
			const amount = curve(elapsedPortion > 1 ? 1 : elapsedPortion)
			const valuePortion = amount * (targetValue - startValue)

			val = (startValue + valuePortion) as T
			setValue(val)

			if (val === targetValue) return setDone(true)

			frame = requestAnimationFrame(loop)
		})

		onCleanup(() => {
			cancelAnimationFrame(frame)
			setDone(false)
		})
	})

	return done
}
