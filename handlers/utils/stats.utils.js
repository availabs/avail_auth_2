const { query } = require("./db_service"),
	{
		verifyAndGetUserData,
		getUserAuthLevel
	} = require("./auth.utils");

module.exports = {

	getLogins: token =>
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
								)
								AND user_email NOT LIKE 'fake.user.%@fake.email.com';
							`
							return query(sql)
						}
						else {
							throw new Error("You do not have the required authority to view logins.")
						}
					})
			})

}
