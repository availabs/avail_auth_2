INSERT INTO users (email, password, created_at, id)
  SELECT
      email,
      encryptedPassword AS password,
      createdAt AS created_at,
      id
    FROM tmp_old_user_table
    WHERE (
      (
        email NOT IN (
          SELECT email FROM users
        )
      )
      AND
      (
        encryptedPassword IS NOT NULL
      )
    )
;
