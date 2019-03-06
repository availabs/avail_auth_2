UPDATE groups AS new
  SET id = old.id
  FROM tmp_old_group_table AS old
  WHERE (
    (
      new.id IS NULL
    )
    AND
    (
      new.name = old.name
    )
  )
;
