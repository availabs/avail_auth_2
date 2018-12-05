const utils = require("./utils/stats.utils");

module.exports = {

	getLogins: (req, res) => {
		const { token } = req.body;
		utils.getLogins(token)
			.then(logins => res.json({ logins }))
			.catch(e => res.json({ error: e.message }));
	}

}