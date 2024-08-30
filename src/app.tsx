import {Router, useParams} from '@solidjs/router'
import {FileRoutes} from '@solidjs/start/router'
import {createEffect, createMemo, createSignal, onCleanup, onMount, Suspense, untrack, Show} from 'solid-js'
import {createMutable} from 'solid-js/store'
import type {Element3D, PointLight, TextureProjector} from 'lume'
import {elementSize} from './utils/elementSize.js'
import './app.css'
import './elements/Scroller.js'
import './elements/Flex.js'
import type {Flex} from './elements/Flex.js'
import './elements/TiltCard.js'
import {type TiltCard} from './elements/TiltCard.js'
import {childLumeElements} from './utils/childLumeElements.js'

if (globalThis.window?.document) await import('lume')

const projects = [
	{name: 'Uthana', slug: 'uthana', image: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
	{name: 'Neo Fairies', slug: 'neofairies', image: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
	{name: 'Bar', slug: 'bar', image: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
	{name: 'Foo', slug: 'foo', image: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
	{name: 'Bar', slug: 'bar', image: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
	{name: 'Foo', slug: 'foo', image: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
	{name: 'Foo', slug: 'foo', image: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
	{name: 'Foo', slug: 'foo', image: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
	{name: 'Foo', slug: 'foo', image: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
	{name: 'Foo', slug: 'foo', image: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
	{name: 'Foo', slug: 'foo', image: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
	{name: 'Foo', slug: 'foo', image: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
	{name: 'Foo', slug: 'foo', image: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
	{name: 'Foo', slug: 'foo', image: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
	{name: 'Foo', slug: 'foo', image: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
	{name: 'Foo', slug: 'foo', image: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
]

export default function App() {
	return (
		<Router
			root={props => {
				const params = useParams<Params>()
				const [titleBox, setTitleBox] = createSignal<Element3D>()
				const titleBoxSizeY = createMemo(() => titleBox()?.calculatedSize.y ?? 1)
				const [header, setHeader] = createSignal<HTMLHeadingElement>()
				const {clientWidth: headerWidth, clientHeight: headerHeight} = elementSize(header)
				const [cards, setCards] = createSignal<TiltCard[]>([])

				// TODO dynamic values based on the initial route
				// TODO better name for showCards (hinge between both views)
				const [showCards, setShowCards] = createSignal(true)

				const transitionCardsOut = createMemo(() => !!params.project)
				const [projectContent, setProjectContent] = createSignal<Flex>()
				const projectItems = childLumeElements(projectContent)
				const transitionProjectItemsIn = createMemo(() => !showCards())

				const state = createMutable({
					targetPosition: {x: (globalThis.window?.innerWidth ?? 1) / 2, y: (globalThis.window?.innerHeight ?? 1) / 2},
				})

				// onMount -> client only
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

						createEffect(() => {
							const stagger = 50
							const _cards = cards()
							if (!_cards.length) return

							createEffect(() => {
								const dones: (() => boolean)[] = []

								for (const [i, card] of _cards.entries()) {
									const el = card.children[0] as TiltCard

									if (transitionCardsOut()) {
										const fadeDone = fadeElement(el, 0, -20, i * stagger)
										el.castShadow = false

										// Add a small delay after cards are faded out (f.e. before fading in project content).
										const [postDelayDone, setPostDelayDone] = createSignal(false)
										createEffect(() => {
											let timeout = 0
											if (fadeDone()) timeout = window.setTimeout(() => setPostDelayDone(true), 150)
											onCleanup(() => clearTimeout(timeout))
										})

										dones.push(postDelayDone)
										if (i === _cards.length - 1) {
											const allDone = createMemo(() => dones.every(d => !!d()))
											createEffect(() => allDone() && setShowCards(false))
										}
									} else {
										const done = fadeElement(el, 1, 0, i * stagger)
										createEffect(() => done() && (el.castShadow = true))
										setShowCards(true)
										dones.push(done)
									}
								}

								const allDone = createMemo(() => dones.every(d => !!d()))
								createEffect(() => console.log('all done:', allDone()))
							})

							const _projectItems = projectItems()
							if (!_projectItems) return

							createEffect(() => {
								for (const [i, item] of _projectItems.entries()) {
									const el = item

									if (transitionProjectItemsIn()) {
										const done = fadeElement(el, 1, 0, i * stagger)
										if (el.tagName === 'LUME-TILT-CARD')
											createEffect(() => done() && ((el as TiltCard).castShadow = true))
									} else {
										const done = fadeElement(el, 0, -20, i * stagger)
										if (el.tagName === 'LUME-TILT-CARD') (el as TiltCard).castShadow = false
									}
								}
							})
						})
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
								<lume-flex size-mode="p l" size="1 1" justify-content="center" gap="40" padding="40">
									<lume-element3d
										id="header"
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
														? `Project: ${projects.find(p => p.slug === params.project)!.name}`
														: params['404']
															? 'Page Not Found'
															: 'Showcase'}
												</h1>
											</lume-element3d>
										</lume-flex>
									</lume-element3d>

									{setCards(
										projects.map(({name, slug, image}, i) => (
											<lume-flex-item size="300 300" skip={showCards() ? false : true}>
												<lume-tilt-card size="300 300" image={image}>
													<a style="" href={'/projects/' + slug} oncontextmenu={(e: Event) => e.preventDefault()}></a>
												</lume-tilt-card>
											</lume-flex-item>
										)) as TiltCard[],
									)}
									<lume-flex
										ref={e => setProjectContent(e)}
										id="projectContent"
										size-mode="p l"
										size="0.8 1"
										direction="row"
										justify-content="center"
										gap="40"
										skip={showCards() ? true : false}
										visible={showCards() ? false : true}
									>
										<lume-element3d size-mode="p l" size="1 300">
											<p
												ref={e => {
													const size = elementSize(e)
													const parent = e.parentElement as Element3D
													createEffect(() => (parent.size.y = size.clientHeight()))
												}}
											>
												Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris ac rhoncus neque. Etiam quis
												orci eros. Maecenas vitae ex ut massa accumsan viverra a et lectus. Donec aliquet augue erat,
												nec gravida ligula dignissim vitae. Aenean bibendum, elit at auctor sodales, erat leo semper
												libero, rutrum mattis tellus lectus a dolor. In metus sapien, maximus vitae enim at, molestie
												ornare orci. Sed blandit pulvinar pretium. Duis a urna suscipit, convallis nulla vitae, pretium
												lectus.
											</p>
										</lume-element3d>
										<lume-tilt-card
											size-mode="p l"
											size="1 300"
											image="/content/neofairies/Neo_Fairies_Ears_001.gif"
											rotation-amount="0"
										></lume-tilt-card>
										<lume-element3d size-mode="p l" size="1 300">
											<p
												ref={e => {
													const size = elementSize(e)
													const parent = e.parentElement as Element3D
													createEffect(() => (parent.size.y = size.clientHeight()))
												}}
											>
												Ut sed eros pretium, ornare purus vitae, placerat sapien. Nullam viverra nisi dolor, non
												vulputate libero mattis in. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
												convallis venenatis odio, in dapibus odio consequat vitae. Donec accumsan, odio id mollis
												tristique, nisl urna accumsan velit, sed commodo velit mi a quam. Aliquam pellentesque enim est,
												in blandit lorem iaculis vitae. In vel felis tincidunt, dignissim augue id, bibendum velit.
												Quisque tristique ipsum vitae ante iaculis varius. Morbi ut felis mattis, auctor magna vitae,
												vestibulum ante. Suspendisse dictum metus vel eleifend viverra. Vestibulum tempus pellentesque
												mi nec pellentesque. Pellentesque ac pharetra turpis. In ornare, tortor at mattis sollicitudin,
												diam risus iaculis metus, in blandit velit libero ac justo.
											</p>
										</lume-element3d>
									</lume-flex>
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
            #projectContent {
                p {
                    margin: 0;
					user-select: text;
                }
            }

            lume-scroller {
                /*
                 * Weird workaround due to pointer events working differently
                 * across browsers CSS 3D. Let's just say CSS 3D (in all major
                 * browsers today) is the worst 3D engine in the history of
                 * human computing.
                 *
                 */
                ${
									// (prettier formatter doesn't know how to handle this part)
									detectBrowser() === 'firefox'
										? /*css*/ `
                            pointer-events: none;
                            * { pointer-events: none; }
                            lume-tilt-card {
                                pointer-events: auto;
                            }
                        `
										: ''
								}
                /* uncomment this to debug the issue, to visualize the CSS planes (which are invisible in Safari for some reason!) */
                /*lume-element3d, lume-tilt-card::part(root) {
                    background: rgb(255 255 255 / 0.8);
                }*/
            }

            lume-tilt-card {
                a {
                    display: block;
                    width: 100%;
                    height: 100%;
                    -webkit-tap-highlight-color: transparent;
                    user-select: none;
                }
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

function fadeElement(element: Element3D | (() => Element3D), targetOpacity: number, targetZ: number, delay: number) {
	const el = createMemo(() => (typeof element === 'function' ? element() : element))
	const [opacityDone, setOpacityDone] = createSignal(false)
	const [zDone, setZDone] = createSignal(false)

	createEffect(() => {
		const _el = el()
		if (!_el) return
		if (untrack(() => _el.opacity === targetOpacity && _el.position.z === targetZ))
			return setOpacityDone(true), setZDone(true)

		const direction = untrack(() => _el.opacity) - targetOpacity < 0 ? 1 : -1
		let cleaned = false

		const timeout = setTimeout(() => {
			_el.opacity = o => {
				if (o === targetOpacity || cleaned) {
					!cleaned && setOpacityDone(true)
					return false
				}
				o += 0.05 * direction
				return direction < 0 ? Math.max(o, targetOpacity) : Math.min(o, targetOpacity)
			}
			_el.position = (x, y, z) => {
				if (z === targetZ || cleaned) {
					!cleaned && setZDone(true)
					return false
				}
				z += 1 * direction
				return [x, y, direction < 0 ? Math.max(z, targetZ) : Math.min(z, targetZ)]
			}
		}, delay)

		onCleanup(() => {
			clearTimeout(timeout)
			cleaned = true
			setOpacityDone(false)
			setZDone(false)
		})
	})

	const done = createMemo(() => opacityDone() && zDone())
	return done
}
