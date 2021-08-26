INSERT INTO messages_new(heading, message, sent_by, sent_to, sent_at, viewed)
  SELECT heading,
    message,
    created_by,
    user_email,
    created_at,
    viewed
  FROM messages;

ALTER TABLE messages
  RENAME TO messages_old;

ALTER TABLE messages_new
  RENAME TO messages;
