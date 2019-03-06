UPDATE users AS new
  SET id = old.id
  FROM tmp_old_user_table AS old
  WHERE (
    (
      new.id IS NULL
    )
    AND
    (
      new.email = old.email
    )
  )
;
