import { message } from "./systemMessages.module"

import { postJson } from "./utils"

const GET_PROJECTS = "GET_PROJECTS";

export const getProjects = () =>
  (dispatch, getState) => {
    const { token } = getState().user;
    if (token) {
      postJson("/projects", { token })
        .then(res => {
          if (res.error) {
              dispatch(message(res.error));
          }
          else {
              dispatch({
                type: GET_PROJECTS,
                ...res
              })
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
      postJson("/project/create", { token, name })
        .then(res => {
          if (res.error) {
              dispatch(message(res.error));
          }
          else {
              dispatch(message(res.message));
              dispatch(getProjects());
          }
        })
    }
    else {
      return Promise.resolve();
    }
  }
export const deleteProject = name =>
  (dispatch, getState) => {
    const { token } = getState().user;
    if (token) {
      postJson("/project/delete", { token, name })
        .then(res => {
          if (res.error) {
              dispatch(message(res.error));
          }
          else {
              dispatch(message(res.message));
              dispatch(getProjects());
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
    case GET_PROJECTS:
      return action.projects;
		default:
			return state;
	}
}