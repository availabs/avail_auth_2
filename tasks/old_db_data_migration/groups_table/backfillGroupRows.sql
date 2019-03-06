INSERT INTO groups (
  name,
  created_at,
  created_by,
  id
) SELECT
     name,
     createdAt AS created_at,
     'availabs@gmail.com' AS created_by,
     id
    FROM tmp_old_group_table
    WHERE (
      (
        name NOT IN (
          SELECT name FROM groups
        )
      )
    )
;
