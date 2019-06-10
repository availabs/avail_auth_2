INSERT INTO users_in_groups (
   user_email,
   group_name,
   created_by
)
  SELECT DISTINCT
      user_email,
      group_name,
      'availabs@gmail.com' AS created_by
    FROM tmp_old_join_table
    WHERE (
      (
        (user_email, group_name) NOT IN (
          SELECT user_email, group_name FROM users_in_groups
        )
      )
      AND
      (user_email IN (SELECT email FROM users))
      AND
      (group_name IN (SELECT name FROM groups))
    )
;
