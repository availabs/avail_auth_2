const { query } = require("./db_service");
const {
	verifyAndGetUserData
} = require("./auth.utils");

const getUserPreferences = async (userData, project) => {
  const sql = `
    SELECT *
    FROM user_preferences
    WHERE user_email = $1
    AND project_name = $2;
  `
  const [preferences = {}] = await query(sql, [userData.email, project]);

  return preferences.preferences;
}

module.exports = {
  get: (token, project) => {
    return verifyAndGetUserData(token)
      .then(userData => {
        return getUserPreferences(userData, project);
      })
  },

  update: (token, project, preferences) => {
    return verifyAndGetUserData(token)
      .then(userData => {
        return getUserPreferences(userData, project)
          .then(current => {
            if (!current) {
              const sql = `
                INSERT INTO user_preferences(user_email, project_name, preferences)
                VALUES ($1, $2, $3);
              `
              return query(sql, [userData.email, project, preferences])
                .then(() => preferences);
            }
            else {
              preferences = { ...current, ...preferences };
              const sql = `
                UPDATE user_preferences
                SET preferences = $1
                WHERE user_email = $2
                AND project_name = $3;
              `
              return query(sql, [preferences, userData.email, project])
                .then(() => preferences);
            }
          });
      });
  }
}
