# Clone Production Database Into Local Dev Database

0. Requirements
  * `handlers/utils/postgres.env.prod` (production db conn creds)

  * `handlers/utils/postgres.env.local` (local dev db conn creds)

1. Dump the production avail_auth database EXCEPT for the _user_, _logins_, signup\_requests and _messages_ tables
```
dumpTables.sh
```

2. Load the dumped tables into the local dev database.
```
loadData.sh
```
