const bcrypt = require("bcryptjs"),
	jwt = require("jsonwebtoken"),

	{ secret } = require("./secret.json"),

	{ query } = require("./db_service"),
	{ send } = require("./mail_service"),

	{ getProjectData } = require("./getProjectData"),

	{
		htmlTemplate,
		htmlTemplateNoClick
	} = require("./htmlTemplate");

const sign = (email, password) => {
	email = email.toLowerCase();
	return new Promise((resolve, reject) => {
		jwt.sign({ email, password }, secret, { expiresIn: '6h' }, (error, token) => {
			if (error) {
				reject(error);
			}
			else {
				resolve(token);
			}
		})
	})
}
const verify = token => {
	return new Promise((resolve, reject) => {
		jwt.verify(token, secret, (error, decoded) => {
			if (error) {
				reject(error);
			}
			else {
				resolve(decoded);
			}
		})
	})
}

const getRandomIndex = array => {
	return Math.round(Math.random() * (array.length - 1))
}
const passwordGen = () => {
	const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
		lowers = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
		uppers = lowers.map(l => l.toUpperCase()),
		specials = ['!', '@', '#', '$', '%', '&', '?'],

		randomSpecials = [
			specials[getRandomIndex(specials)],
			specials[getRandomIndex(specials)],
			specials[getRandomIndex(specials)]
		];

	return [
		...randomSpecials,

		numbers[getRandomIndex(numbers)],
		numbers[getRandomIndex(numbers)],
		numbers[getRandomIndex(numbers)],

		lowers[getRandomIndex(lowers)],
		uppers[getRandomIndex(uppers)],
		lowers[getRandomIndex(lowers)],
		uppers[getRandomIndex(uppers)],
		lowers[getRandomIndex(lowers)],

		numbers[getRandomIndex(numbers)],
		numbers[getRandomIndex(numbers)],
		numbers[getRandomIndex(numbers)],

		...randomSpecials.reverse()
	].join("");
}

const getUserGroups = (email, project) => {
	email = email.toLowerCase();
	const sql = `
		SELECT uig.group_name AS name,
			meta,
			gip.auth_level
		FROM users_in_groups AS uig
			INNER JOIN groups_in_projects AS gip
				ON uig.group_name = gip.group_name
			INNER JOIN groups
				ON groups.name = gip.group_name
		WHERE user_email = $1
		AND project_name = $2;
	`
	return query(sql, [email, project])
		// .then(rows => rows.map(row => row.name))
}
const getUserAuthLevel = (email, project) => {
	email = email.toLowerCase();
	const sql = `
		SELECT max(auth_level) AS auth_level
		FROM groups_in_projects AS gip
			INNER JOIN users_in_groups AS uig
			ON gip.group_name = uig.group_name
		WHERE user_email = $1
		AND project_name = $2;
	`
	return query(sql, [email, project])
		.then(rows => rows[0].auth_level || 0)
}
const getUser = (email, password, project, id) => {
	email = email.toLowerCase();
	return getUserGroups(email, project)
		.then(groups =>
			getUserAuthLevel(email, project)
				.then(authLevel =>
					sign(email, password)
						.then(token =>
							({ id, email, authLevel, token,
								groups: groups.map(g => g.name),
								meta: groups.map(g =>
									({ group: g.name, meta: g.meta, authLevel: g.auth_level })
								)
							})
						)
				)
		)
}

const hasProjectAccess = (email, project) => {
	email = email.toLowerCase();
	const sql = `
		SELECT DISTINCT project_name
		FROM users_in_groups AS uig INNER JOIN groups_in_projects AS gip ON uig.group_name = gip.group_name
		WHERE user_email = $1
	`
	return query(sql, [email])
		.then(rows => rows.reduce((a, c) => a || c.project_name === project, false))
}

const getUserData = email => {
	email = email.toLowerCase();
	const sql = `
		SELECT *
		FROM users
		WHERE email = $1;
	`
	return query(sql, [email])
		.then(rows => rows[0]);
}

