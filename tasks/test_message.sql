/*
CREATE TABLE IF NOT EXISTS messages_new (
	heading TEXT NOT NULL,
	message TEXT NOT NULL,

	sent_by TEXT NOT NULL REFERENCES users(email),
	sent_to TEXT NOT NULL REFERENCES users(email),
	sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

	project_name TEXT REFERENCES projects(name),

	viewed BOOLEAN NOT NULL DEFAULT FALSE,

	id BIGSERIAL PRIMARY KEY
);
*/
INSERT INTO messages_new(heading, message, sent_by, sent_to, project_name)
VALUES ('test', 'test message.', 'econ24@msn.com', 'eric.s.conklin@gmail.com', 'project-manager');
