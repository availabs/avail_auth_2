const utils = require("./utils/message.utils");

module.exports = {

	get: (req, res) => {
		const { token } = req.body;
		utils.getMessages(token)
			.then(messages => res.json({ messages }))
			.catch(e => res.json({ error: e.message }));
	},

	post: (req, res) => {
		const { token, heading, message, type, target } = req.body;
		utils.postMessage(token, heading, message, type, target)
			.then(message => res.json({ message }))
			.catch(e => res.json({ error: e.message }));
	},

	view: (req, res) => {
		const { token, ids } = req.body;
		utils.viewMessages(token, ids)
			.then(message => res.json({ message }))
			.catch(e => res.json({ error: e.message }));
	},

	deleteMessage: (req, res) => {
		const { token, ids } = req.body;
		utils.deleteMessages(token, ids)
			.then(message => res.json({ message }))
			.catch(e => res.json({ error: e.message }));
	}

}