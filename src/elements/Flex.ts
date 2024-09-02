import {createEffect, createMemo, createSignal, onCleanup} from 'solid-js'
import html from 'solid-js/html'
import {element, type ElementAttributes, stringAttribute, booleanAttribute, numberAttribute} from '@lume/element'
import {Element3DAttributes, Element3D, signal} from 'lume'
import type {Node as YogaNode} from 'yoga-layout'
import {slottedLumeElements} from '../utils/slottedLumeElements.js'
import {autoDefineElements} from 'lume/dist/LumeConfig.js'

// This is not working yet (https://github.com/solidjs/solid-start/issues/1614), so we import with conditional await import()
// import Yoga, {Direction, FlexDirection, Gutter, Wrap, Edge, Justify, Align} from 'yoga-layout'

let Yoga: typeof import('yoga-layout').default
let Direction: typeof import('yoga-layout').Direction
let FlexDirection: typeof import('yoga-layout').FlexDirection
let Gutter: typeof import('yoga-layout').Gutter
let Wrap: typeof import('yoga-layout').Wrap
let Edge: typeof import('yoga-layout').Edge
let Justify: typeof import('yoga-layout').Justify
let Align: typeof import('yoga-layout').Align

if (globalThis.window?.document) {
	;({
		default: Yoga,
		Direction,
		FlexDirection,
		Gutter,
		Wrap,
		Edge,
		Justify,
		Align,
		// @ts-ignore
	} = (await import('https://unpkg.com/yoga-layout@3.1.0/dist/src/index.js')) as typeof import('yoga-layout'))
}

export type FlexItemAttributes = Element3DAttributes | 'skip'

/**
 * @extends Element3D
 * @class FlexItem -
 *
 * Element: `<lume-flex-item>`
 *
 * An element to use as child of a `<lume-flex>` element when child
 * options are to be given. Children of `<lume-flex>` do not need to be
 * `<lume-flex-item>`, but in that case options for each child cannot be
 * given and defaults will be used.
 */
@element('lume-flex-item', autoDefineElements)
export class FlexItem extends Element3D {
	/**
	 * When true, this element will be skipped from being laid out by a
	 * parent <lume-flex> element, instead positioned as usual as if its
	 * parent were a <lume-element3d>.
	 */
	@booleanAttribute skip = false
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'lume-flex-item': ElementAttributes<FlexItem, FlexItemAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'lume-flex-item': FlexItem
	}
}

export type FlexAttributes =
	| Element3DAttributes
	| 'justifyContent'
	| 'gap'
	| 'direction'
	| 'alignItems'
	| 'padding'
	| 'skip'

/**
 * @extends Element3D
 * @class Flex -
 *
 * Element: `<lume-flex>`
 *
 * A container that arranges its children in a flexbox layout.
 *
 * Slots:
 *
 * - Default: The default slot for all children that will be laid out.
 */
@element('lume-flex', autoDefineElements)
export class Flex extends Element3D {
	override readonly hasShadow = true

	@stringAttribute direction: 'row' | 'column' | 'row-reverse' | 'column-reverse' = 'row'

	@stringAttribute alignItems: 'baseline' | 'center' | 'end' | 'start' | 'stretch' = 'start'

	@stringAttribute justifyContent: 'center' | 'end' | 'space-around' | 'space-between' | 'space-evenly' | 'start' =
		'start'

	@numberAttribute padding = 0

	@numberAttribute gap = 0

	/**
	 * When true, this element will be skipped from being laid out by a
	 * parent <lume-flex> element, instead positioned as usual as if its
	 * parent were a <lume-element3d>.
	 */
	@booleanAttribute skip = false

	#paddingBox: Element3D | null = null

	@signal private __yogaRoot: YogaNode | null = null

	/** The Yoga root Node exposed, in case custom modifications are desired. */
	get yogaRoot() {
		return this.__yogaRoot
	}

