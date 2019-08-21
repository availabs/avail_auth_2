const utils = require("./utils/user.utils");

module.exports = {

	getUsers: (req, res) => {
		const { token } = req.body;
		utils.getUsers(token)
			.then(users => res.json({ users }))
			.catch(e => res.json({ error: e.message }));
	},

	assignToGroup: (req, res) => {
		const { token, user_email, group_name } = req.body;
		utils.assignToGroup(token, user_email, group_name)
			.then(message => res.json({ message }))
			.catch(e => res.json({ error: e.message }));
	},
	removeFromGroup: (req, res) => {
		const { token, user_email, group_name } = req.body;
		utils.removeFromGroup(token, user_email, group_name)
			.then(message => res.json({ message }))
			.catch(e => res.json({ error: e.message }));

	},

	delete: (req, res) => {
		const { token, user_email } = req.body;
		utils.delete(token, user_email)
			.then(message => res.json({ message }))
			.catch(e => res.json({ error: e.message }));
	},

	createFake: (req, res) => {
		const { token } = req.body;
		utils.createFake(token)
			.then(message => res.json({ message }))
			.catch(e => res.json({ error: e.message }));
	}

}
