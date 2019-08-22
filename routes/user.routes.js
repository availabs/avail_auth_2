const UserHandlers = require("../handlers/user.handlers")

module.exports = [

	{
		route: "/users",
		method: "post",
		handler: UserHandlers.getUsers
	},
	{
		route: "/users/bygroup",
		method: "post",
		handler: UserHandlers.getUsersByGroup
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
	},

	{
		route: "/user/create/fake",
		method: "post",
		handler: UserHandlers.createFake
	}

]