	override connectedCallback() {
		super.connectedCallback()

		const slot = this.shadowRoot!.querySelector('slot')!

		this.createEffect(() => {
			const elements = slottedLumeElements(slot)
			const isFlex = (el: Element) => el instanceof FlexItem || el instanceof Flex
			const children = createMemo(() => elements().filter(el => (isFlex(el) && el.skip ? false : true)))

			const thisSizeX = createMemo(() => this.calculatedSize.x)
			const paddingBoxSizeX = createMemo(() => this.#paddingBox!.calculatedSize.x)

			const root = (this.__yogaRoot = Yoga.Node.create())
			root.setFlexWrap(Wrap.Wrap)

			// root.setPadding(Edge.All, padding)
			createEffect(() => {
				this.#paddingBox!.size.x = Math.max(0, thisSizeX() - this.padding * 2)
				this.#paddingBox!.position.x = this.padding
				this.#paddingBox!.position.y = this.padding
			})

			root.setGap(Gutter.All, 40)

			onCleanup(() => root.free())

			createEffect(() => {
				const [layoutUpdated, setLayoutUpdated] = createSignal(0)

				const yogaChildren: YogaNode[] = []

				for (const [i, child] of children().entries()) {
					const yogaChild = Yoga.Node.create()
					const childSizeX = createMemo(() => child.calculatedSize.x)
					const childSizeY = createMemo(() => child.calculatedSize.y)

					createEffect(() => {
						yogaChild.setWidth(childSizeX())
						yogaChild.setHeight(childSizeY())
						updateLayout()
					})

					yogaChildren.push(yogaChild)
					root.insertChild(yogaChild, i)
				}

				createEffect(() => {
					root.setGap(Gutter.All, this.gap)
					updateLayout()
				})

				createEffect(() => {
					let alignItems
					// prettier-ignore
					switch (this.alignItems) {
							case 'baseline': alignItems = Align.Baseline; break
							case 'center': alignItems = Align.Center; break
							case 'end': alignItems = Align.FlexEnd; break
							case 'start': alignItems = Align.FlexStart; break
							case 'stretch': alignItems = Align.Stretch; break
						}

					if (this.id === 'projectContent') console.log('align-items:', this.alignItems, Align[alignItems])
					root.setAlignItems(alignItems)
					updateLayout()
				})

				createEffect(() => {
					let direction
					// prettier-ignore
					switch (this.direction) {
							case 'row': direction = FlexDirection.Row; break
							case 'column': direction = FlexDirection.Column; break
							case 'row-reverse': direction = FlexDirection.RowReverse; break
							case 'column-reverse': direction = FlexDirection.ColumnReverse; break
						}

					root.setFlexDirection(direction)
					updateLayout()
				})

				createEffect(() => {
					let justify
					// prettier-ignore
					switch (this.justifyContent) {
							case 'center': justify = Justify.Center; break
							case 'end': justify = Justify.FlexEnd; break
							case 'start': justify = Justify.FlexStart; break
							case 'space-around': justify = Justify.SpaceAround; break
							case 'space-between': justify = Justify.SpaceBetween; break
							case 'space-evenly': justify = Justify.SpaceEvenly; break
						}

					root.setJustifyContent(justify)
					updateLayout()
				})

				createEffect(() => {
					root.setWidth(paddingBoxSizeX())
					updateLayout()
				})

				createEffect(() => {
					layoutUpdated()

					this.#paddingBox!.size.y = Math.max(0, root.getComputedHeight())
					this.size.y = Math.max(0, root.getComputedHeight() + this.padding * 2)
				})

				function updateLayout() {
					root.calculateLayout(paddingBoxSizeX(), undefined /*auto*/, Direction.LTR)
					applyLayoutToElements()
					setLayoutUpdated(n => ++n)
				}

				function applyLayoutToElements() {
					for (const [i, child] of children().entries()) {
						child.position.x = yogaChildren[i].getComputedLeft()
						child.position.y = yogaChildren[i].getComputedTop()
					}
				}

				onCleanup(() => {
					for (const n of yogaChildren) {
						root.removeChild(n)
						n.free()
					}
				})
			})
		})
	}

	override template = () => html`
		<lume-element3d id="#container" size-mode="p p" size="1 1">
			<lume-element3d ref=${(e: Element3D) => (this.#paddingBox = e)}>
				<slot></slot>
			</lume-element3d>
		</lume-element3d>

		<slot name="passthrough"></slot>
	`

	static override css = /*css*/ `
		${Element3D.css}
	`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'lume-flex': ElementAttributes<Flex, FlexAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'lume-flex': Flex
	}
}
