import { message } from "./systemMessages.module"

import { postJson } from "./utils"

const RECEIVE_MESSAGES = "RECEIVE_MESSAGES"

export const getMessages = () =>
	(dispatch, getState) => {
		const { token } = getState().user;
		if (token) {
			postJson("/messages", { token })
				.then(res => {
					if (res.error) {
						dispatch(message(res.error));
					}
					else {
						dispatch({
							type: RECEIVE_MESSAGES,
							...res
						})
					}
				})
		}
		else {
			return Promise.resolve();
		}
	}

export const viewMessages = ids =>
	(dispatch, getState) => {
		if (!Array.isArray(ids)) ids = [ids];
		const { token } = getState().user;
		if (token) {
			postJson("/messages/view", { token, ids })
				.then(res => {
					if (res.error) {
						dispatch(message(res.error));
					}
					else {
						dispatch(getMessages())
					}
				})
		}
		else {
			return Promise.resolve();
		}
	}

export const deleteMessages = ids =>
	(dispatch, getState) => {
		if (!Array.isArray(ids)) ids = [ids];
		const { token } = getState().user;
		if (token) {
			postJson("/messages/delete", { token, ids })
				.then(res => {
					if (res.error) {
						dispatch(message(res.error));
					}
					else {
						dispatch(getMessages())
						if (res.message) {
							dispatch(message(res.message));
						}
					}
				})
		}
		else {
			return Promise.resolve();
		}
	}

export const postMessage = (heading, msg, type, target, project) =>
	(dispatch, getState) => {
		const { token } = getState().user;
		if (token) {
			postJson("/messages/post", { token, heading, message: msg, type, target, project })
				.then(res => {
					if (res.error) {
						dispatch(message(res.error));
					}
					else if (res.message) {
						dispatch(message(res.message));
					}
				})
		}
		else {
			return Promise.resolve();
		}
	}

const INITIAL_STATE = []

export default (state=INITIAL_STATE, action) => {
	switch (action.type) {
		case RECEIVE_MESSAGES:
			return action.messages;
		default:
			return state;
	}
}
