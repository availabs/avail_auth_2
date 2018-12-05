import { message } from "./systemMessages.module"

import { postJson } from "./utils"

const RECEIVE_LOGINS = "RECEIVE_LOGINS"

export const getLogins = () =>
	(dispatch, getState) => {
		const { token } = getState().user;
		if (token) {
			postJson("/logins", { token })
				.then(res => {
					if (res.error) {
						dispatch(message(res.error));
					}
					else {
						dispatch({
							type: RECEIVE_LOGINS,
							...res
						})
					}
				})
		}
		else {
			return Promise.resolve();
		}
	}

const INITIAL_STATE = {
	logins: []
}

export default (state=INITIAL_STATE, action) => {
	switch (action.type) {
		case RECEIVE_LOGINS:
			return {
				...state,
				logins: action.logins
			}
		default:
			return state;
	}
}