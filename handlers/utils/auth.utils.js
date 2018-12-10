const bcrypt = require("bcryptjs"),
	jwt = require("jsonwebtoken"),

	{ secret } = require("./secret.json"),

	{ query } = require("./db_service"),
	{ send } = require("./mail_service"),

	{ host } = require("./host.json"),

	{
		htmlTemplate,
		htmlTemplateNoClick
	} = require("./htmlTemplate");

const sign = (email, password) => {
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
	const sql = `
		SELECT uip.group_name AS name
		FROM users_in_groups AS uip
			INNER JOIN groups_in_projects AS gip
			ON uip.group_name = gip.group_name
		WHERE user_email = $1
		AND project_name = $2;
	`
	return query(sql, [email, project])
		.then(rows => rows.map(row => row.name))
}
const getUserAuthLevel = (email, project) => {
	const sql = `
		SELECT max(auth_level) AS auth_level
		FROM groups_in_projects AS gip
			INNER JOIN users_in_groups AS uip
			ON gip.group_name = uip.group_name
		WHERE user_email = $1
		AND project_name = $2;
	`
	return query(sql, [email, project])
		.then(rows => rows[0].auth_level || 0)
}
const getUser = (email, password, project) => {
	return getUserGroups(email, project)
		.then(groups => {
			return getUserAuthLevel(email, project)
				.then(authLevel => {
					return sign(email, password)
						.then(token => ({ groups, authLevel, token }))
				})
		})
}

const hasProjectAccess = (email, project) => {
	const sql = `
		SELECT DISTINCT project_name
		FROM users_in_groups AS uig INNER JOIN groups_in_projects AS gip ON uig.group_name = gip.group_name
		WHERE user_email = $1
	`
	return query(sql, [email])
		.then(rows => rows.reduce((a, c) => a || c.project_name === project, false))
}

const getUserData = email => {
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
					.catch(reject)
			})
			.catch(() => reject(new Error("Token could not be verified.")))
	})
}

module.exports = {

	sign,
	verify,
	getUser,
	getUserData,
	getUserAuthLevel,
	verifyAndGetUserData,

	login: (email, password, project) => {
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
									query(sql, [email, project])
										.then(() => resolve(getUser(email, userData.password, project)))
										.catch(reject);
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

	auth: (token, project) => {
		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					hasProjectAccess(userData.email, project)
						.then(hasAccess => {
							if (hasAccess) {
								resolve(getUser(userData.email, userData.password, project));
							}
							else {
								reject(new Error(`You do not have access to project ${ project }.`));
							}
						})
				})
				.catch(reject)
		})
	},

	signupRequest: (email, project_name) => {
		const sql = `
			SELECT count(1) AS count
			FROM users_in_groups AS uig
			INNER JOIN groups_in_projects AS gip
			ON uig.group_name = gip.group_name
			WHERE user_email = $1;
		`
		return query(sql, [email])
			.then(rows => +rows[0].count)
			.then(count => {
				if (count === 0) {
					const sql = `
						SELECT count(1) AS count
						FROM signup_requests
						WHERE user_email = $1
						AND project_name = $2;
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
	},
	signupAccept: (token, group_name, user_email, project_name) => {
		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					getUserAuthLevel(userData.email, project_name)
						.then(authLevel => {
							const sql = `
								SELECT auth_level
								FROM groups_in_projects
								WHERE group_name = $1
								AND project_name = $2;
							`
							query(sql, [group_name, project_name])
								.then(rows => rows.length ? rows[0].auth_level : 0)
								.then(groupAuthLevel => {
									if (authLevel >= groupAuthLevel) {
										let sql = `
												INSERT INTO users_in_groups(user_email, group_name, created_by)
												VALUES ($1, $2, $3);
											`,
											args = [user_email, group_name, userData.email];
										resolve(
											query(sql, args)
												.then(() => {
													const password = passwordGen(),
														passwordHash = bcrypt.hashSync(password);
													sql = `
														INSERT INTO users(email, password)
														VALUES ($1, $2);
													`
													args = [user_email, passwordHash];
													return query(sql, args)
														.then(() => {
															sql = `
																UPDATE signup_requests
																SET state = 'accepted',
																	resolved_at = now(),
																	resolved_by = $1
																WHERE user_email = $2
																AND project_name = $3;
															`;
															args = [userData.email, user_email, project_name];
															return query(sql, args)
														})
														.then(() =>
															sign(user_email, passwordHash)
																.then(token =>
																	send(
																		user_email,
																		"Invite Request.",
																		`Your request to project "${ project_name }" has been accepted. Your temporary password is: ${ password }`,
																		htmlTemplate(
																			`Your request to project "${ project_name }" has been accepted.`,
																			`<div>Your temporary password is:</div><div><b>${ password }</b></div>`,
																			`${ host }/password/set/${ token }`,
																			"Click here to set a new password"
																		)
																	)
																)
														);
												})
												.catch(error => { throw error; })
										)
									}
									else {
										reject(new Error(`You do not have authority to assign users to group ${ group_name }.`))
									}
								})
						})
				})
		})
	},
	signupReject: (token, user_email, project_name) => {
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

	passwordSetView: token => verifyAndGetUserData(token),
	passwordSet: (token, password) => {
		return verifyAndGetUserData(token)
			.then(userData => {
				const passwordHash = bcrypt.hashSync(password)
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
						const passwordHash = bcrypt.hashSync(password)
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
	passwordReset: email => {
		return new Promise((resolve, reject) => {
			getUserData(email)
				.then(userData => {
					if (userData) {
						const password = passwordGen(),
							passwordHash = bcrypt.hashSync(password),
							sql = `
								UPDATE users
								SET password = $1
								WHERE email = $2;
							`
						query(sql, [passwordHash, email])
							.then(() => sign(email, passwordHash))
							.then(token =>
								resolve(send(email,
									"Password Reset.",
									`Your password has been reset. Your temporary password is: ${ password }`,
									htmlTemplate(
										`Your password has been reset.`,
										`<div>Your temporary password is:</div><div><b>${ password }</b></div>`,
										`${ host }/password/set/${ token }`,
										"Click here to set a new password"
									)
								))
							)
					}
					else {
						reject(new Error("Unknown email."))
					}
				})
		})
	}
}