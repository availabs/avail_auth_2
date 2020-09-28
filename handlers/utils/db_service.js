'use strict'

const path = require('path'),

	pg = require('pg'),

	loadEnvFile = require('node-env-file');

loadEnvFile(path.join(__dirname, 'postgres.env'));

const config = {
  	host:		process.env.POSTGRES_HOST,
  	port:		process.env.POSTGRES_PORT,
  	user:		process.env.POSTGRES_USER,
  	password:	process.env.POSTGRES_PASSWORD,
  	database:	process.env.POSTGRES_DB,
  	max:		40
}

const pool = new pg.Pool(config);

const query = (sql, values=[]) => {
	return new Promise((resolve, reject) => {
		pool.query(sql, values, (error, result) => {
			if (error) {
				reject(new Error(error.detail || "There was a database error."));
			}
			else {
				resolve(result.rows || []);
			}
		})
	})
}

module.exports = {

	end: () => pool.end(),

	query,

	queryAll: sqlAndValues => {
		return new Promise((resolve, reject) => {
			Promise.all(sqlAndValues.map(sav => query(...sav)))
				.then(resolve)
				.catch(e => reject(new Error("There was a database error.")))
		})
	}

}
