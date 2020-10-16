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
console.log("DB ERROR:", error);
				reject(new Error(error.detail || "There was a database error."));
			}
			else {
				resolve(result.rows || []);
			}
		})
	})
}

class Client {
	constructor(client) {
		this.client = client;
	}
	query(sql, values = []) {
		return this.client.query(sql, values)
			.then(result => result.rows || [])
			.catch(error => {
				throw new Error(error.detail || "There was a database error.");
			})
	}
}

module.exports = {
	end: () => pool.end(),
	query,
	queryAll: sqlAndValues =>
		Promise.all(sqlAndValues.map(sav => query(...sav)))
			.catch(e => { throw new Error("There was a database error."); }),
	begin: async (queryFunc) => {
		let res = null;
		try {
			const client = await pool.connect();
			try {
				await client.query("BEGIN");
				res = await queryFunc(new Client(client));
				await client.query("COMMIT");
			}
			catch (e) {
				await client.query("ROLLBACK");
				throw e;
			}
			finally {
				client.release();
			}
		}
		catch (e) {
console.log("DB ERROR:", e)
			throw new Error("There was a database error.");
		}
		return res;
	}
}
