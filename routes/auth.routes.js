const AuthHandlers = require("../handlers/auth.handlers")

module.exports = [
	{
		route: "/",
		handler: AuthHandlers.landing
	},

	{
		route: "/login",
		method: 'post',
		handler: AuthHandlers.login
	},

	{
		route: "/auth",
		method: 'post',
		handler: AuthHandlers.auth
	},

	{
		route: "/signup",
		handler: AuthHandlers.signup
	},
	{
		route: "/signup/request",
		method: 'post',
		handler: AuthHandlers.signupRequest
	},
	{
		route: "/signup/accept",
		method: 'post',
		handler: AuthHandlers.signupAccept
	},
	{
		route: "/signup/reject",
		method: 'post',
		handler: AuthHandlers.signupReject
	},
	{
		route: "/signup/delete",
		method: "post",
		handler: AuthHandlers.deleteSignup
	},
	
	{
		route: "/requests",
		method: "post",
		handler: AuthHandlers.getRequests
	},

	{
		route: "/password/set/:token",
		handler: AuthHandlers.passwordSetView
	},
	{
		route: "/password/set",
		method: "post",
		handler: AuthHandlers.passwordSet
	},

	{
		route: "/reset",
		handler: AuthHandlers.reset
	},
	{
		route: "/password/update",
		method: 'post',
		handler: AuthHandlers.passwordUpdate
	},
	{
		route: "/password/reset",
		method: 'post',
		handler: AuthHandlers.passwordReset
	}
]