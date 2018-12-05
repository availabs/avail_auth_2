const { query, queryAll } = require("./db_service"),
	{
		verifyAndGetUserData,
		getUserAuthLevel
	} = require("./auth.utils");

module.exports = {

	getLogins: token => {
		return new Promise((resolve, reject) => {
			verifyAndGetUserData(token)
				.then(userData => {
					return getUserAuthLevel(userData.email, 'avail_auth')
						.then(userAuthLevel => {
							if (userAuthLevel > 0) {
								const sql = `
									SELECT *
									FROM logins
									WHERE user_email NOT IN (
										SELECT user_email
										FROM users_in_groups
										WHERE group_name = 'AVAIL'
									);
								`
								return query(sql)
							}
							else {
								throw new Error("You do not have the required authority to view logins.")
							}
						})
				})
				.then(resolve)
				.catch(reject)
		})
	}

}