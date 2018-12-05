const UserHandlers = require("../handlers/user.handlers")

module.exports = [
	
	{
		route: "/users",
		method: "post",
		handler: UserHandlers.getUsers
	},

	{
		route: "/user/group/assign",
		method: "post",
		handler: UserHandlers.assignToGroup,
	},
	{
		route: "/user/group/remove",
		method: "post",
		handler: UserHandlers.removeFromGroup
	},

	{
		route: "/user/delete",
		method: "post",
		handler: UserHandlers.delete
	}

]