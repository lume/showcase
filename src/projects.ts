interface ProjectItem {
	type: 'image' | 'html'
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

export const projects: Projects = [
	{
		name: 'Uthana',
		slug: 'uthana',
		image: '/content/uthana/uthana-characters-thumb.jpg',
		content: [
			{type: 'image', content: '/content/uthana/uthana-characters-banner.jpg'},
			{
				type: 'html',
				content: /*html*/ `
					<p>
						Uthana is an AI app that makes it possible for 3D
						character artists and animators to prompt Uthana's AI
						with textual descriptions of desired animated motions to
						be applied to their 3D characters. An artist or
						animator uploads a 3D model, describes a motion such as
						"walk around like a zombie", previews and adjusts the
						generated motion, and finally downloads a new version of
						their 3D model with the new animation data included with
						the model.
					</p>

                    <p>
                        Here is an overview of the app by Uthana's founder Viren Tellis:
                    </p>

                    <video src="/content/uthana/viren-uthana-overview.mp4" controls></video>

                    <p>
                        Lume Element was used for organizing all UI components,
                        and Lume's 3D elements were used for the background 3D
                        scene features including loading and displaying 3D
                        models, lighting, and managing and editing animations.
                    </p>
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
				type: 'html',
				content: `
					I worked on Neo Fairies......
				`,
			},
			{type: 'image', content: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
			{
				type: 'html',
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
				type: 'html',
				content: `
					Globus is a music app....
				`,
			},
			{type: 'image', content: '/content/neofairies/Neo_Fairies_Ears_001.gif'},
			{
				type: 'html',
				content: `
					Audio visuals.....
				`,
			},
		],
	},

	// ...Array.from({length: 30}).map(() => ({
	// 	name: 'Test',
	// 	slug: 'test',
	// 	image: '/content/neofairies/fairies-come-out.jpeg',
	// 	content: [],
	// })),
]
