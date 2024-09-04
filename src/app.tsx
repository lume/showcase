import {Router, useNavigate, useParams} from '@solidjs/router'
import {FileRoutes} from '@solidjs/start/router'
import {createEffect, createMemo, createSignal, onCleanup, onMount, Suspense, untrack, Show} from 'solid-js'
import {createMutable} from 'solid-js/store'
import {Motor, type Scene, type Element3D, type PointLight, RoundedRectangle} from 'lume'
import {Easing} from '@tweenjs/tween.js'
import {elementSize} from './utils/elementSize.js'
import './app.css'
import './elements/Scroller.js'
import type {Scroller} from './elements/Scroller.js'
import './elements/Flex.js'
import type {Flex, FlexItem} from './elements/Flex.js'
import './elements/TiltCard.js'
import {type TiltCard} from './elements/TiltCard.js'
import {childLumeElements} from './utils/childLumeElements.js'
import {projects} from './projects.js'

const dark = true

export default function App() {
	return (
		<Router
			root={props => {
				const [scene, setScene] = createSignal<Scene>([])
				const [titleBox, setTitleBox] = createSignal<Element3D>()
				const [contentRotator, setContentRotator] = createSignal<Element3D>()
				const [scroller, setScroller] = createSignal<Scroller>()
				const [header, setHeader] = createSignal<HTMLHeadingElement>()
				const [cards, setCards] = createSignal<FlexItem[]>([])
				const [projectContent, setProjectContent] = createSignal<Flex>()

				const routeParams = useParams<Params>()
				const navigate = useNavigate()

				const sceneSizeX = createMemo(() => scene()?.calculatedSize?.x ?? 0)

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

				// onMount -> client only
				onMount(() => {
					document.body.style.setProperty(
						'--font-base-color',
						dark ? 'var(--font-base-light-color)' : 'var(--font-base-dark-color)',
					)

					createEffect(() => {
						const light = document.querySelector('#light') as PointLight

						const rotator = contentRotator()
						if (!rotator) return

						const task = Motor.addRenderTask(time => {
							light.position.x += (state.pointer.x - light.position.x) * 0.05
							light.position.y += (state.pointer.y - light.position.y) * 0.05

							const rotationAmount = 5
							const targetRotationX = -((state.pointer.y / window.innerHeight) * rotationAmount - rotationAmount / 2)
							const targetRotationY = +((state.pointer.x / window.innerWidth) * rotationAmount - rotationAmount / 2)
							rotator.rotation.x += (targetRotationX - rotator.rotation.x) * 0.05
							rotator.rotation.y += (targetRotationY - rotator.rotation.y) * 0.05
						})

						onCleanup(() => Motor.removeRenderTask(task))
					})

					createEffect(() => {
						if (transitionCardsOut()) {
							const done = fadeCardsOut(cards())
							createEffect(() => done() && (setShowCards(false), scroller()!.scroll(0, 0)))
						} else {
							fadeCardsIn(cards())
							setShowCards(true)
							scroller()!.scroll(0, 0)
						}
					})

					createEffect(() => {
						if (transitionProjectItemsIn()) fadeProjectIn(projectItems)
						else fadeProjectOut(projectItems)
					})
				})

				const pagePadding = 40
				const flexGap = 60

				return (
					<main>
						{/* The route component is rendered here. */}
						<Suspense>{props.children}</Suspense>

						<lume-scene
							webgl
							swap-layers
							shadow-mode="vsm"
							style="position: absolute; left: 0; top: 0;"
							ref={setScene}
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
								distance="4000"
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
								<lume-scroll-item skip="true" slot="scrollarea" align-point="0 0" mount-point="0 0" position="40 40 0">
									<BackButton visible={sceneSizeX() >= 1024 && !!routeParams.project} />
								</lume-scroll-item>

								<lume-scroll-item
									skip="true"
									slot="scrollarea"
									size-mode="p p"
									size="1.5 1.5"
									align-point="0.5 0.5"
									mount-point="0.5 0.5"
									position="0 0 -30"
								>
									<lume-sphere
										visible={dark && false}
										align-point="0.5 0.5"
										mount-point="0.5 0.5"
										size="10000"
										texture="https://docs.lume.io/examples/hello-world/galaxy_starfield.png"
										sidedness="double"
									></lume-sphere>

									{/* background plane for receiving shadows. Placed relative to the scrollarea, but skipped from affecting the calculated scroll area, its a visual only. */}
									<lume-plane
										visible={!dark || true}
										size-mode="p p"
										size="1 1"
										color={dark ? '#333' : 'white'}
										dithering
									></lume-plane>
								</lume-scroll-item>

								<lume-flex size-mode="p l" size="1 1" justify-content="center" gap={flexGap} padding={pagePadding}>
									<lume-element3d id="headerContainer" size-mode="p l" size={[1, titleBoxSizeY(), 0]}>
										<lume-flex
											ref={setTitleBox}
											size-mode="p l"
											size="1 1"
											justify-content="center"
											gap="20"
											align-content="center"
										>
											<lume-flex-item
												size="60 60"
												skip={
													(console.log('skip????', !(sceneSizeX() < 1024 && !!routeParams.project)),
													!(sceneSizeX() < 1024 && !!routeParams.project))
												}
											>
												<BackButton visible={sceneSizeX() < 1024 && !!routeParams.project} />
											</lume-flex-item>

											<lume-element3d
												id="header"
												// Using forceTick here because the resize happens
												// *after* the aniamtion frame has rendered. Without it
												// the result of this will be drawn one frame behind,
												// make a small visual glitch.
												size={[(Motor.forceTick(), headerWidth()), 60]}
											>
												<h1 ref={setHeader}>
													<div>
														{routeParams.project
															? `Project: ${projects.find(p => p.slug === routeParams.project)!.name}`
															: routeParams['404']
																? 'Page Not Found'
																: 'Showcase'}
													</div>
												</h1>
											</lume-element3d>
										</lume-flex>
									</lume-element3d>

									<lume-flex
										id="bodyContainer"
										size-mode="p l"
										size="1 1"
										gap={flexGap}
										padding="0"
										justify-content="center"
										xalign-items="center"
										align-items-comment="align-items is not working yet"
										align-content="center"
										align-content-comment="align-content is not working yet"
										ref={e => {
											setTimeout(() => {
												// const headerContainer = document.querySelector('#headerContainer') as Flex
												e.minHeight = scroller()!.calculatedSize.y - e.position.y - pagePadding * 2
											})
										}}
									>
										{setCards(
											projects.map(({name, slug, image}, i) => (
												<lume-flex-item
													size="300 300"
													skip={showCards() ? false : true}
													position={showCards() ? [0, 0, 0] : [-100000, 0, 0]}
												>
													<lume-tilt-card size="300 300" image={image} onclick={() => navigate('/projects/' + slug)}>
														<a
															class="cardLink"
															xhref={'/projects/' + slug}
															oncontextmenu={(e: Event) => e.preventDefault()}
														></a>

														<lume-element3d class="name" align-point="0 1" mount-point="0 1" position="20 -16">
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
											)) as FlexItem[],
										)}
										<lume-flex
											ref={e => setProjectContent(e)}
											id="projectContent"
											size-mode="p l"
											size="0.8 1"
											direction="row"
											justify-content="center"
											gap={flexGap}
											skip={showCards() ? true : false}
											position={showCards() ? [-100000, 0, 0] : [0, 0, 0]}
										>
											{selectedProject()?.content.map(item =>
												item.type === 'html' ? (
													<lume-element3d size-mode="p l" size="1 300">
														<div
															ref={e => {
																const size = elementSize(e)
																const parent = e.parentElement as Element3D
																createEffect(() => (parent.size.y = size.clientHeight()))
															}}
															innerHTML={item.content}
														></div>
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
		// prettier-ignore
		return /*css*/ `
			#backBtn {
				border-radius: 100%;
				overflow: hidden;
				cursor: pointer;

				& * {
					cursor: pointer;
				}

				& a {
					display: block;
					width: min-content;
					aspect-ratio: 1 / 1;
					font-size: 2em;
					color: var(${dark || true ? '--font-base-light-color' : '--font-base-dark-color'});
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
                ${detectBrowser() === 'firefox' || true ? /*css*/ `
					pointer-events: none;
					& * { pointer-events: none; }
					& lume-tilt-card, & a, & #backBtn, & video {
						pointer-events: auto;
					}
				` : ''}
                /* uncomment this to debug the issue, to visualize the CSS planes (which are invisible in Safari for some reason!) */
                /*lume-element3d, lume-tilt-card::part(root) {
                    background: rgb(255 255 255 / 0.8);
                }*/
            }

			#header {
				display: flex !important;

				& h1 {
					display: flex;
					flex-wrap: wrap;
					align-content: center;
					margin: 0;
					user-select: text;

					& div {
						width: max-content;
						height: min-content;
					}
				}
			}

            lume-tilt-card {
                & .cardLink {
                    display: block;
                    width: 100%;
                    height: 100%;
                    -webkit-tap-highlight-color: transparent;
                    user-select: none;
                }

				& .name {
					color: #eee;
					pointer-events: none;
					font-weight: bold;
					text-shadow: 0 0 3px black;
					font-size: 1.3em;

					& div {
						width: max-content;
					}
				}
            }

            #projectContent {
                & p {
					user-select: text;
				}
                & p:first-child {
                    margin-top: 0;
                }
                & p:last-child {
                    margin-bottom: 0;
                }

				& video {
					width: 100%;
					xpointer-events: all;
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

function BackButton(props: {visible: boolean}) {
	const navigate = useNavigate()

	return (
		<lume-element3d id="backBtn" visible={props.visible} size="60 60 0" rotation="0 0 180" onclick={() => navigate(-1)}>
			<lume-rounded-rectangle
				size-mode="p p"
				size="1 1 0"
				thickness="100"
				position="0 0 -50"
				corner-radius="30"
				color={dark || true ? 'cornflowerblue' : '#ddd'}
			></lume-rounded-rectangle>

			<lume-element3d align-point="0.5 0.5" mount-point="0.5 0.5">
				<a
					ref={e => {
						const size = elementSize(e)
						const parent = e.parentElement as Element3D

						// Using forceTick here because the resize happens
						// *after* the aniamtion frame has rendered. Without it
						// the result of this will be drawn one frame behind,
						// make a small visual glitch.
						createEffect(
							() => ((parent.size.x = size.clientWidth()), (parent.size.y = size.clientHeight()), Motor.forceTick()),
						)
					}}
				>
					➜
				</a>
			</lume-element3d>
		</lume-element3d>
	)
}

// This is a very basic number animator, the start of what could be a *reactive* tweening library.
// For now its a linear tween. We could use our functions from Tween.js for easing curves.
function animateValue<T extends number>(
	getValue: () => T,
	setValue: (v: T) => {},
	targetValue: T,
	{
		delay = 0,
		duration = 1000,
		curve = Easing.Cubic.InOut,
	}: {
		/** Amount to delay before animating. */
		delay?: number
		/** Duration of the animation in milliseconds. */
		duration?: number
		/**
		 * The easing curve to use. The function
		 * accepts a value between 0 and 1 indicating start to finish time,
		 * and returns a value between 0 and 1 indicating start to finish
		 * position. You can pass any Tween.js Easing curve here, for
		 * example. Defaults to Tween.js Easing.Cubic.InOut
		 */
		curve?: (amount: number) => number
	} = {},
) {
	const [done, setDone] = createSignal(false)
	const startValue = untrack(getValue)

	createEffect(() => {
		if (untrack(getValue) === targetValue) return setDone(true)

		let frame = 0

		const timeout = setTimeout(() => {
			const start = performance.now()

			frame = requestAnimationFrame(function loop(time) {
				let val = getValue()

				const elapsed = time - start
				const elapsedPortion = elapsed / duration
				const amount = curve(elapsedPortion > 1 ? 1 : elapsedPortion)
				const valuePortion = amount * (targetValue - startValue)

				val = (startValue + valuePortion) as T
				setValue(val)

				if (val === targetValue) return setDone(true)

				frame = requestAnimationFrame(loop)
			})
		}, delay)

		onCleanup(() => {
			clearTimeout(timeout)
			cancelAnimationFrame(frame)
			setDone(false)
		})
	})

	return done
}

function fadeCard(element: TiltCard | (() => TiltCard), targetOpacity: number, targetZ: number, delay: number) {
	const elMemo = createMemo(() => (typeof element === 'function' ? element() : element))
	const [allDone, setAllDone] = createSignal(false)
	const duration = 500

	createEffect(() => {
		const el = elMemo()
		if (!el) return setAllDone(false)

		const rect = el.shadowRoot?.querySelector('lume-rounded-rectangle') as RoundedRectangle
		const name = el.querySelector('.name') as Element3D
		const parts = [rect, name] as const
		const dones: Array<() => boolean> = []

		for (const el of parts) {
			const _fadeDone = animateValue(
				() => el.opacity,
				v => (el.opacity = v),
				targetOpacity,
				{delay, duration, curve: Easing.Cubic.In},
			)

			dones.push(_fadeDone)

			const _translateDone = animateValue(
				() => el.position.z,
				v => (el.position.z = v),
				targetZ,
				{delay, duration},
			)

			dones.push(_translateDone)
		}

		createEffect(() => setAllDone(dones.every(done => done())))
	})

	return createMemo(() => allDone())
}

function fadeCardsOut(cards: FlexItem[]) {
	const staggerTime = 500
	const stagger = staggerTime / cards.length
	const dones: (() => boolean)[] = []

	for (const [i, card] of cards.entries()) {
		const el = card.children[0] as TiltCard
		const rect = el.shadowRoot?.querySelector('lume-rounded-rectangle') as RoundedRectangle

		const fadeDone = fadeCard(el, 0, -20, i * stagger)
		rect.castShadow = false

		// Add a small delay after cards are faded out (f.e. before fading in project content).
		const [postDelayDone, setPostDelayDone] = createSignal(false)
		createEffect(() => {
			if (!fadeDone()) return
			const timeout = setTimeout(() => setPostDelayDone(true), 150)
			onCleanup(() => clearTimeout(timeout))
		})

		dones.push(postDelayDone)
	}

	const allDone = createMemo(() => dones.every(d => !!d()))
	return allDone
}

function fadeCardsIn(cards: FlexItem[]) {
	const staggerTime = 500
	const stagger = staggerTime / cards.length

	const dones: (() => boolean)[] = []

	for (const [i, card] of cards.entries()) {
		const el = card.children[0] as TiltCard
		const rect = el.shadowRoot?.querySelector('lume-rounded-rectangle') as RoundedRectangle

		const fadeDone = fadeCard(el, 1, 0, i * stagger)
		createEffect(() => fadeDone() && (rect.castShadow = true))
		dones.push(fadeDone)
	}

	const allDone = createMemo(() => dones.every(d => !!d()))
	return allDone
}

function fadeProjectIn(projectItems: () => Element3D[]) {
	createEffect(() => {
		const _projectItems = projectItems()
		if (!_projectItems) return

		const stagger = 150

		for (const [i, item] of _projectItems.entries()) {
			const el = item

			const getOpacity = () => el.opacity
			const setOpacity = (v: number) => (el.opacity = v)
			const fadeDone = animateValue(getOpacity, setOpacity, 1, {
				delay: i * stagger,
				duration: 350,
				curve: Easing.Cubic.In,
			})

			const getPosition = () => el.position.z
			const setPosition = (v: number) => (el.position.z = v)
			const translateDone = animateValue(getPosition, setPosition, 0, {delay: i * stagger, duration: 350})

			if (el.tagName === 'LUME-TILT-CARD')
				createEffect(() => fadeDone() && translateDone() && ((el as TiltCard).castShadow = true))
		}
	})
}

function fadeProjectOut(projectItems: () => Element3D[]) {
	createEffect(() => {
		const _projectItems = projectItems()
		if (!_projectItems) return

		const stagger = 150

		for (const [i, item] of _projectItems.entries()) {
			const el = item

			const getOpacity = () => el.opacity
			const setOpacity = (v: number) => (el.opacity = v)
			const fadeDone = animateValue(getOpacity, setOpacity, 0, {
				delay: i * stagger,
				duration: 350,
				curve: Easing.Cubic.In,
			})

			const getPosition = () => el.position.z
			const setPosition = (v: number) => (el.position.z = v)
			const translateDone = animateValue(getPosition, setPosition, -20, {delay: i * stagger, duration: 350})

			if (el.tagName === 'LUME-TILT-CARD') (el as TiltCard).castShadow = false
		}
	})
}
