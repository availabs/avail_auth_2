const PreferencesHandlers = require("../handlers/preferences.handlers")

module.exports = [

	{ route: "/preferences",
		method: "post",
		handler: PreferencesHandlers.get
	},

	{ route: "/preferences/update",
		method: "post",
		handler: PreferencesHandlers.update
	},

	// { route: "/preferences/delete",
	// 	method: "post",
	// 	handler: PreferencesHandlers.delete
	// }

]
