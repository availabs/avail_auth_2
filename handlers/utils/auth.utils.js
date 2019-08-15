const bcrypt = require("bcryptjs"),
	jwt = require("jsonwebtoken"),

	{ secret } = require("./secret.json"),

	{ query } = require("./db_service"),
	{ send } = require("./mail_service"),

	{ host } = require("./host.json"),
	{ getProjectData } = require("./getProjectData"),

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
const getUser = (email, password, project, id) =>
	getUserGroups(email, project)
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
			})
			.catch(() => reject(new Error("Token could not be verified.")))
	})
}

const createNewUser = user_email =>	{
	const sql = `
		SELECT count(1) AS count
		FROM user
		WHERE email = $1;
	`
	return query(sql, [user_email])
		.then(rows => rows[0].count)
		.then(count => {
			if (count === 0) {
				const password = passwordGen(),
					passwordHash = bcrypt.hashSync(password),
					sql = `
						INSERT INTO users(email, password)
						VALUES ($1, $2);
					`
				return query(sql, [user_email, passwordHash])
					.then(() => ({ password, passwordHash }))
			}
			return null;
		})
}
const sendAcceptEmail = (user_email, password, passwordHash, projectName, HOST, URL) => {
	return sign(user_email, passwordHash)
		.then(token => {
			send(
				user_email,
				"Invite Request.",
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

	addToGroup: (email, project, group_name, projectData) => {
		const {
			HOST,
			URL
		} = getProjectData(projectData);

		return new Promise( (resolve, reject) => {
			// find group to add
			// add user to that group
			// add user to users
			// send user an email with password

			const sql = `
								SELECT group_name
								FROM groups_in_projects
								WHERE project_name = $1
								AND  auth_level = 0;
							`
			query(sql, [project])
				.then(group_name => {
					if (group_name.length > 0 && group_name[0].group_name){
						group_name = group_name[0].group_name;

						let sql = `
							SELECT max(auth_level)
							FROM groups_in_projects
							WHERE group_name = $1
							`
						return query(sql, [group_name])
							.then(auth_level => {
								if (auth_level.length > 0 && auth_level[0].max === 0){
									let  sql = `
											SELECT count(1) AS count
											FROM users_in_groups AS uig
											INNER JOIN groups_in_projects AS gip
											ON uig.group_name = gip.group_name
											WHERE user_email = $1
											AND project_name = $2;
										`,
										args = [email, project];

									return query(sql, args)
										.then(rows => +rows[0].count)
										.then(count => {
											if (count === 0) {
												let sql = `
													INSERT INTO users_in_groups(user_email, group_name, created_by)
													VALUES ($1, $2, $3);
												`,
													args = [email, group_name, 'auto-accept'];
												return query(sql, args)
													.then( () => {
														const password = passwordGen(),
															passwordHash = bcrypt.hashSync(password),
															sql = `
																	INSERT INTO users(email, password)
																	VALUES ($1, $2);
																`,
															args = [email, passwordHash];
														return query(sql, args)
															.then(() =>
																sign(email, passwordHash)
																	.then(token =>
																		send(
																			email,
																			"Invite Request.",
																			`Your request to project "${ project }" has been accepted. Your password is: ${ password }`,
																			htmlTemplate(
																				`Your request to project "${ project }" has been accepted.`,
																				`<div>Your new password is:</div><div><h3>${ password }</h3></div><div>Visit ${ HOST } and login with your new password, or click the button below within 6 hours, to set a new password.</div>`,
																				`${ HOST }${ URL }/${ token }`,
																				"Click here to set a new password"
																			)
																		)
																	)
															)
													})
											}else {
												throw new Error(`You already have access to this project.`);
											}
										})

								}else{
									throw new Error('Group not found.');
								}

							})
					}else{
						throw new Error('Group not found.')
					}

				})
				.catch(error => { throw error; })
		})

	},
	signupAccept: (token, group_name, user_email, project_name, projectData = {}) => {
		user_email = user_email.toLowerCase();

		const {
			HOST,
			URL
		} = getProjectData(projectData);

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
																		`Your request to project "${ project_name }" has been accepted. Your password is: ${ password }`,
																		htmlTemplate(
																			`Your request to project "${ project_name }" has been accepted.`,
																			`<div>Your new password is:</div><div><h3>${ password }</h3></div><div>Visit ${ HOST } and login with your new password, or click the button below within 6 hours, to set a new password.</div>`,
																			`${ HOST }${ URL }/${ token }`,
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
	passwordReset: email => {
		email = email.toLowerCase();

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
									`Your password has been reset. Your new password is: ${ password }`,
									htmlTemplate(
										`Your password has been reset.`,
										`<div>Your new password is:</div><div><h3>${ password }</h3></div><div>Visit ${ host } and login with your new password, or click the button below within 6 hours, to set a new password.</div>`,
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
