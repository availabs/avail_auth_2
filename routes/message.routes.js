const MessageHandlers = require("../handlers/message.handlers")

module.exports = [

	{ route: "/messages",
		method: "post",
		handler: MessageHandlers.get
	},

	{ route: "/messages/post",
		method: "post",
		handler: MessageHandlers.post
	},

	{ route: "/messages/view",
		method: "post",
		handler: MessageHandlers.view
	},

	{ route: "/messages/delete",
		method: "post",
		handler: MessageHandlers.delete
	}

]
