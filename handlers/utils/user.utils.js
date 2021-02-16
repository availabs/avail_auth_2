const bcrypt = require("bcryptjs")

const { query, queryAll } = require("./db_service"),
	{
		verifyAndGetUserData,
		getUserAuthLevel,
		getUserGroups
	} = require("./auth.utils");

const getUserMaxAuthLevel = user_email =>
	new Promise((resolve, reject) => {
		const sql = `
			SELECT max(auth_level) AS auth_level
			FROM users_in_groups AS uig
			INNER JOIN groups_in_projects AS gip
			ON uig.group_name = gip.group_name
			WHERE user_email = $1;
		`
		query(sql, [user_email])
			.then(rows => rows[0] ? rows[0].auth_level : 0)
			.then(resolve)
			.catch(reject)
	})
const getGroupMaxAuthLevel = group_name =>
	new Promise((resolve, reject) => {
		const sql = `
			SELECT max(auth_level) AS auth_level
			FROM groups_in_projects
			WHERE group_name = $1;
		`
		return query(sql, [group_name])
			.then(rows => rows[0] ? rows[0].auth_level : 0)
			.then(resolve)
			.catch(reject)
	})

module.exports = {

	createFake: token =>
		verifyAndGetUserData(token)
			.then(userData => {
				return getUserAuthLevel(userData.email, 'avail_auth')
					.then(userAuthLevel => {
						if (userAuthLevel === 10) {
							const sql = `
								SELECT *
								FROM users
								WHERE email LIKE 'fake.user.%@fake.email.com';
							`
							return query(sql)
								.then(rows => {
									const regex = /fake\.user\.(\d+)@fake\.email\.com/;
									let num = 0;
									rows.forEach(({ email }) => {
										const match = regex.exec(email);
										if (match) {
											num = Math.max(num, +match[1]);
										}
									})
									const fakeEmail = `fake.user.${ ++num }@fake.email.com`,
										fakePassword = `Jedi21fake`,
										passwordHash = bcrypt.hashSync(fakePassword);
									const sql = `
										INSERT INTO users(email, password)
										VALUES ($1, $2);
									`
									return query(sql, [fakeEmail, passwordHash])
										.then(() => `New fake user created with email ${ fakeEmail } and password ${ fakePassword }.`)
								})
						}
						else {
							throw new Error("You do not have the authority to create fake users.")
						}
					})
			}),

	getUsers: token =>
		verifyAndGetUserData(token)
			.then(userData => {
				const sql = `
				WITH user_projects AS (
					SELECT project_name, MAX(auth_level) AS auth_level
					FROM users_in_groups AS uig
					INNER JOIN groups_in_projects AS gip
					ON uig.group_name = gip.group_name
					WHERE user_email = $1
					GROUP BY 1
				)
				SELECT email, users.id,
					users.created_at,
					array_to_json(
						array(
							SELECT row_to_json(row(project_name, gip.group_name, auth_level)::project_row)
							FROM users_in_groups AS uig INNER JOIN groups_in_projects AS gip ON uig.group_name = gip.group_name
							WHERE user_email = email
						)
					) AS projects,
					array_to_json(
						array(
							SELECT DISTINCT group_name
							FROM users_in_groups
							WHERE user_email = email
						)
					) AS groups
				FROM users
				WHERE email NOT IN (
					SELECT DISTINCT user_email
					FROM users_in_groups AS uig
					INNER JOIN groups_in_projects AS gip
					ON uig.group_name = gip.group_name
					WHERE auth_level > (
						SELECT COALESCE(MAX(auth_level), -1)
						FROM user_projects
						WHERE user_projects.project_name = gip.project_name
					)
				)
				GROUP BY 1, 2
				`
				return query(sql, [userData.email]);
			}),

	getUsersByGroup: (token, groups) =>
		verifyAndGetUserData(token)
			.then(userData => {
				const sql = `
					WITH user_projects AS (
						SELECT project_name, MAX(auth_level) AS auth_level
						FROM users_in_groups AS uig
						INNER JOIN groups_in_projects AS gip
						ON uig.group_name = gip.group_name
						WHERE user_email = $1
						GROUP BY 1
					)
					SELECT DISTINCT user_email AS email, uig.group_name, gip.auth_level
					  FROM users_in_groups AS uig
					  JOIN groups_in_projects AS gip
					  ON uig.group_name = gip.group_name
					  WHERE uig.group_name = ANY($2)
						AND gip.auth_level <= (
							SELECT COALESCE(MAX(auth_level), -1)
							FROM user_projects
							WHERE user_projects.project_name = gip.project_name
						)
				`
				return query(sql, [userData.email, groups]);
			}),

	assignToGroup: (token, user_email, group_name) => {
		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					const sql = `
						SELECT project_name, auth_level
						FROM groups_in_projects
						WHERE group_name = $1;
					`
					return query(sql, [group_name])
						.then(rows => {
							const map = {}
							rows.forEach(({ project_name, auth_level }) => {
								map[project_name] = auth_level;
							})
							const sql = `
								SELECT project_name, auth_level
								FROM users_in_groups AS uig
								INNER JOIN groups_in_projects AS gip
								ON uig.group_name = gip.group_name
								WHERE user_email = $1
							`
							return query(sql, [userData.email])
								.then(rows => {
									rows.forEach(({ project_name, auth_level }) => {
										if ((project_name in map) && (map[project_name] <= auth_level)) {
											delete map[project_name];
										}
									})
									if (Object.keys(map).length === 0) {
										const sql = `
											INSERT INTO users_in_groups(user_email, group_name, created_by)
											VALUES ($1, $2, $3);
										`
										return query(sql, [user_email, group_name, userData.email])
											.then(() => resolve(`Assigned user ${ user_email } to group ${ group_name }.`))
									}
									else {
										throw new Error(`You do not have the authority to assign users to group ${ group_name }.`);
									}
								})
						})
				})
				.catch(reject)
		})
	},
	removeFromGroup: (token, user_email, group_name) => {
		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					const sql = `
						SELECT project_name, auth_level
						FROM groups_in_projects
						WHERE group_name = $1;
					`
					return query(sql, [group_name])
						.then(rows => {
							const map = {}
							rows.forEach(({ project_name, auth_level }) => {
								map[project_name] = auth_level;
							})
							const sql = `
								SELECT project_name, auth_level
								FROM users_in_groups AS uig
								INNER JOIN groups_in_projects AS gip
								ON uig.group_name = gip.group_name
								WHERE user_email = $1
							`
							return query(sql, [userData.email])
								.then(rows => {
									rows.forEach(({ project_name, auth_level }) => {
										if ((project_name in map) && (map[project_name] <= auth_level)) {
											delete map[project_name];
										}
									})
									if (Object.keys(map).length === 0) {
										const sql = `
											DELETE FROM users_in_groups
											WHERE user_email = $1
											AND group_name = $2;
										`
										return query(sql, [user_email, group_name])
											.then(() => resolve(`Removed user ${ user_email } from group ${ group_name }.`))
									}
									else {
										throw new Error(`You do not have the authority to remove users from group ${ group_name }.`);
									}
								})
						})
				})
				.catch(reject)
		})
	},

	delete: (token, user_email) =>
		verifyAndGetUserData(token)
			.then(userData => {
				const sql = `
					SELECT project_name, auth_level
					FROM users_in_groups AS uig
					INNER JOIN groups_in_projects AS gip
					ON uig.group_name = gip.group_name
					WHERE user_email = $1;
				`
				return query(sql, [user_email])
					.then(rows => {
						const map = {}
						rows.forEach(({ project_name, auth_level }) => {
							map[project_name] = auth_level;
						})
						const sql = `
							SELECT project_name, auth_level
							FROM users_in_groups AS uig
							INNER JOIN groups_in_projects AS gip
							ON uig.group_name = gip.group_name
							WHERE user_email = $1
						`
						return query(sql, [userData.email])
							.then(rows => {
								rows.forEach(({ project_name, auth_level }) => {
									if ((project_name in map) && (map[project_name] <= auth_level)) {
										delete map[project_name];
									}
								})
								if (Object.keys(map).length === 0) {
									const sqlAndValues = [
										[`DELETE FROM users
											WHERE email = $1;`, [user_email]],
										[`DELETE FROM users_in_groups
											WHERE user_email = $1`, [user_email]],
										[`DELETE FROM signup_requests
											WHERE user_email = $1;`, [user_email]],
										[`DELETE FROM logins
											WHERE user_email = $1;`, [user_email]]
									]
									return queryAll(sqlAndValues)
										.then(() => `Deleted user ${ user_email }.`);
								}
								else {
									throw new Error(`You do not have the authority to delete user ${ user_email }.`);
								}
							})
					})
			})

}
