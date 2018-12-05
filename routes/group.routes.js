const GroupHandlers = require("../handlers/group.handlers")

module.exports = [

	{
		route: "/groups",
		method: "post",
		handler: GroupHandlers.get
	},

	{
		route: "/group/create",
		method: 'post',
		handler: GroupHandlers.create
	},
	{
		route: "/group/delete",
		method: "post",
		handler: GroupHandlers.deleteGroup
	},

	{
		route: "/group/project/assign",
		method: "post",
		handler: GroupHandlers.assignToProject
	},
	{
		route: "/group/project/remove",
		method: "post",
		handler: GroupHandlers.removeFromProject
	},

	{
		route: "/group/project/adjust",
		method: "post",
		handler: GroupHandlers.adjustAuthLevel
	}

]