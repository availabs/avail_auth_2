const bcrypt = require("bcryptjs"),
	jwt = require("jsonwebtoken"),

	{ secret } = require("./secret.json"),

	db_service = require("./db_service"),
	{ query, begin } = db_service,

	{ send } = require("./mail_service"),

	{ getProjectData } = require("./getProjectData"),

	{
		htmlTemplate,
		htmlTemplateNoClick
	} = require("./htmlTemplate");

const hashSync = password => bcrypt.hashSync(password, 10)

const tokenize = (object, expiresIn = '6h') =>
	new Promise((resolve, reject) => {
		jwt.sign(object, secret, { expiresIn }, (error, token) => {
			if (error) {
				reject(error);
			}
			else {
				resolve(token);
			}
		})
	})
const sign = (email, password) =>
	tokenize({ email: email.toLowerCase(), password });

const verify = token => {
	return new Promise((resolve, reject) => {
		jwt.verify(token, secret, (error, decoded) => {
			if (error) {
				reject(new Error("Token could not be verified."));
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
		specials = ['!', '@', '#', '%', '&', '?'],

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

const verifyAndGetUserData = token =>
	verify(token)
		.then(decoded => {
			return getUserData(decoded.email)
				.then(userData => {
					if (userData && (decoded.password === userData.password)) {
						return userData;
					}
					else {
						throw new Error("Could not find user data.");
					}
				})
		})
		.catch(() => { throw new Error("Token could not be verified."); })

const createNewUser = (user_email, service = db_service) =>	{
	user_email = user_email.toLowerCase();
	const password = passwordGen(),
		passwordHash = hashSync(password),
		sql = `
			INSERT INTO users(email, password)
			VALUES ($1, $2)
			RETURNING *;
		`
	return service.query(sql, [user_email, passwordHash])
		.then(rows => rows.length ? ({ password, passwordHash, id: rows[0].id }) : ({}))
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
					`<div>Your new password is:</div>` +
						`<div><h3>${ password }</h3></div>` +
						`<div>Visit <a href="${ HOST }">${ project_name }</a> and login with your new password, or click the button below, within 6 hours, to set a new password.</div>`,
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

	signupRequest: (email, project_name, group_name = null, projectData = {}) => {
		email = email.toLowerCase();
		const {
			HOST,
			URL
		} = getProjectData(project_name, projectData);

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

											if (group_name) { // START ADD TO GROUP
												const sql = `
													SELECT count(1) AS count
													FROM groups_in_projects
													WHERE group_name = $1
													AND project_name = $2
													AND group_name NOT IN (
														SELECT DISTINCT group_name
														FROM groups_in_projects
														WHERE auth_level > 0
													)
												`
												return query(sql, [group_name, project_name])
													.then(rows => +rows[0].count)
													.then(count => {
														if (count === 1) {

															const sql = `
																SELECT *
																FROM users
																WHERE email = $1
															`
															return query(sql, [email])
																.then(rows => rows.pop())
																.then(user => {
																	if (user) {
																		const sql = `
																			INSERT INTO users_in_groups(user_email, group_name, created_by)
																			VALUES($1, $2, 'signup-verified')
																		`
																		return query(sql, [email, group_name])
																			.then(() =>
																				getUser(email, user.password, project_name, user.id)
																					.then(user => ({ user }))
																			)
																	}
																	else {
																		const sql = `
																			DELETE FROM signup_requests
																			WHERE user_email = $1
																			AND project_name = $2
																			AND state = 'awaiting';
																		`
																		return query(sql, [email, project_name])
																			.then(() => {
																				const sql = `
																					INSERT INTO signup_requests(user_email, project_name, state)
																					VALUES ($1, $2, 'awaiting');
																				`
																				return query(sql, [email, project_name])
																					.then(() =>
																						tokenize({ group: group_name, project: project_name, email, from: "signup-request-addToGroup" }, '24h')
																							.then(token => {
																								const url = `${ HOST }${ URL }/${ token }`
																								console.log('------------------------')
																								console.log('request', email, token )
																								console.log('request', url )
																								console.log('------------------------')
																								return send(
																									email,
																									"Signup Request Received.",
																									`Your request to project ${ project_name } has been received. Visit ${ url } to create a password and complete your request.`,
																									htmlTemplate(
																										`Your request to project ${ project_name } has been received.`,
																										`<div>Visit <a href="${ url }">this link</a>, within 24 hours, to create a password and complete your request.</div>`,
																										url,
																										"Click here to complete request"
																									)
																								)
																							})
																					);
																			})
																	}
																})
														}
														else {
															throw new Error(`The requested group does not have auth level 0 across all projects.`);
														}
													})
											} // END ADD TO GROUP
											else {
												const sql = `
													INSERT INTO signup_requests(user_email, project_name, state)
													VALUES ($1, $2, 'awaiting');
												`
												return query(sql, [email, project_name])
													.then(() =>
														tokenize({ project: project_name, email, from: "signup-request" }, '24h')
															.then(token => {
																const url = `${ HOST }${ URL }/${ token }`;
																return send(email,
																	"Invite Request.",
																	`Your request to project ${ project_name } has been received and is pending. Visit ${ url } to verify email.`,
																	htmlTemplate(
																		`Your request to project ${ project_name } has been received and is awaiting email verification.`,
																		`<div>Visit <a href="${ url }">this link</a>, within 24 hours, to verify your email.</div>`,
																		url,
																		"Click here to verify email"
																	)
																)
															})
													);
											}
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

	verifyEmail: token =>
		verify(token)
			.then(({ project, from, email }) => {
				if (next !== "signup-request") {
					throw new Error("Invalid request.");
				}
				else {
					const sql = `
						SELECT COUNT(1) AS COUNT
						FROM signup_requests
						WHERE user_email = $1
						AND project_name = $2
						AND state = 'awaiting'
					`
					return query(sql, [email, project])
						.then(rows => +rows[0].count)
						.then(count => {
							if (count === 1) {
								const sql = `
									UPDATE signup_requests
									SET state = 'pending'
									WHERE user_email = $1
									AND project_name = $2
									AND state = 'awaiting'
								`
								return query(sql, [email, project])
									.then(() => "Your email has been verified and your request is pending.");
							}
							else {
								const sql = `
									SELECT COUNT(1) AS COUNT
									FROM signup_requests
									WHERE user_email = $1
									AND project_name = $2
									AND state = 'pending'
								`
								return query(sql, [email, project])
									.then(rows => +rows[0].count)
									.then(count => {
										if (count === 1) {
											return "Your email has already been verified and your request is pending.";
										}
										else {
											throw new Error("Could not find request.");
										}
									})
							}
						})
				}
			}),

	signupAccept: (token, group_name, user_email, project_name, projectData = {}) => {
		user_email = user_email.toLowerCase();

		const {
			HOST,
			URL
		} = getProjectData(project_name, projectData);
// console.log("<auth.utils.signupAccept>", project_name, projectData, HOST, URL)

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
								if ((authLevel >= 5) && (authLevel >= groupAuthLevel)) {
									const sql = `
										SELECT COUNT(1) AS count
										FROM signup_requests
										WHERE (state = 'pending' OR state = 'rejected')
										AND user_email = $1
										AND project_name = $2;
									`
									return query(sql, [user_email, project_name])
										.then(rows => +rows[0].count)
										.then(count => {
											if (count === 1) {
												return begin(client => {
													const sql = `
														UPDATE signup_requests
														SET state = 'accepted',
															resolved_at = now(),
															resolved_by = $1
														WHERE user_email = $2
														AND project_name = $3;
													`;
													return client.query(sql, [userData.email, user_email, project_name])
														.then(() => {
															const sql = `
																SELECT COUNT(1) AS count
																FROM users
																WHERE email = $1
															`
															return query(sql, [user_email])
																.then(rows => +rows[0].count)
																.then(count => {
																	if (count) {
																		const sql = `
																			INSERT INTO users_in_groups(user_email, group_name, created_by)
																			VALUES ($1, $2, $3);
																		`;
																		return query(sql, [user_email, group_name, userData.email])
																			.then(() => send(
																				user_email,
																				"Invite Request.",
																				`Your request to project ${ project_name } has been accepted.`,
																				htmlTemplateNoClick(
																					'Invite Request.',
																					`Your request to project ${ project_name } has been accepted.`
																				)
																			))
																	}
																	else {
																		return createNewUser(user_email, client)
																			.then(({ password, passwordHash }) => {

																				const sql = `
																					INSERT INTO users_in_groups(user_email, group_name, created_by)
																					VALUES ($1, $2, $3);
																				`;
																				return client.query(sql, [user_email, group_name, userData.email])
																					.then(() =>
																						sendAcceptEmail(user_email, password, passwordHash, project_name, HOST, URL)
																					)
																			})
																	}
																})
														})
												}) // END begin

											}
											else {
												throw new Error(`Could not find request.`);
											}
										})
								}
								else {
									throw new Error(`You do not have authority to assign users to group ${ group_name }.`);
								}
							})
					})
			})

	},
	signupRequestVerified: (token, password) =>
		verify(token)
			.then(({ project, group, email, from }) => {
				if (from !== "signup-request-addToGroup") {
					throw new Error("Invalid request.");
				}
				email = email.toLowerCase();
				const sql = `
					SELECT count(1) AS count
					FROM groups_in_projects
					WHERE group_name = $1
					AND project_name = $2
					AND group_name NOT IN (
						SELECT DISTINCT group_name
						FROM groups_in_projects
						WHERE auth_level > 0
					)
				`
				return query(sql, [group, project])
					.then(rows => +rows[0].count)
					.then(count => {
						if (count === 1) {
							const sql = `
								SELECT COUNT(1) AS count
								FROM signup_requests
								WHERE state = 'awaiting'
								AND user_email = $1
								AND project_name = $2;
							`
							return query(sql, [email, project])
								.then(rows => +rows[0].count)
								.then(count => {
									if (count === 1) {
										return begin(client => {
											const sql = `
												UPDATE signup_requests
												SET state = 'accepted',
													resolved_at = now(),
													resolved_by = 'signup-verified'
												WHERE user_email = $1
												AND project_name = $2;
											`;
											return client.query(sql, [email, project])
												.then(() => {
													const passwordHash = hashSync(password),
														sql = `
															INSERT INTO users(email, password)
															VALUES ($1, $2)
															RETURNING *;
														`
													return client.query(sql, [email, passwordHash])
														.then(user => {
															const sql = `
																INSERT INTO users_in_groups(user_email, group_name, created_by)
																VALUES ($1, $2, 'signup-verified');
															`;
															return client.query(sql, [email, group])
																.then(() => getUser(email, passwordHash, project, user.id))
														})
												})
										})
									}
									throw new Error("Could not find request");
								})
						}
						throw new Error(`You cannot be added to group ${ group }.`);
					})
			}),

	signupReject: (token, user_email, project_name) => {
		user_email = user_email.toLowerCase();

		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					return getUserAuthLevel(userData.email, project_name)
						.then(authLevel => {
							if (authLevel >= 5) {
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
							if (authLevel >= 5) {
								const sql = `
									SELECT COUNT(1) AS count
									FROM signup_requests
									WHERE user_email = $1
									AND project_name = $2
									AND state = 'rejected';
								`
								return query(sql, [user_email, project_name])
									.then(rows => +rows[0].count)
									.then(count => {
										if (count) {
											const sql = `
												DELETE FROM signup_requests
												WHERE user_email = $1
												AND project_name = $2
												AND state = 'rejected';
											`
											return query(sql, [user_email, project_name])
												.then(() => resolve(`Request deleted.`));
										}
										else {
											throw new Error("You may only delete rejected requests.")
										}
									})
							}
							else {
								throw new Error(`You do not have the authority to delete requests for project ${ project_name }.`)
							}
						})
				})
				.catch(reject)
		})
	},

	sendInvite: (token, group_name, user_email, project_name, projectData) =>
		verifyAndGetUserData(token)
			.then(userData =>
				getUserAuthLevel(userData.email, project_name)
					.then(authLevel => {
						if (authLevel < 5) {
							throw new Error(`You do not have the authority to invite user to project ${ project_name }.`);
						}
						user_email = user_email.toLowerCase();

						const sql = `
							SELECT COUNT(1) AS count
							FROM users
							WHERE email = $1
						`
						return query(sql, [user_email])
							.then(rows => +rows[0].count)
							.then(count => {
								if (count) {
									throw new Error(`User ${ user_email } already exists.`);
								}

								const sql = `
									SELECT count(1) AS count
									FROM signup_requests
									WHERE user_email = $1
									AND project_name = $2;
								`
								return query(sql, [user_email, project_name])
									.then(rows => +rows[0].count)
									.then(count => {
										if (count) {
											throw new Error(`User ${ user_email } has already been invited to project ${ project_name }.`);
										}
										const sql = `
											INSERT INTO signup_requests(user_email, project_name, state)
											VALUES ($1, $2, 'awaiting');
										`
										return query(sql, [user_email, project_name])
											.then(() =>
												tokenize({ group: group_name, project: project_name, email: user_email, invited_by: userData.email, from: "invite-request" }, '24h')
													.then(token => {
														const {
															HOST,
															URL
														} = getProjectData(project_name, projectData);

														const url = `${ HOST }${ URL }/${ token }`
														return send(
															user_email,
															`Invite to project ${ project_name }.`,
															`You've been invited to project ${ project_name }. Visit ${ url } to create a password and complete your invite.`,
															htmlTemplate(
																`You've been invited to project ${ project_name }.`,
																`<div>Visit <a href="${ url }">this link</a>, within 24 hours, to create a password and accept your invite.</div>`,
																url,
																"Click here to accept invite"
															)
														)
													})
											);
									})

							})

					})
			),
	acceptInvite: (token, password) =>
		verify(token)
			.then(({ project, group, email, from, invited_by }) => {
				if (from !== "invite-request") {
					throw new Error("Invalid request.");
				}
				const sql = `
					SELECT COUNT(1) AS count
					FROM signup_requests
					WHERE state = 'awaiting'
					AND user_email = $1
					AND project_name = $2;
				`
				return query(sql, [email, project])
					.then(rows => +rows[0].count)
					.then(count => {
						if (count === 1) {
							return begin(client => {
								const passwordHash = hashSync(password),
									sql = `
										INSERT INTO users(email, password)
										VALUES ($1, $2)
										RETURNING *;
									`
								return client.query(sql, [email, passwordHash])
									.then(rows => rows.pop())
									.then(user => {
										const sql = `
											INSERT INTO users_in_groups(user_email, group_name, created_by)
											VALUES ($1, $2, $3);
										`;
										return client.query(sql, [email, group, invited_by])
											.then(() => {
												const sql = `
													UPDATE signup_requests
													SET state = 'accepted',
														resolved_at = now(),
														resolved_by = $1
													WHERE user_email = $2
													AND project_name = $3;
												`
												return client.query(sql, [invited_by, email, project])
													.then(() => getUser(email, passwordHash, project, user.id))
											})
									})
							})
						}
						throw new Error(`Could not find awaiting request.`);
					})
			}),

	getRequests: token => {
		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					const sql = `
						SELECT *
						FROM signup_requests
						WHERE project_name IN (
							SELECT project_name
							FROM users_in_groups AS uig
								INNER JOIN groups_in_projects AS gip
								ON uig.group_name = gip.group_name
							WHERE user_email = $1
							AND gip.auth_level >= 5
						)
					`
					query(sql, [userData.email])
						.then(resolve)
						.catch(reject);
				})
				.catch(reject)
		})
	},
	getRequestsForProject: (token, project_name) =>
		verifyAndGetUserData(token)
			.then(userData => {
				const sql = `
					SELECT *
					FROM signup_requests
					WHERE project_name IN (
						SELECT project_name
						FROM users_in_groups AS uig
							INNER JOIN groups_in_projects AS gip
							ON uig.group_name = gip.group_name
						WHERE uig.user_email = $1
						AND gip.auth_level >= 5
						AND project_name = $2
					)
					AND state != 'accepted'
				`
				return query(sql, [userData.email, project_name])
			}),

	passwordSet: (token, password) => {
		return verifyAndGetUserData(token)
			.then(userData => {
				const passwordHash = hashSync(password),
					sql = `
						UPDATE users
						SET password = $1
						WHERE email = $2;
					`
				return query(sql, [passwordHash, userData.email])
					.then(() => sign(userData.email, passwordHash))
			})
	},
	passwordForce: (token, userEmail, password) => {
		return verifyAndGetUserData(token)
			.then(userData => {
				return getUserAuthLevel(userData.email, "avail_auth")
					.then(authLevel => {
						if (authLevel >= 10) {
							const passwordHash = hashSync(password);
							const sql = `
								UPDATE users
								SET password = $1
								WHERE email = $2;
							`
							return query(sql, [passwordHash, userEmail])
								.then(() => sign(userData.email, userData.password))
						}
						else {
							throw new Error("You do not have the authority to set the password for other users.");
						}
					})
			})
	},

	passwordUpdate: (token, current, password) => {
		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					if (bcrypt.compareSync(current, userData.password)) {
						const passwordHash = hashSync(password),
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
	passwordReset: (email, project_name, projectData) => {
		email = email.toLowerCase();
		const {
			HOST,
			URL
		} = getProjectData(project_name, projectData);

		return getUserData(email)
			.then(userData => {
				if (userData) {
					const password = passwordGen(),
						passwordHash = hashSync(password),
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
									`${ HOST }${ URL }/${ token }`,
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
