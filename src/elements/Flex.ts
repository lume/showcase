// TODO we need to be able to easily calculate the min/max X/Y position of
// elements, taking into account both regular position as well as mount point
// and align point. Perhaps all elements can have a calculatedPosition, similar
// to calculatedSize, that gives us absolute X/Y/Z relative to a parent taking
// into account mount/align points.

import {createEffect, onCleanup} from 'solid-js'
import type {ElementAttributes} from '@lume/element'
import type {Element3DAttributes, Element3D} from 'lume'
import Yoga, {Direction, FlexDirection, Gutter, type Node as YogaNode} from 'yoga-layout'
import {childLumeElements} from '../utils/childLumeElements.js'

if (globalThis.window?.document) {
	const {default: html} = await import('solid-js/html')
	const {Element3D, ScrollFling} = await import('lume')
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

		override connectedCallback() {
			super.connectedCallback()

			const root = Yoga.Node.create()
			root.setFlexDirection(FlexDirection.Row)
			root.setGap(Gutter.All, 20)

			this.createEffect(() => {
				root.setWidth(this.calculatedSize.x)
				root.setHeight(this.calculatedSize.y)
			})

			this.createEffect(() => {
				const {elements: children} = childLumeElements(this)

				createEffect(() => {
					const yogaChildren: YogaNode[] = []

					for (const [i] of children().entries()) {
						const yogaChild = Yoga.Node.create()
						// yogaChild.setFlexGrow(1)
						// yogaChild.setMargin(Edge.Right, 10)
						yogaChild.setWidth(300)
						yogaChild.setHeight(300)
						yogaChildren.push(yogaChild)
						root.insertChild(yogaChild, i)
					}

					createEffect(() => {
						root.calculateLayout(this.calculatedSize.x, this.calculatedSize.y, Direction.LTR)

						for (const [i, child] of children().entries())
							child.position.set(yogaChildren[i].getComputedLeft(), yogaChildren[i].getComputedTop(), 0)
					})

					onCleanup(() => root.freeRecursive())
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
