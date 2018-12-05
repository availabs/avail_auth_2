const StatsHandlers = require("../handlers/stats.handlers")

module.exports = [

	{
		route: "/logins",
		method: "post",
		handler: StatsHandlers.getLogins
	}

]