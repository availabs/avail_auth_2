const utils = require("./utils/group.utils")

module.exports = {

	get: (req, res) => {
		const { token } = req.body;
		utils.get(token)
			.then(groups => res.json({ groups }))
			.catch(e => res.json({ error: e.message }));
	},
	groupsForProject: (req, res) => {
		const { token, project } = req.body;
		utils.groupsForProject(token, project)
			.then(groups => res.json({ groups }))
			.catch(e => res.json({ error: e.message }));
	},

	create: (req, res) => {
		const { token, name, meta, project_name, auth_level } = req.body;
		utils.create(token, name, meta)
			.then(() => res.json({ message: `Group ${ name } was successfully created.` }))
			.catch(e => res.json({ error: e.message }));
	},
	createAndAssign: (req, res) => {
		const { token, group_name, meta, project_name, auth_level } = req.body;
		utils.createAndAssign(token, group_name, meta, project_name, auth_level)
			.then(() => res.json({ message: `Group ${ group_name } was successfully created and assigned to project ${ project_name } at authority level ${ auth_level }.` }))
			.catch(e => res.json({ error: e.message }));
	},

	deleteGroup: (req, res) => {
		const { token, name } = req.body;
		utils.deleteGroup(token, name)
			.then(message => res.json({ message }))
			.catch(e => res.json({ error: e.message }));
	},

	assignToProject: (req, res) => {
		const { token, group_name, project_name, auth_level } = req.body;
		utils.assignToProject(token, group_name, project_name, auth_level)
			.then(() => res.json({ message: `Group "${ group_name }" was assigned to project "${ project_name }".` }))
			.catch(e => res.json({ error: e.message }))
	},
	removeFromProject: (req, res) => {
		const { token, group_name, project_name } = req.body;
		utils.removeFromProject(token, group_name, project_name)
			.then(() => res.json({ message: `Group "${ group_name }" was removed from project "${ project_name }".` }))
			.catch(e => res.json({ error: e.message }))
	},

	adjustAuthLevel: (req, res) => {
		const { token, group_name, project_name, auth_level } = req.body;
		utils.adjustAuthLevel(token, group_name, project_name, auth_level)
			.then(message => res.json({ message }))
			.catch(e => res.json({ error: e.message }))
	}

}
