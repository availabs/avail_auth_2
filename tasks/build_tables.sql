CREATE TABLE IF NOT EXISTS users (
	email TEXT PRIMARY KEY,
	password TEXT NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects(
	name TEXT PRIMARY KEY,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
	created_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS groups(
	name TEXT PRIMARY KEY,
	meta JSON DEFAULT NULL,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
	created_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS groups_in_projects(
	project_name TEXT NOT NULL,
	group_name TEXT NOT NULL,
	auth_level INT DEFAULT 0,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
	created_by TEXT NOT NULL,
	CONSTRAINT groups_in_projects_pkey PRIMARY KEY (project_name, group_name)
);

CREATE TABLE IF NOT EXISTS users_in_groups (
	user_email TEXT NOT NULL,
	group_name TEXT NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
	created_by TEXT NOT NULL,
	CONSTRAINT users_in_groups_pkey PRIMARY KEY (user_email, group_name)
);

CREATE TABLE IF NOT EXISTS signup_requests (
	user_email TEXT NOT NULL,
	project_name TEXT NOT NULL,
	state TEXT NOT NULL DEFAULT 'pending',
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
	resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
	resolved_by TEXT DEFAULT NULL,
	CONSTRAINT group_requests_pkey PRIMARY KEY(user_email, project_name)
);

CREATE TABLE IF NOT EXISTS logins (
	user_email TEXT NOT NULL,
	project_name TEXT NOT NULL,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
	message TEXT NOT NULL,
	heading TEXT NOT NULL,
	user_email TEXT NOT NULL,
	viewed BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
	created_by TEXT NOT NULL,
	id BIGSERIAL PRIMARY KEY
);

CREATE TYPE project_row AS (
	name TEXT,
	auth_level INTEGER
);