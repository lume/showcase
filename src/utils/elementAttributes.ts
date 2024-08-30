import {createEffect, untrack} from 'solid-js'
import {createMutable} from 'solid-js/store'
import {elementMutations} from './elementMutations.js'

export function elementAttributes(el: Element, options: Pick<MutationObserverInit, 'attributeFilter'> = {}) {
	const records = elementMutations(el, {attributes: true, ...options})
	const attributes = createMutable<Record<string, string | null | undefined>>({})

	createEffect(() => {
		records()

		// Untrack in case that an element has a reactive implementation of
		// getAttribute so it won't interfere here, as we're using
		// MutationObserver as out source of truth for reactivity in this case.
		untrack(() => {
			if (options.attributeFilter) {
				// specific list of attributes is observed
				const observedAttrs = options.attributeFilter
				for (const attr of observedAttrs) attributes[attr] = el.getAttribute(attr)
			} else {
				// all attributes are observed
				const attrs = Array.from(el.attributes)
				for (const prevAttr of Object.keys(attributes))
					if (!attrs.find(a => a.name === prevAttr)) delete attributes[prevAttr]
				for (const attr of attrs) attributes[attr.name] = attr.value
			}
		})
	})

	return attributes
}
