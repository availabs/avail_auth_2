const get = require("lodash.get")

const { query, queryAll } = require("./db_service");
const {
	verifyAndGetUserData,
	getUserAuthLevel
} = require("./auth.utils");

const slacker = require("./slacker")

const DefaultUserPreferences = {
	receiveEmail: false,
	receiveSlack: false,
	// slackUserId: <-- required if receiveSlack === true
}

const sendMessageToUser = async (senderData, heading, message, send_to, project) => {

	let sql = `
		SELECT email
		FROM users
		WHERE email = $1;
	`
	if (!isNaN(send_to)) {
		sql = `
			SELECT email
			FROM users
			WHERE id = $1;
		`
	}
	const rows = await query(sql, [send_to]);

	if (!rows.length) {
		throw new Error(`User "${ send_to }" was not found.`);
	}

	const [{ email }] = rows;

console.log("SENDIG MESSAGE TO:", email)

	sql = `
		SELECT preferences
		FROM user_preferences
		WHERE user_email = $1
		AND project_name = $2;
	`
	const [row] = await query(sql, [email, project]);

	const preferences = get(row, "preferences", {});

	const {
		receiveEmail,
		receiveSlack,
		slackUserId
	} = { ...DefaultUserPreferences, ...preferences };

	if (receiveSlack && slackUserId) {
		await slacker(slackUserId, message);
	}

	sql = `
		INSERT INTO messages_new(heading, message, sent_by, sent_to, project_name)
		VALUES ($1, $2, $3, $4, $5);
	`
	await query(sql, [heading, message, senderData.email, email, project || null]);

	return 'Message sent.'
}

const sendMessageToUsers = async (senderData, heading, message, send_to, project) => {
console.log("sendMessageToUsers", send_to)
	const promises = send_to.map(user =>
		sendMessageToUser(senderData, heading, message, user, project)
	)
	await Promise.all(promises);

	return "Messages sent.";
}

const sendMessageToGroup = async (userData, heading, message, group, project) => {
	let sql = `
		SELECT COALESCE(auth_level, -1)
		FROM groups_in_projects
		WHERE group_name = $1
		AND project_name = $2;
	`
	const [reqAuthLevel] = await query(sql, [group, project]);

	if (reqAuthLevel === -1) {
		throw new Error(`Group ${ group } was not found.`);
	}

	sql = `
		SELECT MAX(auth_level) AS auth_level
		FROM users_in_groups AS uig
		INNER JOIN groups_in_projects AS gip
			USING(group_name)
		WHERE user_email = $1
		AND project_name = $2;
	`
	const [userAuthLevel] = await query(sql, [userData.email, project]);

	if (userAuthLevel < reqAuthLevel) {
		throw new Error(`You do not have the authority to message group ${ group }.`);
	}

	sql = `
		SELECT user_email
		FROM users_in_groups
		WHERE group_name = $1
		AND user_email != $2;
	`
	const users = await query(sql, [group, userData.email]);

	const promises = users.map(({ user_email }) => {
		return sendMessageToUser(userData, heading, message, user_email, project);
	});

	await Promise.all(promises);

	return `Sent message to group ${ group }.`
}

const sendMessageToProject = async (userData, heading, message, project) => {
	let sql = `
		SELECT COALESCE(MAX(auth_level), -1)
		FROM groups_in_projects
		WHERE project_name = $1;
	`
	const [reqAuthLevel] = await query(sql, [project]);

	if (reqAuthLevel === -1) {
		throw new Error(`Project ${ project } was not found.`);
	}

	sql = `
		SELECT MAX(auth_level) AS auth_level
		FROM users_in_groups AS uig
		INNER JOIN groups_in_projects AS gip
			USING(group_name)
		WHERE user_email = $1
		AND project_name = $2;
	`
	const [userAuthLevel] = await query(sql, [userData.email, project]);

	if (userAuthLevel < reqAuthLevel) {
		throw new Error(`You do not have the authority to message project ${ project }.`);
	}

	sql = `
		SELECT DISTINCT user_email
		FROM users_in_groups
		JOIN groups_in_projects
			USING(group_name)
		WHERE project_name = $1
		AND user_email != $2;
	`
	const users = await query(sql, [project, userData.email]);

	const promises = users.map(({ user_email }) => {
		return sendMessageToUser(userData, heading, message, user_email, project);
	});

	await Promise.all(promises);

	return `Sent message to project ${ project }.`
}

const sendMessageToAll = async (userData, heading, message) => {
	let sql = `
		SELECT count(1) AS count
		FROM users_in_groups
		WHERE group_name = 'AVAIL'
		AND user_email = $1;
	`
	const [{ count }] = await query(sql, [userData.email]);

	if (!count) {
		throw new Error('You do not have the authority to message all users.');
	}

	sql = `
		SELECT DISTINCT email
		FROM users
		WHERE email != $1;
	`
	const users = await query(sql, [userData.email]);

	const promises = users.map(({ email }) => {
		return sendMessageToUser(userData, heading, message, email, project);
	});

	await Promise.all(promises);

	return `Sent message to all users.`
}

module.exports = {

	get: (token, project = null) => {
		return verifyAndGetUserData(token)
			.then(userData => {
				const sql = `
					SELECT *
					FROM messages_new
					WHERE sent_to = $1
					${ project ? "AND project_name = $2" : "" };
				`
				const args = [userData.email];
				if (project) { args.push(project); }
				return query(sql, args);
			})
	},

	post: (token, heading, message, type, target, project) => {
// type = user || group || project || all
// sendTo = users:[userIds] || groups:[groupNames] || projects:[projectNames]
		return verifyAndGetUserData(token)
			.then(userData => {
				switch (type) {
					case "user":
						return sendMessageToUser(userData, heading, message, target, project);
					case "users":
						return sendMessageToUsers(userData, heading, message, target, project);
					case "group":
						return sendMessageToGroup(userData, heading, message, target, project);
					case "project":
						return sendMessageToProject(userData, heading, message, project);
					case "all":
						return sendMessageToAll(userData, heading, message);
					default:
						throw new Error(`Unknow message type ${ type }.`)
				}
			})
	},

	view: (token, ids) => {
		return verifyAndGetUserData(token)
			.then(userData => {
				const sql = `
					UPDATE messages_new
					SET viewed = TRUE
					WHERE id = ANY($1)
					AND sent_to = $2;
				`
				return query(sql, [ids, userData.email])
					.then(() => 'Message(s) set as viewed.');
			})
	},

	delete: (token, ids) => {
		return verifyAndGetUserData(token)
			.then(userData => {
				const sql = `
					UPDATE messages_new
					SET deleted = TRUE
					WHERE id = ANY($1)
					AND sent_to = $2;
				`
				return query(sql, [ids, userData.email])
					.then(() => 'Message(s) deleted.');
			})
	}

}
