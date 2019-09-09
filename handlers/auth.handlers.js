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
			.then(user => {
				res.json({ user })
			})
			.catch(e => res.json({ error: e.message }));
	},

	signup: (req, res) => {
		res.render("signup");
	},
	signupRequest: (req, res) => {
		const {
			email,
			project,
			addToGroup,	// OPTIONAL, group name to automatically add user to, MUST BE auth_level 0
			host,	// OPTIONAL, should NOT end in /
						// defaults to host imported from "./host.json"
			url		// OPTIONAL, should NOT end in /
						// defaults to "/password/set"
		} = req.body;
		if (!email || !project) {
			return res.json({ error: "You must supply an email and project." });
		}
		if (Boolean(addToGroup)) {
			let projectData = {};
			if (host && url) {
				projectData = { HOST: host, URL: url};
			}
			utils.addToGroup(email, project, addToGroup, projectData)
				.then(user => res.json({ user, message: `You should receive an email shortly with login information.` }))
				.catch(error => res.json({ error: error.message }));
		}
		else {
			utils.signupRequest(email, project)
				.then(() => res.json({ message: "Your request is pending. You should receive an email shortly." }))
				.catch(error => res.json({ error: error.message }));
		}
	},
	signupAccept: (req, res) => {
		const {
			token,	// the json token of authorizing user
			group_name, // group to add new user to
			user_email, // email of new user
			project_name, // project name that the group has access to
			host,	// OPTIONAL, should NOT end in /
						// defaults to host imported from "./host.json"
			url		// OPTIONAL, should NOT end in /
						// defaults to "/password/set"
		} = req.body;

		let projectData = {};
		if (host && url) {
			projectData = { HOST: host, URL: url };
		}

		utils.signupAccept(token, group_name, user_email, project_name, projectData)
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
		utils.verify(token)
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
			.then(() => res.json({ message: "Your password has been reset. You should receive an email shortly." }))
			.catch(error => res.json({ error: error.message }));
	}
}
