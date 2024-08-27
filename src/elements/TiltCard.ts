import {createMemo, createSignal, onCleanup, onMount} from 'solid-js'
import type {ElementAttributes} from '@lume/element'
import type {Element3DAttributes, Element3D, TextureProjector} from 'lume'
import {createMutable} from 'solid-js/store'
import {clamp} from '../utils/clamp.js'

// Importing inside a conditional like this is a temporary hack to workaround a
// Solid Start import issue: https://github.com/solidjs/solid-start/issues/1614
if (globalThis.window?.document) {
	const {default: html} = await import('solid-js/html')
	const {Element3D, Motor} = await import('lume')
	const {element} = await import('@lume/element')
	const {autoDefineElements} = await import('lume/dist/LumeConfig.js')

	/**
	 * @extends Element3D
	 * @class TiltCard -
	 *
	 * Element: `<lume-tilt-card>`
	 *
	 * A card with an image that rotates a bit when hovering with a pointer.
	 */
	@element('lume-tilt-card', autoDefineElements)
	class TiltCard extends Element3D {
		override readonly hasShadow = true

		override connectedCallback() {
			super.connectedCallback()

			this.createEffect(() => {})
		}

		override template = () => {
			let plane: Element3D

			const state = createMutable({pointer: {x: 300 / 2, y: 300 / 2}})

			onMount(() => {
				const rotationAmount = 12

				let targetRotationX = 0
				let targetRotationY = 0

				const task = Motor.addRenderTask(time => {
					targetRotationX = clamp(
						-((state.pointer.y / 300) * rotationAmount - rotationAmount / 2),
						-rotationAmount / 2,
						rotationAmount / 2,
					)
					targetRotationY = clamp(
						+((state.pointer.x / 300) * rotationAmount - rotationAmount / 2),
						-rotationAmount / 2,
						rotationAmount / 2,
					)

					plane.rotation.y += (targetRotationY - plane.rotation.y) * 0.2
					plane.rotation.x += (targetRotationX - plane.rotation.x) * 0.2
				})

				onCleanup(() => Motor.removeRenderTask(task))
			})

			const [projector, setProjector] = createSignal<TextureProjector>()
			const projectors = createMemo(() => (projector() ? [projector()] : []))

			return html`
				<lume-rounded-rectangle
					ref=${(e: Element3D) => (plane = e)}
					corner-radius="20"
					thickness="5"
					quadratic-corners="false"
					size-mode="p p"
					size="1 1 0"
					has="projected-material"
					texture-projectors=${projectors}
					roughness="0.4"
					clearcoat="0"
					clearcoat-roughness="0.4"
					metalness="0"
					onpointermove=${(e: PointerEvent) => {
						state.pointer.x = e.offsetX
						state.pointer.y = e.offsetY
					}}
					onpointerleave=${(e: PointerEvent) => {
						state.pointer.x = 150
						state.pointer.y = 150
					}}
					ondragstart=${(e: DragEvent) => e.preventDefault()}
				>
					<!-- FIXME without the timeout it breaks -->
					<lume-texture-projector
						ref=${(e: TextureProjector) => setTimeout(() => setProjector(e))}
						size-mode="p p"
						size="1.01 1.01"
						mount-point="0.5 0.5"
						align-point="0.5 0.5"
						fitment="cover"
						src="/content/neofairies/Neo_Fairies_Ears_001.gif"
					>
						<a
							style=""
							href=${'/projects/' + (Math.random() > 0.5 ? 'foo' : 'bar')}
							oncontextmenu=${(e: Event) => e.preventDefault()}
						></a>
					</lume-texture-projector>
					<!--
					<lume-point-light align-point="0.2 0.2" cast-shadow="false" color="orange" intensity="50" position="0 0 10">
						<lume-sphere receive-shadow="false" color="orange" size="3" mount-point="0.5 0.5 0.5"></lume-sphere>
					</lume-point-light>
					-->
				</lume-rounded-rectangle>
			`
		}

		override css = /*css*/ `
			a {
				display: block;
				width: 100%;
				height: 100%;
				-webkit-tap-highlight-color: transparent;
				user-select: none;
			}
		`
	}
}

// declare module "solid-js" {
//   namespace JSX {
//     interface IntrinsicElements {
//       "lume-tilt-card": ElementAttributes<TiltCard, TiltCardAttributes>
//     }
//   }
// }

// declare global {
//   interface HTMLElementTagNameMap {
//     "lume-tilt-card": TiltCard
//   }
// }

export type TiltCardAttributes = Element3DAttributes

function getLume() {
	const [lume, setLume] = createSignal<typeof import('lume')>()
	import('lume').then(setLume)
	return lume
}