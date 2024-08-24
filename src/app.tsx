import {Router} from '@solidjs/router'
import {FileRoutes} from '@solidjs/start/router'
import {createMemo, Suspense} from 'solid-js'
import {useParams} from '@solidjs/router'
import './app.css'
import Scene from './components/Scene.js'

if (globalThis.window?.document) await import('lume')

export default function App() {
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
					</main>
				)
			}}
		>
			<FileRoutes />
		</Router>
	)
}
