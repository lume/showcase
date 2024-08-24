import {onMount} from 'solid-js'
import {useParams} from '@solidjs/router'
import type {Scene as LumeScene} from 'lume'
import type {PerspectiveCamera} from 'three'

export default function Scene() {
	const params = useParams<Params>()
	let scene: LumeScene

	// client only
	onMount(() => {
		setTimeout(() => {
			const cam = scene.threeCamera as PerspectiveCamera
			cam.far = 25000
			cam.near = 100
			cam.updateProjectionMatrix()
			scene.needsUpdate()
		})
	})

	return (
		<div style="width: 300px; height: 250px; border-bottom-left-radius: 100px; border-bottom-right-radius: 100px; overflow: hidden;">
			<div style="width: 300px; height: 300px;">
				<lume-scene webgl shadowmap-type="pcfsoft" ref={e => (scene = e)}>
					<lume-element3d align-point="0.333 0.333">
						<lume-ambient-light intensity="3.1"></lume-ambient-light>
						<lume-point-light position="-500 -500 800" intensity="600"></lume-point-light>

						{/* Use a camera rig to rotate the box instead of a camera by
            slotting the box into the camera position. */}
						<lume-camera-rig min-distance="0" distance="0" scale="-1 1 1" min-vertical-angle="0" max-vertical-angle="0">
							<lume-box
								slot="camera"
								ref={e => (e.rotation = (x, y, z) => [x, y + 0.5, z])}
								mount-point="0.5 0.5 0.5"
								rotation="12 23 34"
								color={
									params.project === 'foo'
										? 'orchid'
										: params.project === 'bar'
											? 'orange'
											: params[404]
												? 'turquoise'
												: 'cornflowerblue'
								}
								size="100 100 100"
							></lume-box>
						</lume-camera-rig>
					</lume-element3d>

					<lume-plane
						align-point="0.5 0.666"
						mount-point="0.5 0.5"
						size="2000 2000"
						rotation="90"
						color="#f4f4f4"
					></lume-plane>

					<lume-sphere
						mount-point="0.5 0.5 0.5"
						color="white"
						has="basic-material"
						size="1000"
						position="2000 -3200 -20000"
						align-point="0.5 0.5"
					>
						<lume-element3d align-point="0.5 0.5 0.5" ref={e => (e.rotation = (x, y, z) => [x, y + 0.1, z])}>
							<lume-sphere mount-point="0.5 0.5 0.5" color="#f4f4f4" size="1000" position="-1000 70 0"></lume-sphere>
						</lume-element3d>
					</lume-sphere>
				</lume-scene>
			</div>
		</div>
	)
}
