import {Router} from '@solidjs/router'
import {FileRoutes} from '@solidjs/start/router'
import {createMemo, onMount, Suspense} from 'solid-js'
import {useParams} from '@solidjs/router'
import './app.css'
import Scene from './components/Scene.js'
import './elements/Scroller.js'

console.log('load app')

export default function App() {
	onMount(() => {
		import('lume')
	})

	return (
		<Router
			root={props => {
				const params = useParams<Params>()
				const noParams = createMemo(() => !Object.keys(params).length)

				return (
					<main>
						<div class="links">
							<a href="/" class={noParams() ? 'active' : ''} style="--active-color: cornflowerblue;">
								index
							</a>
							<a href="/projects/foo" class={params.project === 'foo' ? 'active' : ''} style="--active-color: orchid;">
								foo
							</a>
							<a href="/projects/bar" class={params.project === 'bar' ? 'active' : ''} style="--active-color: orange;">
								bar
							</a>
							<a href="/blahblah" class={params[404] ? 'active' : ''} style="--active-color: turquoise;">
								404
							</a>
						</div>

						<h1>{params.project ? `Project: ${params.project}` : params['404'] ? 'Page Not Found' : 'Hello World!'}</h1>

						{/* The route component is rendered here. */}
						<Suspense>{props.children}</Suspense>

						<Scene></Scene>

						<div style="width: 400px; height: 250px; border: 1px solid cornflowerblue;">
							<lume-scene webgl>
								<lume-point-light intensity="800" position="200 0 200"></lume-point-light>

								<lume-scroller size-mode="p p" size="1 1">
									{Array.from({length: 10}).map((_, i) => (
										<lume-box
											receive-shadow="false"
											color={`rgb(${[
												Math.round(255 * Math.random()),
												Math.round(255 * Math.random()),
												Math.round(255 * Math.random()),
											]})`}
											// TODO better prop type for position
											position={[0, i * 100, 0]}
											size="100 100 100"
										></lume-box>
									))}
								</lume-scroller>
							</lume-scene>
						</div>
					</main>
				)
			}}
		>
			<FileRoutes />
		</Router>
	)
}