const verifyAndGetUserData = token => {
	return new Promise((resolve, reject) => {
		verify(token)
			.then(decoded => {
				return getUserData(decoded.email)
					.then(userData => {
						if (userData && (decoded.password === userData.password)) {
							resolve(userData);
						}
						else {
							reject(new Error("Could not find user data."));
						}
					})
			})
			.catch(() => reject(new Error("Token could not be verified.")))
	})
}

const createNewUser = user_email =>	{
	user_email = user_email.toLowerCase();
	const sql = `
		SELECT count(1) AS count
		FROM public.users
		WHERE email = $1;
	`
	return query(sql, [user_email])
		.then(rows => +rows[0].count)
		.then(count => {
			if (count === 0) {
				const password = passwordGen(),
					passwordHash = bcrypt.hashSync(password),
					sql = `
						INSERT INTO users(email, password)
						VALUES ($1, $2)
						RETURNING *;
					`
				return query(sql, [user_email, passwordHash])
					.then(rows => rows.length ? ({ password, passwordHash, id: rows[0].id }) : ({}))
			}
			throw new Error("user email already exists.");
		})
}
const sendAcceptEmail = (user_email, password, passwordHash, project_name, HOST, URL) => {
	user_email = user_email.toLowerCase();
	return sign(user_email, passwordHash)
		.then(token => {
			return send(
				user_email,
				"Invite Accepted.",
				`Your request to project "${ project_name }" has been accepted. Your password is: ${ password }`,
				htmlTemplate(
					`Your request to project "${ project_name }" has been accepted.`,
					`<div>Your new password is:</div><div><h3>${ password }</h3></div><div>Visit ${ HOST } and login with your new password, or click the button below within 6 hours, to set a new password.</div>`,
					`${ HOST }${ URL }/${ token }`,
					"Click here to set a new password"
				)
			)
		})
}

