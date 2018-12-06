const MessageHandlers = require("../handlers/message.handlers")

module.exports = [

	{
		route: "/messages",
		method: "post",
		handler: MessageHandlers.get
	},

	{
		route: "/message/post",
		method: "post",
		handler: MessageHandlers.post
	},

	{
		route: "/message/view",
		method: "post",
		handler: MessageHandlers.view
	},

	{
		route: "/message/delete",
		method: "post",
		handler: MessageHandlers.delete
	}

]