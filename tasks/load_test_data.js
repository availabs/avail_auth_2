const bcrypt = require("bcryptjs"),

	{ query, end } = require("../handlers/utils/db_service"),

	{ email, password, esc_email } = require("./availUserData.json");
	passwordHash = bcrypt.hashSync(password);

// create general AVAIL user
let sql = `
	INSERT INTO users(email, password)
	VALUES ($1, $2);
`
const p1 = query(sql, [email, passwordHash])
	.catch(e => console.log(e.message));

// create AVAIL super group
sql = `
	INSERT INTO groups(name, created_by)
	VALUES ($1, $2);
`
const p2 = query(sql, ['AVAIL', email])
	.catch(e => console.log(e.message));

// create avail_auth project
sql = `
	INSERT INTO projects(name, created_by)
	VALUES ($1, $2);
`
const p3 = query(sql, ['avail_auth', email])
	.catch(e => console.log(e.message));

// put general AVAIL user in AVAIL super group
sql = `
	INSERT INTO users_in_groups(user_email, group_name, created_by)
	VALUES ($1, $2, $3);
`
const p4 = query(sql, [email, 'AVAIL', email])
	.catch(e => console.log(e.message));

// put AVAIL super group in avail_auth project
sql = `
	INSERT INTO groups_in_projects(project_name, group_name, auth_level, created_by)
	VALUES ($1, $2, $3, $4);
`
const p5 = query(sql, ['avail_auth', 'AVAIL', 10, email])
	.catch(e => console.log(e.message));

// add test messages to messages table
sql = `
	INSERT INTO messages(message, heading, user_email, created_by)
	VALUES ($1, $2, $3, $4)
`
const p6 = query(sql, ['### TEST MESSAGE!!!', 'Test 1', esc_email, email])
	.catch(e => console.log(e.message));
const p7 = query(sql, ['### ANOTHER MESSAGE!!!\nSome body text.', 'Test 2', esc_email, email])
	.catch(e => console.log(e.message));

Promise.all([p1, p2, p3, p4, p5, p6, p7])

// create test users
const email1 = "test1@email.com",
	pass1 = "test1",
	hash1 = bcrypt.hashSync(pass1),

	email2 = "test2@email.com",
	pass2 = "test2",
	hash2 = bcrypt.hashSync(pass2);

sql = `
	INSERT INTO users(email, password)
	VALUES ($1, $2);
`
const t1 = query(sql, [email1, hash1])
	.catch(e => console.log(e.message))
const t2 = query(sql, [email2, hash2])
	.catch(e => console.log(e.message))
Promise.all([t1, t2])
	.then(end);