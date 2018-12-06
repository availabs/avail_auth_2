const utils = require("./utils/project.utils")

module.exports = {

	get: (req, res) => {
		const { token } = req.body;
		utils.get(token)
			.then(projects => res.json({ projects }))
			.catch(e => res.json({ error: e.message }));
	},

	create: (req, res) => {
		const { token, name } = req.body;
		utils.create(token, name)
			.then(() => res.json({ message: `Project ${ name } was created.` }))
			.catch(e => res.json({ error: e.message }));
	},
	delete: (req, res) => {
		const { token, name } = req.body;
		utils.delete(token, name)
			.then(() => res.json({ message: `Project ${ name } was deleted.` }))
			.catch(e => res.json({ error: e.message }));
	}

}