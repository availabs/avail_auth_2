import { message } from "./systemMessages.module"
import { getUsers } from "./users.module"

import { postJson } from "./utils"

const GET_REQUESTS = "GET_REQUESTS"

export const getRequests = () =>
  (dispatch, getState) => {
    const { token } = getState().user;
    if (token) {
      return postJson("/requests", { token })
      	.then(res => {
        	if (res.error) {
          		dispatch(message(res.error));
        	}
        	else {
          		dispatch({
          			type: GET_REQUESTS,
                ...res
          		})
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

export const accept = (request, group_name) =>
  (dispatch, getState) => {
    const { token } = getState().user;
    if (token) {
      return postJson("/signup/accept",
                        { token,
                          group_name,
                          user_email: request.user_email,
                          project_name: request.project_name
                        })
      	.then(res => {
        	if (res.error) {
          		dispatch(message(res.error));
        	}
        	else {
  			dispatch(getRequests());
        dispatch(getUsers());
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
export const reject = request =>
  (dispatch, getState) => {
    const { token } = getState().user;
    if (token) {
      return postJson("/signup/reject", { token, user_email: request.user_email, project_name: request.project_name })
      	.then(res => {
        	if (res.error) {
          		dispatch(message(res.error));
        	}
        	else {
      			dispatch(getRequests());
            dispatch(getUsers());
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

export const deleteRequest = request =>
  (dispatch, getState) => {
    const { token } = getState().user;
    if (token) {
      return postJson("/signup/delete", { token, user_email: request.user_email, project_name: request.project_name })
        .then(res => {
          if (res.error) {
              dispatch(message(res.error));
          }
          else {
            dispatch(getRequests());
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
    case GET_REQUESTS:
      return action.requests;
    default:
      return state;
  }
}
