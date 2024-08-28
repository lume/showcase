import {Router, useParams} from '@solidjs/router'
import {FileRoutes} from '@solidjs/start/router'
import {createEffect, createMemo, createSignal, onCleanup, onMount, Suspense} from 'solid-js'
import {createMutable} from 'solid-js/store'
import type {Element3D, PointLight, TextureProjector} from 'lume'
import {elementSize} from './utils/elementSize.js'
import './app.css'
import './elements/Scroller.js'
import './elements/Flex.js'
import './elements/TiltCard.js'

if (globalThis.window?.document) await import('lume')

export default function App() {
	return (
		<Router
			root={props => {
				const params = useParams<Params>()
				const noParams = createMemo(() => !Object.keys(params).length)

				const [titleBox, setTitleBox] = createSignal<Element3D>()
				const titleBoxSizeY = createMemo(() => titleBox()?.calculatedSize.y ?? 1)

				const [header, setHeader] = createSignal<HTMLHeadingElement>()
				const {clientWidth: headerWidth, clientHeight: headerHeight} = elementSize(header)

				const state = createMutable({
					targetPosition: {x: (globalThis.window?.innerWidth ?? 1) / 2, y: (globalThis.window?.innerHeight ?? 1) / 2},
				})

				onMount(() => {
					const lume = getLume()

					createEffect(() => {
						if (!lume()) return

						const {Motor} = lume()!
						const light = document.querySelector('#light') as PointLight

						const task = Motor.addRenderTask(time => {
							light.position.x += (state.targetPosition.x - light.position.x) * 0.05
							light.position.y += (state.targetPosition.y - light.position.y) * 0.05
						})

						onCleanup(() => Motor.removeRenderTask(task))
					})
				})

				return (
					<main>
						{/* The route component is rendered here. */}
						<Suspense>{props.children}</Suspense>

						<lume-scene
							webgl
							swap-layers
							shadow-mode="vsm"
							style="position: absolute; left: 0; top: 0;"
							onpointermove={e => {
								e.preventDefault()
								state.targetPosition.x = e.clientX
								state.targetPosition.y = e.clientY
							}}
						>
							<lume-ambient-light intensity="1.5"></lume-ambient-light>
							<lume-point-light
								ref={e => (e.three.shadow.blurSamples = 2000)}
								id="light"
								intensity="1050"
								position="400 0 600"
								shadow-map-width="2048"
								shadow-map-height="2048"
								shadow-radius="10"
							></lume-point-light>

							<lume-plane
								size-mode="p p"
								size="1.2 1.2"
								align-point="0.5 0.5"
								mount-point="0.5 0.5"
								position="0 0 -30"
							></lume-plane>

							<lume-scroller size-mode="p p" size="1 1">
								<lume-flex size-mode="p l" size="1 1" justify-content="center" gap="40">
									<lume-element3d
										corner-radius="20"
										thickness="5"
										quadratic-corners="false"
										size-mode="p l"
										size={[1, titleBoxSizeY(), 0]}
										xhas="projected-material"
										roughness="0.4"
										clearcoat="0"
										clearcoat-roughness="0.4"
										metalness="0"
										color="pink"
									>
										<lume-flex ref={setTitleBox} size-mode="p l" size="1 1" justify-content="center" gap="2">
											<lume-element3d size={[headerWidth(), headerHeight()]}>
												<h1 ref={setHeader} style="display: block; width: max-content; margin: 0; user-select: text;">
													{params.project
														? `Project: ${params.project}`
														: params['404']
															? 'Page Not Found'
															: 'Showcase'}
												</h1>
											</lume-element3d>
										</lume-flex>
									</lume-element3d>
									{Array.from({length: 10}).map((_, i) => (
										<lume-tilt-card size="300 300" i={i} />
									))}
								</lume-flex>
							</lume-scroller>
						</lume-scene>
						<style innerHTML={style()}></style>
					</main>
				)
			}}
		>
			<FileRoutes />
		</Router>
	)

	function style() {
		return /*css*/ `
            lume-scroller {
                /*
                 * Weird workaround due to pointer events working differently
                 * across browsers CSS 3D. Let's just say CSS 3D (in all major
                 * browsers today) is the worst 3D engine in the history of
                 * human computing.
                 */
                ${detectBrowser() === 'firefox' ? 'pointer-events: none;' : ''}
                * { ${detectBrowser() === 'firefox' ? 'pointer-events: none;' : ''} }
                lume-tilt-card {
                    pointer-events: auto;
                }
                /* uncomment this to debug the issue, to visualize the CSS planes (which are invisible in Safari for some reason!) */
                /*lume-element3d, lume-tilt-card::part(root) {
                    background: rgb(255 255 255 / 0.8);
                }*/
            }
        `
	}
}

function getLume() {
	const [lume, setLume] = createSignal<typeof import('lume')>()
	import('lume').then(setLume)
	return lume
}

function detectBrowser(): 'chrome' | 'safari' | 'firefox' {
	// The order of these checks matters!
	if (navigator.userAgent.includes('Edg/')) return 'chrome' // for now, no need to differentiate Chrome from Edge, maybe later...
	if (navigator.userAgent.includes('Chrome/')) return 'chrome'
	if (navigator.userAgent.includes('Safari/')) return 'safari'
	if (navigator.userAgent.includes('Firefox/')) return 'firefox'
	return 'chrome'
}
