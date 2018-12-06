const utils = require("./utils/message.utils");

module.exports = {

	get: (req, res) => {
		const { token } = req.body;
		utils.get(token)
			.then(messages => res.json({ messages }))
			.catch(e => res.json({ error: e.message }));
	},

	post: (req, res) => {
		const { token, heading, message, type, target } = req.body;
		utils.post(token, heading, message, type, target)
			.then(message => res.json({ message }))
			.catch(e => res.json({ error: e.message }));
	},

	view: (req, res) => {
		const { token, ids } = req.body;
		utils.view(token, ids)
			.then(message => res.json({ message }))
			.catch(e => res.json({ error: e.message }));
	},

	delete: (req, res) => {
		const { token, ids } = req.body;
		utils.delete(token, ids)
			.then(message => res.json({ message }))
			.catch(e => res.json({ error: e.message }));
	}

}