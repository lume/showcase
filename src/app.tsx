import {Router, useParams} from '@solidjs/router'
import {FileRoutes} from '@solidjs/start/router'
import {createEffect, createMemo, createSignal, onCleanup, onMount, Suspense, untrack, Show} from 'solid-js'
import {createMutable} from 'solid-js/store'
import {Motor, type Element3D, type PointLight} from 'lume'
import {elementSize} from './utils/elementSize.js'
import './app.css'
import './elements/Scroller.js'
import type {Scroller} from './elements/Scroller.js'
import './elements/Flex.js'
import type {Flex} from './elements/Flex.js'
import './elements/TiltCard.js'
import {type TiltCard} from './elements/TiltCard.js'
import {childLumeElements} from './utils/childLumeElements.js'

interface ProjectItem {
	type: 'image' | 'paragraph'
	content: string
}

type ProjectContent = ProjectItem[]

interface Project {
	name: string
	slug: string
	image: string
	content: ProjectContent
}

type Projects = Project[]

const projects: Projects = [
	{
		name: 'Uthana',
		slug: 'uthana',
		image: '/content/uthana/uthana-characters-thumb.jpg',
		content: [
			{
				type: 'paragraph',
				content: `
					Uthana generates motion from prompts...
				`,
			},
			{type: 'image', content: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
			{
				type: 'paragraph',
				content: `
					Saves developers time...
				`,
			},
		],
	},
	{
		name: 'Neo Fairies',
		slug: 'neofairies',
		image: '/content/neofairies/fairies-come-out.jpeg',
		content: [
			{
				type: 'paragraph',
				content: `
					I worked on Neo Fairies......
				`,
			},
			{type: 'image', content: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
			{
				type: 'paragraph',
				content: `
					Editing a character....
				`,
			},
		],
	},
	{
		name: 'Globus',
		slug: 'globus',
		image: '/content/globus/globus-globe.jpg',
		content: [
			{
				type: 'paragraph',
				content: `
					Globus is a music app....
				`,
			},
			{type: 'image', content: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
			{
				type: 'paragraph',
				content: `
					Audio visuals.....
				`,
			},
		],
	},
]

export default function App() {
	return (
		<Router
			root={props => {
				const [titleBox, setTitleBox] = createSignal<Element3D>()
				const [contentRotator, setContentRotator] = createSignal<Element3D>()
				const [scroller, setScroller] = createSignal<Scroller>()
				const [header, setHeader] = createSignal<HTMLHeadingElement>()
				const [cards, setCards] = createSignal<TiltCard[]>([])
				const [projectContent, setProjectContent] = createSignal<Flex>()

				const routeParams = useParams<Params>()

				const titleBoxSizeY = createMemo(() => titleBox()?.calculatedSize.y ?? 1)
				const {clientWidth: headerWidth, clientHeight: headerHeight} = elementSize(header)

				// TODO dynamic values based on the initial route
				// TODO better name for showCards (hinge between both views)
				const [showCards, setShowCards] = createSignal(true)

				const transitionCardsOut = createMemo(() => !!routeParams.project)
				const projectItems = childLumeElements(projectContent)
				const transitionProjectItemsIn = createMemo(() => !showCards())

				const selectedProject = createMemo(() =>
					routeParams.project ? projects.find(p => p.slug === routeParams.project) : null,
				)

				const state = createMutable({
					pointer: {x: (globalThis.window?.innerWidth ?? 1) / 2, y: (globalThis.window?.innerHeight ?? 1) / 2},
				})

				const dark = false

				// onMount -> client only
				onMount(() => {
					document.body.style.setProperty('--font-base-color', dark ? '#eee' : '#444')

					createEffect(() => {
						const light = document.querySelector('#light') as PointLight

						const rotator = contentRotator()
						if (!rotator) return

						const task = Motor.addRenderTask(time => {
							light.position.x += (state.pointer.x - light.position.x) * 0.05
							light.position.y += (state.pointer.y - light.position.y) * 0.05

							const rotationAmount = 10
							const targetRotationX = -((state.pointer.y / window.innerHeight) * rotationAmount - rotationAmount / 2)
							const targetRotationY = +((state.pointer.x / window.innerWidth) * rotationAmount - rotationAmount / 2)
							rotator.rotation.x += (targetRotationX - rotator.rotation.x) * 0.05
							rotator.rotation.y += (targetRotationY - rotator.rotation.y) * 0.05
						})

						onCleanup(() => Motor.removeRenderTask(task))

						createEffect(() => {
							const stagger = 150
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
											createEffect(() => allDone() && (setShowCards(false), scroller()!.scroll(0, 0)))
										}
									} else {
										const done = fadeElement(el, 1, 0, i * stagger)
										createEffect(() => done() && (el.castShadow = true))
										setShowCards(true)
										scroller()!.scroll(0, 0)
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
								state.pointer.x = e.clientX
								state.pointer.y = e.clientY
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

							<lume-scroller
								size-mode="p p"
								size="1 1"
								ref={e => {
									setScroller(e)
									setTimeout(() => {
										const scrollRoot = e.shadowRoot!.querySelector('#scrollarea') as Element3D
										setContentRotator(scrollRoot)
									})
								}}
							>
								{/* background plane for receiving shadows. Placed relative to the scrollarea, but skipped from affecting the calculated scroll area, its a visual only. */}
								<lume-scroll-item
									skip="true"
									slot="scrollarea"
									size-mode="p p"
									size="1.5 1.5"
									align-point="0.5 0.5"
									mount-point="0.5 0.5"
									position="0 0 -30"
								>
									{dark ? (
										<lume-sphere
											align-point="0.5 0.5"
											mount-point="0.5 0.5"
											size="10000"
											texture="https://docs.lume.io/examples/hello-world/galaxy_starfield.png"
											sidedness="double"
										></lume-sphere>
									) : (
										<lume-plane visible="true" size-mode="p p" size="1 1"></lume-plane>
									)}
								</lume-scroll-item>

								<lume-flex size-mode="p l" size="1 1" justify-content="center" gap="60" padding="40">
									<lume-element3d id="header" size-mode="p l" size={[1, titleBoxSizeY(), 0]}>
										<lume-flex ref={setTitleBox} size-mode="p l" size="1 1" justify-content="center">
											<lume-element3d size={[headerWidth(), headerHeight()]}>
												<h1 ref={setHeader} style="display: block; width: max-content; margin: 0; user-select: text;">
													{routeParams.project
														? `Project: ${projects.find(p => p.slug === routeParams.project)!.name}`
														: routeParams['404']
															? 'Page Not Found'
															: 'Showcase'}
												</h1>
											</lume-element3d>
										</lume-flex>
									</lume-element3d>

									{setCards(
										projects.map(({name, slug, image}, i) => (
											<lume-flex-item
												size="300 300"
												skip={showCards() ? false : true}
												position={showCards() ? [0, 0, 0] : [-100000, 0, 0]}
											>
												<lume-tilt-card size="300 300" image={image}>
													<a style="" href={'/projects/' + slug} oncontextmenu={(e: Event) => e.preventDefault()}></a>

													<lume-element3d align-point="0 1" mount-point="0 1" position="10 -10">
														<div
															ref={e => {
																const size = elementSize(e)
																const parent = e.parentElement as Element3D
																createEffect(
																	() => ((parent.size.x = size.clientWidth()), (parent.size.y = size.clientHeight())),
																)
															}}
														>
															{name}
														</div>
													</lume-element3d>
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
										position={showCards() ? [-100000, 0, 0] : [0, 0, 0]}
									>
										{selectedProject()?.content.map(item =>
											item.type === 'paragraph' ? (
												<lume-element3d size-mode="p l" size="1 300">
													<p
														ref={e => {
															const size = elementSize(e)
															const parent = e.parentElement as Element3D
															createEffect(() => (parent.size.y = size.clientHeight()))
														}}
													>
														{item.content}
													</p>
												</lume-element3d>
											) : item.type === 'image' ? (
												<lume-tilt-card
													size-mode="p l"
													size="1 300"
													image={item.content}
													rotation-amount="0"
												></lume-tilt-card>
											) : null,
										)}
									</lume-flex>
								</lume-flex>
							</lume-scroller>
						</lume-scene>
						<style innerHTML={style(dark)}></style>
					</main>
				)
			}}
		>
			<FileRoutes />
		</Router>
	)

	function style(dark: boolean) {
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

				div {
					color: #eee;
					pointer-events: none;
					font-weight: bold;
					text-shadow: 0 0 3px black;
					font-size: 2em;
				}

				&:hover {
					&::part(root) {
					}

					div {
					}
				}
            }
        `
	}
}

function detectBrowser(): 'chrome' | 'safari' | 'firefox' {
	// if SSR
	if (!globalThis.navigator?.userAgent) return 'chrome'

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
