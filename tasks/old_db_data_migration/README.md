# Migrating Old Auth Database Data To New Auth Database

## Step 1: Prelimiary Investigations

### Which is the active old aauth database?

```
$ cat ~/npmrds/client/prod.npmrds/src/config/AUTH_HOST.js
...
const authHost = 'https://aauth.availabs.org/'
...

$ ag 'aauth.availabs' /etc/apache2/sites-available/
/etc/apache2/sites-available/aauth.availabs.org.conf
2:    ServerName aauth.availabs.org
...
    <Location />
        # ProxyPass http://localhost:1660/
        # ProxyPassReverse http://localhost:1660/
        ProxyPass http://0.0.0.0:1660/
        ProxyPassReverse http://0.0.0.0:1660/
    </Location>

$ forever list | grep 1660
data: ... auth.js --port=1660 ... /home/avail/npmrds/auth/prod.auth

$ cat /home/avail/npmrds/auth/prod.auth/config/connections.js
...
  postgresql: {
    adapter: 'sails-postgresql',
    host: 'mars.availabs.org',//169.226.142.154'
    user: ...
    password: ...
    database: 'avail_auth_prod'
  }
...
```

#### Conclusion

The active aauth database is 
```
PGHOST=mars.availabs.org
PGDATABASE=avail_auth_prod
```

NOTE: There is a database named `avail_auth_new` with more columns than `avail_auth_prod`.
However, this database does not seem to be used by any active auth server.

```
$ ag avail_auth_new ~/code
avail_auth/config/connections.js
82:    database: 'avail_auth_new'

$ forever list | grep auth
data: ... auth.js --port=1660 ... /home/avail/npmrds/auth/prod.auth
data: ... index.js            ... /home/avail/code/avail_auth_2
```

### AVAIL Auth User Table Schemas

### Old user table schema

```
avail_auth_new=# \connect avail_auth_prod
You are now connected to database "avail_auth_prod" as user "postgres".
avail_auth_prod=# \d "user"
                                         Table "public.user"
        Column        |           Type           |                     Modifiers
----------------------+--------------------------+---------------------------------------------------
 displayName          | text                     |
 email                | text                     |
 encryptedPassword    | text                     |
 resetToken           | text                     |
 requestNotifications | boolean                  |
 id                   | integer                  | not null default nextval('user_id_seq'::regclass)
 createdAt            | timestamp with time zone |
 updatedAt            | timestamp with time zone |
Indexes:
    "user_pkey" PRIMARY KEY, btree (id)
    "user_email_key" UNIQUE CONSTRAINT, btree (email)
    "user_encryptedPassword_key" UNIQUE CONSTRAINT, btree ("encryptedPassword")
```

#### New user table schema

```
postgres=# \connect avail_auth
You are now connected to database "avail_auth" as user "postgres".
avail_auth=# \d users
                      Table "public.users"
   Column   |           Type           |       Modifiers
------------+--------------------------+------------------------
 email      | text                     | not null
 password   | text                     | not null
 created_at | timestamp with time zone | not null default now()
Indexes:
    "users_pkey" PRIMARY KEY, btree (email)

```

### Decisions

1. Add id to new database user table
2. Drop displayName
