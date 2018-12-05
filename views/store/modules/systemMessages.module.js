const MESSAGE = "MESSAGE",
	DISMISS = "DISMISS";

let UNIQUE_ID = 0;
const getUniqueId = () =>
	`error-messsage-${ ++UNIQUE_ID }`

const DEFAULT_OPTIONS = {
	duration: 5000,
	onConfirm: null
}
const mergeOptions = options => {
	return {
		...DEFAULT_OPTIONS,
		...options,
		id: options.id || getUniqueId(),
		type: options.type || (options.onConfirm ? 'danger' : 'warning')
	}
}

export const message = (message, options={}) =>
	dispatch => (
		dispatch({
			type: MESSAGE,
			message,
			options
		}),
		Promise.resolve()
	)

export const dismiss = id =>
	dispatch => (
		dispatch({
			type: DISMISS,
			id
		}),
		Promise.resolve()
	)

const INITIAL_STATE = []

export default (state=INITIAL_STATE, action) => {
	switch (action.type) {
		case MESSAGE:
			const messages = state.slice();
			if (!messages.reduce((a, c) => a || (c.id === action.options.id), false)) {
				messages.push({
					message: action.message,
					...mergeOptions(action.options)
				})
			}
			return messages;
		case DISMISS:
			return state.filter(e => e.id !== action.id)
		default:
			return state;
	}
}