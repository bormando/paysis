# Paysis

### About project
I was inspired to create an open-source **REST API** server example by the idea that newcomers in IT industry would use it get hands-on experience with this technology (creating collections in tools like Postman and setting up test automation frameworks).

It's an example of payment system - you can log in as an admin and create users and transactions for these users. Also you can make some minor changes in server configuration. For more information about routes, it'd better to open **Postman** collection (which is included in current repo).

No database needed.

### Project setup
1. Rename `.env.example` file into `.env`. Edit data in this file if you want to (admin credentials, server port and et cetera).
2. Run `npm i` command to install dependencies from `package.json` file.
3. Run `npm start` shortcut command to start an API server.

### Route names with examples
#### /auth
Being called with login/password credentials and returns authorization token in response.
```
POST /auth
{
    "login": "admin",
    "password": "admin" 
}
```

#### /users
User creation/deletion/reading.
```
* requires authorization token (bearer) to be provided

POST /users
no query parameters or body data needed in request

DELETE /users
{
    "id": "887c6399-55e3-4b15-8c84-39b5ddb3e40c"
}

GET /users
* may be called with or without (!) query parameter (!) "id"
?id=887c6399-55e3-4b15-8c84-39b5ddb3e40c
```

#### /transactions
Transaction creation/deletion/reading.
```
* requires authorization token (bearer) to be provided

POST /transactions
{
    "from": "cc8c855f-8130-4473-9bb5-c5a8cdb149a8",
    "to": "9a76b67c-19bf-4310-ab7c-7c7ef4d18860",
    "amount": 100
}

GET /transactions
{
    "id": "887c6399-55e3-4b15-8c84-39b5ddb3e40c"
}

GET /transactions
* may be called with or without (!) query parameter (!) "id"
?id=887c6399-55e3-4b15-8c84-39b5ddb3e40c
```

#### /config
Config edit and project reset (data wipe).
```
* requires authorization token (bearer) to be provided

GET /config
no query parameters or body data needed in request

PATCH /config
* config options may be changed separately 
{
    "number_of_entries": 6,
    "initial_amount": 500
}


DELETE /config
no query parameters or body data needed in request
```