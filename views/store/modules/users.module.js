import { auth } from "./user.module"
import { message } from "./systemMessages.module"
import { getRequests } from "./requests.module"

import { postJson } from "./utils"

const GET_USERS = "GET_USERS";

export const getUsers = () =>
	(dispatch, getState) => {
		const { token } = getState().user;
		if (token) {
			postJson("/users", { token })
				.then(res => {
					if (res.error) {
						dispatch(message(res.error));
					}
					else {
						dispatch({
							type: GET_USERS,
							...res
						})
					}
				})
		}
		else {
			return Promise.resolve();
		}
	}

export const assign = (user_email, group_name) =>
	(dispatch, getState) => {
		const { token } = getState().user;
		if (token) {
			postJson("/user/group/assign", { token, user_email, group_name })
				.then(res => {
					if (res.error) {
						dispatch(message(res.error));
					}
					else {
						dispatch(getUsers());
						dispatch(auth());
						if (res.message) {
							dispatch(message(res.message));
						}
					}
				})
		}
	}
export const remove = (user_email, group_name) =>
	(dispatch, getState) => {
		const { token } = getState().user;
		if (token) {
			postJson("/user/group/remove", { token, user_email, group_name })
				.then(res => {
					if (res.error) {
						dispatch(message(res.error));
					}
					else {
						dispatch(getUsers());
						dispatch(auth());
						if (res.message) {
							dispatch(message(res.message));
						}
					}
				})
		}
	}

export const deleteUser = user_email =>
	(dispatch, getState) => {
		const { token } = getState().user;
		if (token) {
			postJson("/user/delete", { token, user_email })
				.then(res => {
					if (res.error) {
						dispatch(message(res.error))
					}
					else {
						dispatch(getRequests());
						dispatch(getUsers());
						dispatch(auth());
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

const INITIAL_STATE = [];

export default (state=INITIAL_STATE, action) => {
	switch (action.type) {
		case GET_USERS:
			return action.users;
		default:
			return state;
	}
}