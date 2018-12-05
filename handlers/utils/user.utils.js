const { query, queryAll } = require("./db_service"),
	{
		verifyAndGetUserData,
		getUserAuthLevel
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

	getUsers: token => {
		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					return getUserAuthLevel(userData.email, 'avail_auth')
						.then(userAuthLevel => {
							const sql = `
								SELECT email,
									users.created_at,
									array_to_json(
										array(
											SELECT row_to_json(row(project_name, auth_level)::project_row)
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
								GROUP BY 1, 2
							`
							return query(sql);
						})
				})
				.then(resolve)
				.catch(reject)
		})
	},

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
										query(sql, [user_email, group_name, userData.email])
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
										query(sql, [user_email, group_name])
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

	delete: (token, user_email) => {
		return new Promise((resolve, reject) => {
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
											[`UPDATE signup_requests
												SET state = 'rejected',
													resolved_by = $1,
													resolved_at = now()
												WHERE user_email = $2`, [userData.email, user_email]]
										]
										return queryAll(sqlAndValues)
											.then(() => resolve(`Deleted user ${ user_email }.`));
									}
									else {
										throw new Error(`You do not have the authority to delete user ${ user_email }.`);
									}
								})
						})
				})
				.catch(reject)
		})
	}

}