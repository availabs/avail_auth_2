const ProjectHandlers = require("../handlers/project.handlers")

module.exports = [

	{
		route: "/projects",
		method: "post",
		handler: ProjectHandlers.get
	},

	{
		route: "/project/create",
		method: "post",
		handler: ProjectHandlers.create
	},
	{
		route: "/project/delete",
		method: "post",
		handler: ProjectHandlers.delete
	}

]