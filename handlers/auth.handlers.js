const utils = require("./utils/auth.utils")

module.exports = {

	landing: (req, res) => {
		res.render("landing");
	},

	login: (req, res) => {
		const { email, password, project } = req.body;
		utils.login(email, password, project)
			.then(user => res.json({ user }))
			.catch(error => res.json({ error: error.message }));
	},

	auth: (req, res) => {
		const { token, project } = req.body;
		utils.auth(token, project)
			.then(user => res.json({ user }))
			.catch(error => res.json({ error: error.message }));
	},

	signup: (req, res) => {
		res.render("signup");
	},
	signupRequest: (req, res) => {
		const { email, project } = req.body;
		if (!email || !project) {
			return res.json({ error: "You must supply an email and project." });
		}
		utils.signupRequest(email, project)
			.then(user => res.json({ message: "Your request is pending. You should receive an email shortly." }))
			.catch(error => res.json({ error: error.message }));
	},
	signupAccept: (req, res) => {
		const { token, group_name, user_email, project_name } = req.body;
		utils.signupAccept(token, group_name, user_email, project_name)
			.then(() => res.json({ message: `Signup request for ${ user_email } has been accepted.` }))
			.catch(error => res.json({ error: error.message }));
	},
	signupReject: (req, res) => {
		const { token, user_email, project_name } = req.body;
		utils.signupReject(token, user_email, project_name)
			.then(() => res.json({ message: `Signup request for ${ user_email } has been rejected.` }))
			.catch(error => res.json({ error: error.message }));
	},
	deleteSignup: (req, res) => {
		const { token, user_email, project_name } = req.body;
		utils.deleteSignup(token, user_email, project_name)
			.then(message => res.json({ message }))
			.catch(error => res.json({ error: error.message }));
	},
	
	getRequests: (req, res) => {
		const { token } = req.body;
		utils.getRequests(token)
			.then(requests => res.json({ requests }))
			.catch(e => res.json({ error: e.message }));
	},
	
	passwordSetView: (req, res) => {
		const { token } = req.params;
		utils.passwordSetView(token)
			.then(() => res.render("set", { token }))
			.catch(() => res.render("404"));
	},
	passwordSet: (req, res) => {
		const { token, password } = req.body;
		utils.passwordSet(token, password)
			.then(token => res.json({ token, message: "Your password has been set." }))
			.catch(error => res.json({ error: error.message }));
	},

	reset: (req, res) => {
		res.render("reset");
	},
	passwordUpdate: (req, res) => {
		const { token, current, password } = req.body;
		utils.passwordUpdate(token, current, password)
			.then(token => res.json({ token, message: "Your password has been updated." }))
			.catch(error => res.json({ error: error.message }));
	},
	passwordReset: (req, res) => {
		const { email } = req.body;
		utils.passwordReset(email)
			.then(() => res.json({ message: "Your password has been reset." }))
			.catch(error => res.json({ error: error.message }));
	}
}