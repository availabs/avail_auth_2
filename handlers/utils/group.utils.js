const { query, queryAll } = require("./db_service");

const {
	getUserAuthLevel,
	verifyAndGetUserData
} = require("./auth.utils");

module.exports = {

	get: (token) => {
		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					getUserAuthLevel(userData.email, 'avail_auth')
						.then(authLevel => {
							const sql = `
								SELECT name,
									meta::TEXT,
									groups.created_at,
									groups.created_by,
									array_to_json(
										array(
											SELECT row_to_json(row(project_name, group_name, auth_level)::project_row)
											FROM groups_in_projects
											WHERE group_name = name
										)
									) AS projects
								FROM groups
								WHERE name NOT IN (
									SELECT group_name
									FROM groups_in_projects
									WHERE project_name NOT IN (
										SELECT project_name
										FROM users_in_groups AS uig INNER JOIN groups_in_projects AS gip ON uig.group_name = gip.group_name
										WHERE user_email = $1
									)
								)
								GROUP BY 1, 2, 3, 4
							`;
							query(sql, [userData.email])
								.then(resolve)
								.catch(reject);
						})
				})
				.catch(reject)
		})
	},

	create: (token, name, meta) => {
		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					getUserAuthLevel(userData.email, 'avail_auth')
						.then(authLevel => {
							if (authLevel >= 1) {
								const sql = `
									INSERT INTO groups(name, meta, created_by)
									VALUES ($1, $2, $3);
								`
								query(sql, [name, meta, userData.email])
									.then(resolve)
									.catch(reject);
							}
							else {
								reject(new Error("You do not have the required authority level to create groups."));
							}
						})
				})
				.catch(reject)
		})
	},

	deleteGroup: (token, group_name) => {
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
					query(sql, [userData.email])
						.then(rows => {
							const queries = rows.map(({ project_name, auth_level }) => {
								const sql = `
									DELETE FROM groups_in_projects
									WHERE	group_name = $1
									AND project_name = $2
									AND auth_level <= $3;
								`
								return query(sql, [group_name, project_name, auth_level])
							})
							Promise.all(queries)
								.then(() => {
									const sql = `
										SELECT project_name
										FROM groups_in_projects
										WHERE group_name = $1
									`
									query(sql, [group_name])
										.then(rows => {
											if (rows.length === 0) {
												const sqlAndValues = [
													[`DELETE FROM groups_in_projects
														WHERE group_name = $1;
													`, [group_name]],
													[`DELETE FROM users_in_groups
														WHERE group_name = $1
													`, [group_name]],
													[`DELETE FROM groups
														WHERE name = $1
													`, [group_name]]
												]
												queryAll(sqlAndValues)
													.then(() => resolve(`Group ${ group_name } was deleted.`))
													.catch(reject)
											}
											else {
												resolve(`Group "${ group_name }" was removed from all projects for which you have authority.`)
											}
										})
								})
								.catch(reject)
						})
						.catch(reject)
				})
				.catch(reject)
		})
	},

	assignToProject: (token, group_name, project_name, auth_level) => {
		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					return getUserAuthLevel(userData.email, project_name)
						.then(userAuthLevel => {
							if (userAuthLevel >= auth_level) {
								const sql = `
									INSERT INTO groups_in_projects(project_name, group_name, auth_level, created_by)
									VALUES ($1, $2, $3, $4);
								`
								return query(sql, [project_name, group_name, auth_level, userData.email])
									.then(resolve)
									.catch(reject);
							}
							else {
								throw new Error(`You do not have the required authority level to assign group "${ group_name }" to project "${ project_name }" at authority level "${ auth_level }".`);
							}
						})
				})
				.catch(reject)
		})
	},
	removeFromProject: (token, group_name, project_name) => {
		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					getUserAuthLevel(userData.email, project_name)
						.then(userAuthLevel => {
							const sql = `
								SELECT auth_level
								FROM groups_in_projects
								WHERE group_name = $1
								AND project_name = $2;
							`
							query(sql, [group_name, project_name])
								.then(row => {
									if (row.length === 0) {
										throw new Error(`Group "${ group_name }" is not in project "${ project_name }".`);
									}
									else {
										return row[0].auth_level
									}
								})
								.then(groupAuthLevel => {
									if (userAuthLevel >= groupAuthLevel) {
										const sql = `
											DELETE FROM groups_in_projects
											WHERE group_name = $1
											AND project_name = $2;
										`
										return query(sql, [group_name, project_name])
									}
									else {
										throw new Error(`You do not have the required authority level to remove group "${ group_name }" from project "${ project_name }".`);
									}
								})
								.then(resolve)
								.catch(reject);
						})
				})
				.catch(reject)
		})
	},

	adjustAuthLevel: (token, group_name, project_name, auth_level) => {
		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					return getUserAuthLevel(userData.email, project_name)
						.then(userAuthLevel => {
							if (userAuthLevel >= auth_level) {
								const sql = `
									UPDATE groups_in_projects
									SET auth_level = $1,
										created_by = $2
									WHERE group_name = $3
									AND project_name = $4;
								`
								return query(sql, [auth_level, userData.email, group_name, project_name])
									.then(() => resolve(`Successfully adjusted group ${ group_name } authority level for project ${ project_name } to ${ auth_level }.`));
							}
							else {
								throw new Error(`You do not have the required authority level.`);
							}
						})
				})
				.catch(reject)
		})
	}
}
