// TODO we need to be able to easily calculate the min/max X/Y position of
// elements, taking into account both regular position as well as mount point
// and align point. Perhaps all elements can have a calculatedPosition, similar
// to calculatedSize, that gives us absolute X/Y/Z relative to a parent taking
// into account mount/align points.

import {createEffect, createMemo, onCleanup, untrack} from 'solid-js'
import html from 'solid-js/html'
import {element, type ElementAttributes, booleanAttribute} from '@lume/element'
import {Element3DAttributes, Element3D, ScrollFling} from 'lume'
import {slottedLumeElements} from '../utils/slottedLumeElements.js'
import {DragFling} from '../interaction/DragFling.js'
import {autoDefineElements} from 'lume/dist/LumeConfig.js'

export type ScrollerAttributes = Element3DAttributes

export type ScrollItemAttributes = Element3DAttributes | 'skip'

const tiny = 0.000000000000000000001

/**
 * @extends Element3D
 * @class ScrollItem -
 *
 * Element: `<lume-scroll-item>`
 *
 * An element to use as child of a `<lume-scroller>` element when child
 * options are to be given. Children of `<lume-scroller>` do not need to be
 * `<lume-scroll-item>` elements, but when they are not, then options for
 * those children cannot be given and defaults will be used instead.
 */
@element('lume-scroll-item', autoDefineElements)
export class ScrollItem extends Element3D {
	/**
	 * When true, this element will be skipped from contributing to the size
	 * of a parent <lume-scroller> element's scrollable area, instead
	 * positioned as usual as if its parent were a <lume-element3d>.
	 */
	@booleanAttribute skip = false
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'lume-scroll-item': ElementAttributes<ScrollItem, ScrollItemAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'lume-scroll-item': ScrollItem
	}
}

/**
 * @extends Element3D
 * @class Scroller -
 *
 * Element: `<lume-scroller>`
 *
 * A container that scrolls its children within its boundaries in the X or Y directions.
 *
 * Slots:
 *
 * - Default: The default slot is a catch-all for all children that will be scrolled.
 */
@element('lume-scroller', autoDefineElements)
export class Scroller extends Element3D {
	override readonly hasShadow = true

	#translator: Element3D | null = null
	#scrollknob: Element3D | null = null

	override connectedCallback() {
		super.connectedCallback()

		let scrollRatio = 0
		let amountScrolled = 0

		this.createEffect(() => {
			const isScrollItem = (el: Element) => el instanceof ScrollItem
			const elements = slottedLumeElements(this.#translator!.children[0] as HTMLSlotElement)
			const children = createMemo(() => elements().filter(el => (isScrollItem(el) && el.skip ? false : true)))

			const contentHeight = createMemo(() => {
				let height = 0
				// `child.calculatedSize`s are dependencies
				// TODO Look at the bounding box of the content, rather than blindly adding sizes of children.
				for (const child of children()) height += child.calculatedSize.y
				return height
			}, 0)

			const scrollableAmount = createMemo(() => {
				// Using Math.max so that if content is smaller than scroll we don't scroll
				return Math.max(0, contentHeight() - this.#translator!.calculatedSize.y)
			})

			// Scroll implementation //////////////////////////////////////////////////////////////////////
			createEffect(() => {
				const scene = this.scene
				if (!scene) return

				const scrollFling = new ScrollFling({
					target: scene,
					// y: scrollRatio * scrollableAmount(),
					// Use Math.min in case the page is at the end, so that the viewport won't be scrolled beyond the end of content in case content height shrunk.
					y: Math.min(amountScrolled, scrollableAmount()),
					minY: 0,
					// The `|| tiny` prevents divide by zero errors.
					maxY: scrollableAmount() || tiny,
					sensitivity: 1,
				})

				scrollFling.start()

				createEffect(() => {
					scrollFling.y

					untrack(() => {
						this.#translator!.position.y = -(scrollFling.y || 0)
						// The `|| tiny` prevents NaN from 0/0
						scrollRatio = scrollFling.y / (scrollableAmount() || tiny)
						amountScrolled = scrollFling.y
						this.#scrollknob!.alignPoint.y = scrollRatio
						this.#scrollknob!.mountPoint.y = scrollRatio
					})
				})

				onCleanup(() => scrollFling.stop())

				const hasTouchScreen = navigator.maxTouchPoints > 0

				if (hasTouchScreen) {
					const dragFling = new DragFling()

					dragFling.set({
						target: scene,
						// Use Math.min in case the page is at the end, so that the viewport won't be scrolled beyond the end of content in case content height shrunk.
						y: Math.min(amountScrolled, scrollableAmount()),
						minY: 0,
						// The `|| tiny` prevents divide by zero errors.
						maxY: scrollableAmount() || tiny,
						sensitivity: 1,
						// no mouse drag
						pointerTypes: ['pen', 'touch'],
						invertY: true, // 'n shit.
					})

					dragFling.start()

					onCleanup(() => dragFling.stop())

					// Sync the two flings together
					const scrollFlingY = createMemo(() => scrollFling.y)
					const dragFlingY = createMemo(() => dragFling.y)
					createEffect(() => (scrollFling.y = dragFlingY()))
					createEffect(() => (dragFling.y = scrollFlingY()))
				}
			})

			const thumbHeight = createMemo(() => {
				// If the scroll area is bigger than the content, hide the thumb
				if (this.#translator!.calculatedSize.y / (contentHeight() || tiny) >= 1) return 0

				return Math.max(
					10,
					(this.#translator!.calculatedSize.y / (contentHeight() || tiny)) * this.#translator!.calculatedSize.y,
				)
			})

			createEffect(() => (untrack(() => this.#scrollknob!.size).y = thumbHeight()))
		})
	}

	override template = () => html`
		<lume-element3d size-mode="p p" size="1 1" id="scrollarea">
			<lume-element3d size-mode="p p" size="1 1" id="translator" ref=${(e: Element3D) => (this.#translator = e)}>
				<slot></slot>
			</lume-element3d>

			<slot name="scrollarea"></slot>
		</lume-element3d>

		<lume-element3d
			ref=${(e: Element3D) => (this.#scrollknob = e)}
			id="scrollknob"
			size="10 10 0"
			align-point="1 0"
			mount-point="1 0"
			position="0 0 0.2"
		>
			<slot name="scrollknob"></slot>
		</lume-element3d>

		<slot name="passthrough"></slot>
	`

	static override css = /*css*/ `
			${Element3D.css}

			#scrollknob {
				background: rgba(0, 0, 0, 0.2);
			}
		`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'lume-scroller': ElementAttributes<Scroller, ScrollerAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'lume-scroller': Scroller
	}
}
