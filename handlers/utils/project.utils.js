const { query, queryAll } = require("./db_service");

const {
	getUserAuthLevel,
	verifyAndGetUserData
} = require("./auth.utils");

module.exports = {

	get: token => {
		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					getUserAuthLevel(userData.email, 'avail_auth')
						.then(authLevel => {
							if (authLevel === 10) {
								const sql = `
									SELECT *
									FROM projects;
								`
								query(sql)
									.then(resolve)
									.catch(reject);
							}
							else if (authLevel >= 1) {
								const sql = `
									SELECT *
									FROM projects
									WHERE name IN (
										SELECT project_name
										FROM users_in_groups AS uig
										INNER JOIN groups_in_projects AS gip
										ON uig.group_name = gip.group_name
										WHERE user_email = $1
									)
								`
								query(sql, [userData.email])
									.then(resolve)
									.catch(reject);
							}
							else {
								reject(new Error("You do not have the required authority to look at projects."))
							}
						})
				})
				.catch(reject)
		})
	},

	create: (token, name) => {
		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					getUserAuthLevel(userData.email, 'avail_auth')
						.then(authLevel => {
							if (authLevel === 10) {
								const sqlAndValues = [
									[`INSERT INTO projects(name, created_by)
										VALUES ($1, $2);
									`, [name, userData.email]],
									[`INSERT INTO groups_in_projects(project_name, group_name, auth_level, created_by)
										VALUES ($1, 'avail', 10, $2);
									`, [name, userData.email]]
								]
								queryAll(sqlAndValues)
									.then(resolve)
									.catch(reject);
							}
							else {
								reject(new Error("You do not have the required authority to create projects."))
							}
						})
				})
				.catch(reject)
		})
	},
	deleteProject: (token, name) => {
		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					getUserAuthLevel(userData.email, 'avail_auth')
						.then(authLevel => {
							if (authLevel === 10) {
								const sqlAndValues = [
									[`DELETE FROM projects
										WHERE name = $1;
									`, [name]],
									[`DELETE FROM groups_in_projects
										WHERE project_name = $1;
									`, [name]]
								]
								queryAll(sqlAndValues)
									.then(resolve)
									.catch(reject);
							}
							else {
								reject(new Error("You do not have the required authority to remove projects."))
							}
						})
				})
				.catch(reject)
		})
	}
	
}