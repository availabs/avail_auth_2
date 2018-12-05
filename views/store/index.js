import {
	createStore,
	combineReducers,
	applyMiddleware
} from 'redux'
import thunk from 'redux-thunk'

import modules from "./modules"

const middleware = [
	thunk
]

export default () => createStore(
  combineReducers(modules),
  applyMiddleware(...middleware)
)