module.exports = {

	sign,
	verify,
	getUser,
	getUserData,
	getUserAuthLevel,
	verifyAndGetUserData,
	getUserGroups,

	login: (email, password, project) => {
		email = email.toLowerCase();

		return new Promise((resolve, reject) => {
			getUserData(email)
				.then(userData => {
					if (userData && bcrypt.compareSync(password, userData.password)) {
						hasProjectAccess(email, project)
							.then(hasAccess => {
								if (hasAccess) {
									const sql = `
										INSERT INTO logins(user_email, project_name)
										VALUES ($1, $2);
									`
									return query(sql, [email, project])
										.then(() => resolve(getUser(email, userData.password, project, userData.id)));
								}
								else {
									reject(new Error(`You do not have access to project ${ project }.`));
								}
							})
					}
					else {
						reject(new Error("Incorrect email or password."));
					}
				})
		})
	},
	auth: (token, project) =>
		verifyAndGetUserData(token)
			.then(userData =>
				hasProjectAccess(userData.email, project)
					.then(hasAccess => {
						if (hasAccess) {
							return getUser(userData.email, userData.password, project, userData.id);
						}
						else {
							throw new Error(`You do not have access to project ${ project }.`);
						}
					})
			),

	signupRequest: (email, project_name) => {
		email = email.toLowerCase();

		const sql = `
			SELECT count(1) AS count
			FROM projects
			WHERE name = $1;
		`
		return query(sql, [project_name])
			.then(rows => +rows[0].count)
			.then(count => {
				if (count) {
					const sql = `
						SELECT count(1) AS count
						FROM users_in_groups AS uig
						INNER JOIN groups_in_projects AS gip
						ON uig.group_name = gip.group_name
						WHERE user_email = $1
						AND project_name = $2;
					`
					return query(sql, [email, project_name])
						.then(rows => +rows[0].count)
						.then(count => {
							if (count === 0) {
								const sql = `
									SELECT count(1) AS count
									FROM signup_requests
									WHERE user_email = $1
									AND project_name = $2
									AND state = 'pending';
								`
								return query(sql, [email, project_name])
									.then(rows => +rows[0].count)
									.then(count => {
										if (count === 0) {
											const sql = `
												INSERT INTO signup_requests(user_email, project_name)
												VALUES ($1, $2);
											`
											return query(sql, [email, project_name])
												.then(() => send(email,
																			"Invite Request.",
																			`Your request to project ${ project_name } has been received and is pending.`,
																			htmlTemplateNoClick(
																				'Thank you.',
																				`Your request to project ${ project_name } has been received and is pending.`
																			)
																		)
												);
										}
										else {
											throw new Error(`You already have a pending request for this project.`)
										}
									})
							}
							else {
								throw new Error(`You already have access to this project.`);
							}
						})
				}
				else {
					throw new Error(`Project ${ project_name } does not exist.`)
				}
			})
	},

	addToGroup: (user_email, project_name, group_name, projectData) => {
		user_email = user_email.toLowerCase();
		const {
			HOST,
			URL
		} = getProjectData(project_name, projectData);
console.log("<auth.utils.addToGroup>", project_name, projectData, HOST, URL)

		const sql = `
			SELECT count(1) AS count
			FROM groups_in_projects
			WHERE group_name = $1
			AND group_name NOT IN (
				SELECT group_name
				FROM groups_in_projects
				WHERE auth_level > 1
			)
		`
		return query(sql, [group_name])
			.then(row => +row[0].count)
			.then(count => {
				if (count === 1) {
					const  sql = `
						SELECT count(1) AS count
						FROM users_in_groups AS uig
						INNER JOIN groups_in_projects AS gip
						ON uig.group_name = gip.group_name
						WHERE user_email = $1
						AND project_name = $2;
					`;
					return query(sql, [user_email, project_name])
						.then(rows => +rows[0].count)
						.then(count => {
							if (count === 0) {
								const sql = `
									INSERT INTO users_in_groups(user_email, group_name, created_by)
									VALUES ($1, $2, $3);
								`;
								return query(sql, [user_email, group_name, 'auto-accept'])
									.then(() => {
										return createNewUser(user_email)
											.then(({ password, passwordHash, id }) => {
												if (password && passwordHash) {
													return sendAcceptEmail(user_email, password, passwordHash, project_name, HOST, URL)
														.then(() => getUser(user_email, passwordHash, project_name, id));
												}
											})
									})
							}
							else {
								throw new Error("You already have access to this project.")
							}
					})
				}
				else {
					throw new Error("Count not add you to group.")
				}
			})
	},

	signupAccept: (token, group_name, user_email, project_name, projectData = {}) => {
		user_email = user_email.toLowerCase();

		const {
			HOST,
			URL
		} = getProjectData(project_name, projectData);
console.log("<auth.utils.signupAccept>", project_name, projectData, HOST, URL)

		return verifyAndGetUserData(token)
				.then(userData => {
					return getUserAuthLevel(userData.email, project_name)
						.then(authLevel => {
							const sql = `
								SELECT auth_level
								FROM groups_in_projects
								WHERE group_name = $1
								AND project_name = $2;
							`
							return query(sql, [group_name, project_name])
								.then(rows => rows.length ? rows[0].auth_level : 0)
								.then(groupAuthLevel => {
									if (authLevel >= groupAuthLevel) {
										let sql = `
												INSERT INTO users_in_groups(user_email, group_name, created_by)
												VALUES ($1, $2, $3);
											`,
											args = [user_email, group_name, userData.email];

										return query(sql, args)
											.then(() => {
												return createNewUser(user_email)
													.then(({ password, passwordHash, id }) => {

														let promise = null;
														if (password && passwordHash) {
															promise = sendAcceptEmail(user_email, password, passwordHash, project_name, HOST, URL);
														}
														return Promise.resolve(promise)
															.then(() => {
																const sql = `
																	UPDATE signup_requests
																	SET state = 'accepted',
																		resolved_at = now(),
																		resolved_by = $1
																	WHERE user_email = $2
																	AND project_name = $3;
																`;
																return query(sql, [userData.email, user_email, project_name])
															})
													})
												})
									}
									else {
										throw new Error(`You do not have authority to assign users to group ${ group_name }.`)
									}
								})
						})
				})

	},
	signupReject: (token, user_email, project_name) => {
		user_email = user_email.toLowerCase();

		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					return getUserAuthLevel(userData.email, project_name)
						.then(authLevel => {
							if (authLevel > 0) {
								const sql = `
										UPDATE signup_requests
										SET state = 'rejected',
											resolved_at = now(),
											resolved_by = $1
										WHERE user_email = $2
										AND project_name = $3;
									`,
									args = [userData.email, user_email, project_name];
								resolve(
									query(sql, args)
										.then(() => send(
											user_email,
											"Invite Request.",
											`Your request to project "${ project_name }" has been rejected.`,
											htmlTemplateNoClick(
												'Sorry.',
												`Your request to project "${ project_name }" has been rejected.`
											)
										))
								)
							}
							else { // authLevel <= 0
								throw new Error(`You do not have the required authority to reject invites to ${ project_name }.`)
							}
						})
				})
				.catch(reject)
		})
	},

	deleteSignup: (token, user_email, project_name) => {
		user_email = user_email.toLowerCase();

		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					return getUserAuthLevel(userData.email, project_name)
						.then(authLevel => {
							if (authLevel > 0) {
								const sql = `
									DELETE FROM signup_requests
									WHERE user_email = $1
									AND project_name = $2;
								`
								return query(sql, [user_email, project_name])
									.then(() => resolve(`Request deleted.`))
							}
							else {
								throw new Error(`You do not have the authority to delete requests for project ${ project_name }.`)
							}
						})
				})
				.catch(reject)
		})
	},

	getRequests: token => {
		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					const sql = `
						SELECT *
						FROM signup_requests
						WHERE project_name IN (
							SELECT project_name
							FROM users_in_groups AS uig INNER JOIN groups_in_projects AS gip ON uig.group_name = gip.group_name
							WHERE user_email = $1
						)
					`
					query(sql, [userData.email])
						.then(resolve)
						.catch(reject);
				})
				.catch(reject)
		})
	},

	passwordSet: (token, password) => {
		return verifyAndGetUserData(token)
			.then(userData => {
				const passwordHash = bcrypt.hashSync(password),
					sql = `
						UPDATE users
						SET password = $1
						WHERE email = $2;
					`
				return query(sql, [passwordHash, userData.email])
					.then(() => sign(userData.email, passwordHash))
			})
	},

	passwordUpdate: (token, current, password) => {
		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					if (bcrypt.compareSync(current, userData.password)) {
						const passwordHash = bcrypt.hashSync(password),
							sql = `
								UPDATE users
								SET password = $1
								WHERE email = $2;
							`
						return query(sql, [passwordHash, userData.email])
							.then(() => sign(userData.email, passwordHash))
					}
					else {
						throw new Error("Incorrect password.")
					}
				})
				.then(resolve)
				.catch(reject)
		})
	},
	passwordReset: (email, project_name = "avail_auth") => {
		email = email.toLowerCase();
		const {
			HOST
		} = getProjectData(project_name);

		return getUserData(email)
			.then(userData => {
				if (userData) {
					const password = passwordGen(),
						passwordHash = bcrypt.hashSync(password),
						sql = `
							UPDATE users
							SET password = $1
							WHERE email = $2;
						`
					return query(sql, [passwordHash, email])
						.then(() => sign(email, passwordHash))
						.then(token =>
							send(email,
								"Password Reset.",
								`Your password has been reset. Your new password is: ${ password }`,
								htmlTemplate(
									`Your password has been reset.`,
									`<div>Your new password is:</div><div><h3>${ password }</h3></div><div>Visit ${ HOST } and login with your new password, or click the button below within 6 hours, to set a new password.</div>`,
									`${ HOST }/password/set/${ token }`,
									"Click here to set a new password"
								)
							)
						)
				}
				else {
					throw new Error("Unknown email.");
				}
			})
	}
}
