const utils = require("./utils/preferences.utils")

module.exports = {

	get: (req, res) => {
		const { token, project } = req.body;
		utils.get(token, project)
			.then(preferences => res.json({ preferences }))
			.catch(e => res.json({ error: e.message }));
	},

	update: (req, res) => {
		const { token, project, preferences } = req.body;
		utils.update(token, project, preferences)
			.then(preferences =>
        res.json({
          preferences,
          message: `Preferences have been updated for project ${ project }.`
        })
      )
			.catch(e => res.json({ error: e.message }));
	},

	// delete: (req, res) => {
	// 	const { token, name } = req.body;
  //   res.json({ error: "NOT YET IMPLEMENTED" });
	// 	// utils.delete(token, name)
	// 	// 	.then(() => res.json({ message: `Project ${ name } was deleted.` }))
	// 	// 	.catch(e => res.json({ error: e.message }));
	// }

}
