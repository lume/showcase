// TODO we need to be able to easily calculate the min/max X/Y position of
// elements, taking into account both regular position as well as mount point
// and align point. Perhaps all elements can have a calculatedPosition, similar
// to calculatedSize, that gives us absolute X/Y/Z relative to a parent taking
// into account mount/align points.

import {createEffect, createMemo, createSignal, onCleanup} from 'solid-js'
import type {ElementAttributes} from '@lume/element'
import type {Element3DAttributes, Element3D} from 'lume'
import type {Node as YogaNode} from 'yoga-layout'
import {childLumeElements} from '../utils/childLumeElements.js'

if (globalThis.window?.document) {
	const {default: html} = await import('solid-js/html')
	const {Element3D, signal} = await import('lume')
	const {element} = await import('@lume/element')
	const {autoDefineElements} = await import('lume/dist/LumeConfig.js')

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
	 * - `TODO` - The ..........
	 * - Default: The default slot is a catch-all for all other children, so they behave the same as children of a node without a shadow tree.
	 */
	@element('lume-flex', autoDefineElements)
	class Flex extends Element3D {
		override readonly hasShadow = true

		#container: Element3D | null = null

		@signal yogaRoot: YogaNode | null = null

		override connectedCallback() {
			super.connectedCallback()

			const yoga = getYoga()

			this.createEffect(() => {
				const yogaModule = yoga()
				if (!yogaModule) return
				const {default: Yoga, Direction, FlexDirection, Gutter, Wrap, Edge, Justify} = yogaModule

				const root = (this.yogaRoot = Yoga.Node.create())
				root.setFlexDirection(FlexDirection.Row)
				root.setGap(Gutter.All, 40)
				root.setFlexWrap(Wrap.Wrap)
				root.setPadding(Edge.All, 40)
				root.setJustifyContent(Justify.SpaceEvenly)

				onCleanup(() => root.free())

				const {elements: children} = childLumeElements(this)

				createEffect(() => {
					const yogaChildren: YogaNode[] = []

					for (const [i, child] of children().entries()) {
						const yogaChild = Yoga.Node.create()

						createEffect(() => {
							yogaChild.setWidth(child.calculatedSize.x)
							yogaChild.setHeight(child.calculatedSize.y)
						})

						yogaChildren.push(yogaChild)
						root.insertChild(yogaChild, i)
					}

					const sizeX = createMemo(() => this.calculatedSize.x)

					createEffect(() => {
						root.setWidth(sizeX())
						root.calculateLayout(sizeX(), undefined /*auto*/, Direction.LTR)

						this.size.y = root.getComputedHeight()

						for (const [i, child] of children().entries()) {
							child.position.x = yogaChildren[i].getComputedLeft()
							child.position.y = yogaChildren[i].getComputedTop()
						}
					})

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
			<lume-element3d id="#container" size-mode="p p" size="1 1" ref=${(e: Element3D) => (this.#container = e)}>
				<slot></slot>
			</lume-element3d>
		`

		static override css = /*css*/ `
		`
	}
}

// declare module "solid-js" {
//   namespace JSX {
//     interface IntrinsicElements {
//       "lume-flex": ElementAttributes<Flex, FlexAttributes>
//     }
//   }
// }

// declare global {
//   interface HTMLElementTagNameMap {
//     "lume-flex": Flex
//   }
// }

export type FlexAttributes = Element3DAttributes

function getYoga() {
	const [yoga, setYoga] = createSignal<typeof import('yoga-layout')>()
	const promise = eval("import('https://unpkg.com/yoga-layout@3.1.0/dist/src/index.js')")
	promise.then(setYoga)
	return yoga
}
