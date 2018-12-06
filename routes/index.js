const { readdirSync } = require("fs"),

	routeRegex = /\w+[.]routes[.]js/;

const routes = readdirSync("./routes")
	.filter(file => routeRegex.test(file))
	.reduce((routes, file) => routes.concat(require(`./${ file }`)), []);

const DEFAULT_ROUTE_OPTIONS = {
	method: "get"
}

module.exports = app =>
	routes.forEach(route => {
		const r = {
			...DEFAULT_ROUTE_OPTIONS,
			...route
		}
		app[r.method](r.route, r.handler)
	})