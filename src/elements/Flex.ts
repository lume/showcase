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

// Importing inside a conditional like this is a temporary workaround.
// https://github.com/solidjs/solid-start/issues/1614
if (globalThis.window?.document) await defineElement()

async function defineElement() {
	const {default: html} = await import('solid-js/html')
	const {Element3D, signal, stringAttribute, numberAttribute} = await import('lume')
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
	 * - Default: The default slot for all children that will be laid out.
	 */
	return @element('lume-flex', autoDefineElements)
	class Flex extends Element3D {
		override readonly hasShadow = true

		@stringAttribute justifyContent:
			| 'center'
			| 'flex-end'
			| 'flex-start'
			| 'space-around'
			| 'space-between'
			| 'space-evenly' = 'flex-start'

		@numberAttribute gap = 0

		#container: Element3D | null = null
		#paddingBox: Element3D | null = null

		@signal private __yogaRoot: YogaNode | null = null

		/** The Yoga root Node exposed, in case custom modifications are desired. */
		get yogaRoot() {
			return this.__yogaRoot
		}

		override connectedCallback() {
			super.connectedCallback()

			const yoga = getYoga()

			this.createEffect(() => {
				const yogaModule = yoga()
				if (!yogaModule) return
				const {default: Yoga, Direction, FlexDirection, Gutter, Wrap, Edge, Justify} = yogaModule

				const {elements: children} = childLumeElements(this)
				const padding = 40
				const thisSizeX = createMemo(() => this.calculatedSize.x)
				const paddingBoxSizeX = createMemo(() => this.#paddingBox!.calculatedSize.x)

				const root = (this.__yogaRoot = Yoga.Node.create())
				root.setFlexDirection(FlexDirection.Row)
				root.setFlexWrap(Wrap.Wrap)

				// root.setPadding(Edge.All, padding)
				createEffect(() => {
					this.#paddingBox!.size.x = Math.max(0, thisSizeX() - padding * 2)
					this.#paddingBox!.position.x = padding
					this.#paddingBox!.position.y = padding
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
						let justify
						switch (this.justifyContent) {
							case 'center':
								justify = Justify.Center
								break
							case 'flex-end':
								justify = Justify.FlexEnd
								break
							case 'flex-start':
								justify = Justify.FlexStart
								break
							case 'space-around':
								justify = Justify.SpaceAround
								break
							case 'space-between':
								justify = Justify.SpaceBetween
								break
							case 'space-evenly':
								justify = Justify.SpaceEvenly
								break
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
						this.size.y = Math.max(0, root.getComputedHeight() + padding * 2)
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
			<lume-element3d id="#container" size-mode="p p" size="1 1" ref=${(e: Element3D) => (this.#container = e)}>
				<lume-element3d ref=${(e: Element3D) => (this.#paddingBox = e)}>
					<slot></slot>
				</lume-element3d>
			</lume-element3d>
		`

		static override css = /*css*/ `
			${Element3D.css}
		`
	}
}

// Temporary hack type to get around the async defineElement() workaround
// wrapper (see above).
type FlexCtor = Awaited<ReturnType<typeof defineElement>>
type Flex = InstanceType<FlexCtor>

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

export type FlexAttributes = Element3DAttributes | 'justifyContent' | 'gap'

function getYoga() {
	const [yoga, setYoga] = createSignal<typeof import('yoga-layout')>()
	const promise = eval("import('https://unpkg.com/yoga-layout@3.1.0/dist/src/index.js')")
	promise.then(setYoga)
	return yoga
}
