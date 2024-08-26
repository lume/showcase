import {Router, useParams} from '@solidjs/router'
import {FileRoutes} from '@solidjs/start/router'
import {createMemo, createSignal, onMount, Suspense} from 'solid-js'
import {createMutable} from 'solid-js/store'
import type {Element3D, PointLight, TextureProjector} from 'lume'
import './app.css'
import Scene from './components/Scene.js'
import './elements/Scroller.js'
import './elements/Flex.js'

console.log('load app')

if (globalThis.window?.document) await import('lume')

export default function App() {
	return (
		<Router
			root={props => {
				const params = useParams<Params>()
				const noParams = createMemo(() => !Object.keys(params).length)

				const state = createMutable({
					targetPosition: {x: (globalThis.window?.innerWidth ?? 1) / 2, y: (globalThis.window?.innerHeight ?? 1) / 2},
				})

				onMount(async () => {
					const {Motor} = await import('lume')
					const light = document.querySelector('#light') as PointLight

					Motor.addRenderTask(time => {
						light.position.x += (state.targetPosition.x - light.position.x) * 0.05
						light.position.y += (state.targetPosition.y - light.position.y) * 0.05
					})
				})

				return (
					<main>
						{/* The route component is rendered here. */}
						<Suspense>{props.children}</Suspense>

						<lume-scene
							webgl
							swap-layers
							shadowmap-type="pcfsoft"
							style="position: absolute; left: 0; top: 0;"
							onpointermove={e => {
								e.preventDefault()
								state.targetPosition.x = e.clientX
								state.targetPosition.y = e.clientY
							}}
						>
							<lume-ambient-light intensity="1.5"></lume-ambient-light>
							<lume-point-light
								id="light"
								intensity="1050"
								position="400 0 700"
								shadow-map-width="2048"
								shadow-map-height="2048"
							></lume-point-light>

							<lume-plane
								size-mode="p p"
								size="1.1 1.1"
								align-point="0.5 0.5"
								mount-point="0.5 0.5"
								position="0 0 -10"
							></lume-plane>

							<lume-scroller size-mode="p p" size="1 1">
								{/* <div class="links">
									<a href="/" class={noParams() ? 'active' : ''} style="--active-color: cornflowerblue;">
										index
									</a>
									<a
										href="/projects/foo"
										class={params.project === 'foo' ? 'active' : ''}
										style="--active-color: orchid;"
									>
										foo
									</a>
									<a
										href="/projects/bar"
										class={params.project === 'bar' ? 'active' : ''}
										style="--active-color: orange;"
									>
										bar
									</a>
									<a href="/blahblah" class={params[404] ? 'active' : ''} style="--active-color: turquoise;">
										404
									</a>
								</div> */}

								{/* <h1>
									{params.project ? `Project: ${params.project}` : params['404'] ? 'Page Not Found' : 'Hello World!'}
								</h1> */}

								{/* <lume-element3d size="350 250" align-point="0.5" mount-point="0.5">
									<Scene></Scene>
								</lume-element3d> */}

								<lume-flex size-mode="p l" size="1 1000">
									{Array.from({length: 10}).map((_, i) => (
										<Card y={i * 400} />
									))}
								</lume-flex>
							</lume-scroller>
						</lume-scene>
					</main>
				)
			}}
		>
			<FileRoutes />
		</Router>
	)
}

function Card(props) {
	let plane: Element3D

	const state = createMutable({pointer: {x: 300 / 2, y: 300 / 2}})

	onMount(async () => {
		const {Motor} = await import('lume')

		let targetRotationX = 0
		let targetRotationY = 0

		Motor.addRenderTask(time => {
			targetRotationX = -((state.pointer.y / 300) * 20 - 10)
			targetRotationY = +((state.pointer.x / 300) * 20 - 10)

			plane.rotation.y += (targetRotationY - plane.rotation.y) * 0.05
			plane.rotation.x += (targetRotationX - plane.rotation.x) * 0.05
		})
	})

	const [projector, setProjector] = createSignal<TextureProjector>()
	const projectors = createMemo(() => (projector() ? [projector()] : []))

	return (
		<lume-rounded-rectangle
			ref={e => (plane = e)}
			corner-radius="20"
			thickness="1"
			quadratic-corners="false"
			align-point="0.5 0.5"
			mount-point="0.5 0.5"
			position={[0, props.y, 100]}
			size="300 300 1"
			color="pink"
			has="projected-material"
			texture-projectors={(console.log('projs:', projectors()), projectors())}
			roughness="0.4"
			clearcoat="0"
			clearcoat-roughness="0.4"
			metalness="0"
			onpointermove={e => {
				e.preventDefault()
				state.pointer.x = e.offsetX
				state.pointer.y = e.offsetY
			}}
		>
			<lume-texture-projector
				// FIXME without the timeout, texture projection not working
				ref={e => setTimeout(() => setProjector(e))}
				size-mode="p p"
				size="1 1"
				fitment="cover"
				src="/content/starship/spacex-ops-displays.png"
			></lume-texture-projector>
		</lume-rounded-rectangle>
	)
}
