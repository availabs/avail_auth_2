import { message } from "./systemMessages.module"

import { postJson } from "./utils"

export const project = "avail_auth";

const SUCCESS = "SUCCESS",

	LOGOUT = "LOGOUT";

const setUserToken = user => {
	if (localStorage) {
  	localStorage.setItem("userToken", user.token);
	}
}
const getUserToken = user => {
	if (localStorage) {
  	return localStorage.getItem("userToken");
	}
	return null;
}
const removeUserToken = () => {
	if (localStorage) {
		localStorage.removeItem("userToken");
	}
}

export const login = (email, password) =>
	dispatch =>
   	postJson("/login", { email, password, project })
    	.then(res => {
      	if (res.error) {
        		dispatch(message(res.error));
      	}
      	else {
        		setUserToken(res.user);
        		dispatch({
        			type: SUCCESS,
        			...res.user
        		})
      	}
    	})

export const auth = () =>
	dispatch => {
		const token = getUserToken();
		if (token) {
   		return postJson("/auth", { token, project })
        .then(res => {
          	if (res.error) {
              dispatch(logout());
      				dispatch(message(res.error));
          	}
          	else {
	            setUserToken(res.user);
          		dispatch({
          			type: SUCCESS,
          			...res.user
          		})
          		if (res.message) {
          			dispatch(message(res.message));
          		}
          	}
        });
		}
		else {
			return Promise.resolve();
		}
  }

export const logout = () =>
	dispatch => (
		removeUserToken(),
		dispatch({ type: LOGOUT }),
		Promise.resolve()
	)

export const signup = email =>
	dispatch =>
    postJson("/signup/request", { email, project })
      .then(res => {
      	if (res.error) {
					dispatch(message(res.error));
      	}
      	else if (res.message) {
      		dispatch(message(res.message));
      		dispatch(message("You should receive an email shortly."));
      	}
      });

export const passwordUpdate = (current, password, onUpdate=null) =>
	(dispatch, getState) => {
		const { token } = getState().user;
		if (token) {
      return postJson("/password/update", { token, current, password, project })
        .then(res => {
        	if (res.error) {
	  				dispatch(message(res.error));
        	}
        	else {
	        	setUserToken(res);
        		if (res.message) {
        			dispatch(message(res.message));
        		}
        		if (typeof onUpdate === 'function') onUpdate();
        	}
        });
		}
		else {
			return Promise.resolve();
		}
	}

export const passwordSet = (password, onSet=null) =>
  (dispatch, getState) => {
    const { token } = getState().user;
    if (token) {
      return postJson("/password/set", { token, password })
        .then(res => {
          if (res.error) {
            dispatch(message(res.error));
          }
          else {
            setUserToken(res);
            if (res.message) {
              dispatch(message(res.message));
            }
            if (typeof onSet === 'function') onSet();
          }
        });
    }
    else {
      return Promise.resolve();
    }
  }

export const passwordReset = (email, onReset=null) =>
	dispatch =>
		postJson("/password/reset", { email })
      .then(res => {
      	if (res.error) {
  				dispatch(message(res.error));
      	}
      	else {
      		if (res.message) {
      			dispatch(message(res.message));
      		}
      		if (typeof onReset === 'function') onReset();
      	}
      })

const INITIAL_STATE = {
	authed: false,
	token: null,
	authLevel: 0,
	groups: []
}

export default (state=INITIAL_STATE, action) => {
	switch (action.type) {
		case SUCCESS:
			return {
				authed: true,
				token: action.token,
				authLevel: action.authLevel,
				groups: action.groups
			};
		case LOGOUT:
			return INITIAL_STATE;
		default:
			return state;
	}
}