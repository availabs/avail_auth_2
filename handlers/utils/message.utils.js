const { query, queryAll } = require("./db_service"),
	{
		verifyAndGetUserData,
		getUserAuthLevel
	} = require("./auth.utils");

const sendMessageToUser = (userData, heading, message, target) => {
	const sql = `
		SELECT count(1) AS count
		FROM users
		WHERE email = $1
		AND email != $2;
	`
	return query(sql, [target, userData.email])
		.then(rows => rows[0].count)
		.then(count => {
			if (count === 0) {
				throw new Error(`User ${ target } was not found.`);
			}
			else {
				const sql = `
					INSERT INTO messages(heading, message, user_email, created_by)
					VALUES ($1, $2, $3, $4);
				`
				return query(sql, [heading, message, target, userData.email])
					.then(() => `Sent message to user ${ target }.`)
			}
		})
}

const sendMessageToGroup = (userData, heading, message, target) => {
	const sql = `
		SELECT count(1) AS count
		FROM groups
		WHERE name = $1;
	`
	return query(sql, [target])
		.then(rows => rows[0].count)
		.then(count => {
			if (count === 0) {
				throw new Error(`Group ${ target } was not found.`);
			}
			else {
				const sql = `
					SELECT project_name, auth_level
					FROM groups_in_projects
					WHERE group_name = $1;
				`
				return query(sql, [target])
					.then(rows => {
						const map = {};
						rows.forEach(({ project_name, auth_level }) => {
							map[project_name] = auth_level;
						})
						const sql = `
							SELECT project_name, auth_level
							FROM users_in_groups AS uig
							INNER JOIN groups_in_projects AS gip
							ON uig.group_name = gip.group_name
							WHERE user_email = $1;
						`
						return query(sql, [userData.email])
							.then(rows => {
								let canSend = false;
								rows.forEach(({ project_name, auth_level }) => {
									canSend = canSend || (auth_level >= map[project_name]);
								})
								if (!canSend) {
									throw new Error(`You do not have the authority to send a message to group ${ target }.`)
								}
								else {
									const sql = `
										SELECT user_email
										FROM users_in_groups
										WHERE group_name = $1
										AND user_email != $2;
									`
									return query(sql, [target, userData.email])
										.then(rows => {
											const queries = rows.map(({ user_email }) => {
												const sql = `
													INSERT INTO messages(heading, message, user_email, created_by)
													VALUES ($1, $2, $3, $4);
												`
												return query(sql, [heading, message, user_email, userData.email])
											})
											return Promise.all(queries)
												.then(() => `Sent message to group ${ target }.`)
										})
								}
							})
					})
			}
		})
}

const sendMessageToProject = (userData, heading, message, target) => {
	const sql = `
		SELECT count(1) AS count
		FROM projects
		WHERE name = $1;
	`
	return query(sql, [target])
		.then(rows => rows[0].count)
		.then(count => {
			if (count === 0) {
				throw new Error(`Project ${ target } was not found.`);
			}
			else {
				return getUserAuthLevel(userData.email, target)
					.then(userAuthLevel => {
						if (userAuthLevel === 0) {
							throw new Error(`You do not have the authority to send messages to project ${ target }.`)
						}
						else {
							const sql = `
								SELECT user_email
								FROM users_in_groups AS uig
								INNER JOIN groups_in_projects AS gip
								ON uig.group_name = gip.group_name
								WHERE project_name = $1
								AND user_email != $2;
							`
							return query(sql, [target, userData.email])
								.then(rows => {
									const queries = rows.map(({ user_email }) => {
										const sql = `
											INSERT INTO messages(heading, message, user_email, created_by)
											VALUES ($1, $2, $3, $4);
										`
										return query(sql, [heading, message, user_email, userData.email])
									})
									return Promise.all(queries)
										.then(() => `Sent message to project ${ target }.`)
								})
						}
					})
			}
		})
}

const sendMessageToAll = (userData, heading, message) => {
	const sql = `
		SELECT count(1) AS count
		FROM users_in_groups
		WHERE group_name = 'AVAIL'
		AND user_email = $1;
	`
	return query(sql, [userData.email])
		.then(rows => rows[0].count)
		.then(count => {
			if (count === 0) {
				throw new Error(`You do not have the authority to send messages to all users.`)
			}
			else {
				const sql = `
				 SELECT email
				 FROM users
				 WHERE email != $1;
				`
				return query(sql, [userData.email])
					.then(rows => {
						const queries = rows.map(({ email }) => {
							const sql = `
								INSERT INTO messages(heading, message, user_email, created_by)
								VALUES ($1, $2, $3, $4);
							`
							return query(sql, [heading, message, email, userData.email])
						})
						return Promise.all(queries)
							.then(() => `Sent message to all users.`)
					})
			}
		})
}

module.exports = {

	getMessages: token => {
		return verifyAndGetUserData(token)
			.then(userData => {
				const sql = `
					SELECT *
					FROM messages
					WHERE user_email = $1;
				`
				return query(sql, [userData.email]);
			})
	},

	postMessage: (token, heading, message, type, target) => {
		return verifyAndGetUserData(token)
			.then(userData => {
				switch (type) {
					case "user":
						return sendMessageToUser(userData, heading, message, target);
					case "group":
						return sendMessageToGroup(userData, heading, message, target);
					case "project":
						return sendMessageToProject(userData, heading, message, target);
					case "all":
						return sendMessageToAll(userData, heading, message);
					default:
						throw new Error(`Unknow message type ${ type }.`)
				}
			})
	},

	viewMessages: (token, ids) => {
		return verifyAndGetUserData(token)
			.then(userData => {
				const sql = `
					UPDATE messages
					SET viewed = TRUE
					WHERE id IN (${ ids })
					AND user_email = $1;
				`
				return query(sql, [userData.email])
					.then(() => ids.length === 1 ? 'Message was set as viewed.' : 'Messages were set as viewed.');
			})
	},

	deleteMessages: (token, ids) => {
		return verifyAndGetUserData(token)
			.then(userData => {
				const sql = `
					DELETE FROM messages
					WHERE id IN (${ ids })
					AND user_email = $1
				`
				return query(sql, [userData.email])
					.then(() => ids.length === 1 ? 'Message was deleted.' : 'Messages were deleted.');
			})
	}

}