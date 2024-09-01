import {createMemo} from 'solid-js'
import {arraysEqual} from './arraysEqual.js'

export function createArrayMemo<T extends any>(fn: () => T[]) {
	return createMemo(fn, [], {equals: arraysEqual})
}
