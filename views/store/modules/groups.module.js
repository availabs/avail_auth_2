import { message } from "./systemMessages.module"

import { postJson } from "./utils"

const GET_GROUPS = "GET_GROUPS";

export const getGroups = () =>
	(dispatch, getState) => {
		const { token } = getState().user;
		if (token) {
			return postJson("/groups", { token })
				.then(res => {
					if (res.error) {
						dispatch(message(res.error));
					}
					else {
						dispatch({
							type: GET_GROUPS,
							...res
						});
					}
				})
		}
		else {
			return Promise.resolve();
		}
	}

export const create = name =>
	(dispatch, getState) => {
		const { token } = getState().user;
		if (token) {
			return postJson("/group/create", { token, name })
				.then(res => {
					if (res.error) {
						dispatch(message(res.error));
					}
					else {
						dispatch(getGroups());
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
export const deleteGroup = name =>
	(dispatch, getState) => {
		const { token } = getState().user;
		if (token) {
			return postJson("/group/delete", { token, name })
				.then(res => {
					if (res.error) {
						dispatch(message(res.error));
					}
					else {
						dispatch(getGroups());
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

export const assignToProject = (group_name, project_name, auth_level) =>
	(dispatch, getState) => {
		const { token } = getState().user;
		if (token) {
			return postJson("/group/project/assign", { token, group_name, project_name, auth_level })
				.then(res => {
					if (res.error) {
						dispatch(message(res.error));
					}
					else {
						dispatch(getGroups());
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
export const removeFromProject = (group_name, project_name) =>
	(dispatch, getState) => {
		const { token } = getState().user;
		if (token) {
			return postJson("/group/project/remove", { token, group_name, project_name })
				.then(res => {
					if (res.error) {
						dispatch(message(res.error));
					}
					else {
						dispatch(getGroups());
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

export const adjustAuthLevel = (group_name, project_name, auth_level) =>
	(dispatch, getState) => {
		const { token } = getState().user;
		if (token) {
			return postJson("/group/project/adjust", { token, group_name, project_name, auth_level })
				.then(res => {
					if (res.error) {
						dispatch(message(res.error));
					}
					else {
						dispatch(getGroups());
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
		case GET_GROUPS:
			return action.groups;
		default:
			return state;
	}
}
