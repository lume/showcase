import {batch, createSignal, onCleanup, onMount} from 'solid-js'
import html from 'solid-js/html'
import {element, type ElementAttributes, stringAttribute, numberAttribute, booleanAttribute} from '@lume/element'
import {Element3DAttributes, Element3D, TextureProjector, Motor} from 'lume'
import {createMutable} from 'solid-js/store'
import {clamp} from '../utils/clamp.js'
import {createArrayMemo} from '../utils/createArrayMemo.js'
import {autoDefineElements} from 'lume/dist/LumeConfig.js'

export type TiltCardAttributes = Element3DAttributes | 'image'

/**
 * @extends Element3D
 * @class TiltCard -
 *
 * Element: `<lume-tilt-card>`
 *
 * A card with an image that rotates a bit when hovering with a pointer.
 */
@element('lume-tilt-card', autoDefineElements)
export class TiltCard extends Element3D {
	override readonly hasShadow = true

	@numberAttribute rotationAmount = 12
	@stringAttribute image = ''
	@booleanAttribute castShadow = true
	@booleanAttribute receiveShadow = true

	override template = () => {
		let plane: Element3D

		const size = 300

		const state = createMutable({
			pointer: {x: size / 2, y: size / 2},
			over: false,
		})

		onMount(() => {
			const rotationAmount = this.rotationAmount
			let targetRotationX = 0
			let targetRotationY = 0
			let targetPositionZ = 0

			const task = Motor.addRenderTask(time => {
				targetRotationX = clamp(
					-((state.pointer.y / size) * rotationAmount - rotationAmount / 2),
					-rotationAmount / 2,
					rotationAmount / 2,
				)
				targetRotationY = clamp(
					+((state.pointer.x / size) * rotationAmount - rotationAmount / 2),
					-rotationAmount / 2,
					rotationAmount / 2,
				)

				targetPositionZ = state.over ? 40 : 0

				plane.rotation.y += (targetRotationY - plane.rotation.y) * 0.2
				plane.rotation.x += (targetRotationX - plane.rotation.x) * 0.2
				plane.position.z += (targetPositionZ - plane.position.z) * 0.2
			})

			onCleanup(() => Motor.removeRenderTask(task))
		})

		const [projector, setProjector] = createSignal<TextureProjector>()
		const projectors = createArrayMemo(() => (projector() ? [projector()] : []))

		return html`
			<lume-rounded-rectangle
				id=${() => this.image.split('/').pop()}
				part="root"
				ref=${(e: Element3D) => (plane = e)}
				corner-radius="10"
				thickness="5"
				quadratic-corners="false"
				size-mode="p p"
				size="1 1 0"
				has="projected-material"
				texture-projectors=${() => projectors()}
				roughness="0.55"
				clearcoat="0"
				clearcoat-roughness="0.55"
				metalness="0"
				color="black"
				dithering
				color-comment="the background should be approximately the color of the projected texture, for now, because when opacity is less than 1 the transparent surface immediately turns the specified color blended with the projected texture which may be undersirable. The underlying color is visible (mixed with the texture) only when opacity is less than 1."
				comment="Come up with a way to not have to re-create all these properties, so they can be passed-through."
				opacity=${() => this.opacity}
				cast-shadow=${() => this.castShadow}
				receive-shadow=${() => this.receiveShadow}
				onpointerenter=${(e: PointerEvent) => {
					state.over = true
				}}
				oncapture:pointermove=${(e: PointerEvent) => {
					batch(() => {
						state.pointer.x = e.offsetX
						state.pointer.y = e.offsetY
					})
				}}
				onpointerleave=${(e: PointerEvent) => {
					batch(() => {
						state.over = false
						state.pointer.x = 150
						state.pointer.y = 150
					})
				}}
				ondragstart=${(e: DragEvent) => e.preventDefault()}
			>
				<!-- FIXME without the timeout it breaks -->
				<lume-texture-projector
					part="projector"
					ref=${(e: TextureProjector) => setTimeout(() => setProjector(e))}
					size-mode="p p"
					size="1.01 1.01"
					mount-point="0.5 0.5"
					align-point="0.5 0.5"
					fitment="cover"
					src=${() => this.image}
				>
					<slot></slot>
				</lume-texture-projector>
				<!--
					<lume-point-light align-point="0.2 0.2" cast-shadow="false" color="orange" intensity="50" position="0 0 10">
						<lume-sphere receive-shadow="false" color="orange" size="3" mount-point="0.5 0.5 0.5"></lume-sphere>
					</lume-point-light>
					-->
			</lume-rounded-rectangle>
		`
	}

	static override css = /*css*/ `
			${Element3D.css}

			lume-rounded-rectangle {
				border-radius: 20px;
			}
		`
}

declare module 'solid-js' {
	namespace JSX {
		interface IntrinsicElements {
			'lume-tilt-card': ElementAttributes<TiltCard, TiltCardAttributes>
		}
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'lume-tilt-card': TiltCard
	}
}
