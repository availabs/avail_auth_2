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

const store = createStore(
  combineReducers(modules),
  applyMiddleware(...middleware)
)

export default store