# WATRA - *Web Application for Troop Registration and Administration*

## Core features
- Units
	- Create units and sub-units
	- Assign users to unit roles
- Users
	- Collect user details and medical information
	- Passkey authentication
- Events
	- Create events, invite units and members
	- Event participation registration
	- Event approval
- Configurability
	- Configurable unit types
	- Configurable role types and permissions

## Limitations
- Interface currently available only in Polish language

## Technologies used
- [Deno JavaScript runtime](https://deno.com)
- [MongoDB database](https://mongodb.com)
- [Mongoose ODM](https://mongoosejs.com)
- [Eta templating engine](https://eta.js.org)

## Installation
- Install Deno from [deno.com](https://docs.deno.com/runtime/getting_started/installation)
- Install MongoDB from [mongodb.com](https://mongodb.com/try/download/community)
- Clone/download this repository

## Configuration
### .env file
- Enter a secure private key for the WATRA server. Highly recommended to generate one [here](https://calebj0seph.github.io/password-generator)
- Optionally, set the `MONGO_URI` here if your MongoDB server is not running on the default (`localhost:27017`)
### Config files
Any JSON files in the `config` directory will be loaded by the server on startup. You can customise unit types, role types and permissions here.

## Starting the server
To start WATRA, run `deno task start` in the project directory. The following attributes are required:
```
--db <database_name>      Name of the MongoDB database to use
--host <host_address>     Host address for the web server
--port <port_number>      Port number for the web server
```

Example:
```
deno task start --db watra-test --host localhost --port 80
```
Then, WATRA will be available at the specified host and port.

## Data import
Add the `import` attribute to the command above to import units and users from a JSON or CSV file:
```
--import <file_path>      Path to the import file (JSON or CSV)
```

You may also want to generate or process data. This can be done by writing a custom JavaScript file and then running it using the `script` attribute:
```
--script <script_path>    Path to the custom script file
```