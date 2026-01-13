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
Create a `.env` file in the project root directory with the following variables:
- Set `SERVER_PRIVATE_KEY` to a long, randomly generated string. This key is used by the server to sign authentication token cookies.
- If MongoDB is running on a different server, set the `MONGO_URI` here. The default value is `mongodb://localhost:27017`.
- If you want to enable HTTPS, set the paths to your certificate and key files here (`HTTPS_CERT_PATH` and `HTTPS_KEY_PATH`).
> [!WARNING]
> It is crucial that the `.env` file and its contents are kept secret. Exposing these values will compromise the security of WATRA.

### deno.json file
By default, Deno permissions are configured to only allow connections to `localhost` (ports `8080` and `27017`). If you want to host WATRA on a different host/port, or connect to a remote MongoDB server, update these values accordingly in the `deno.json` file.

### Config files
Any JSON files in the `config` directory will be loaded by the server on startup. You can customise unit types, role types and permissions here.

## Starting the server
To start WATRA, run `deno task watra` in the project directory. The following attributes are required:
```
--db=<database_name>      Name of the MongoDB database to use
--host=<host_address>     Host address for the web server
--port=<port_number>      Port number for the web server
```

For example, to use database `watra-test` and start the server on `localhost:8080`, run:
```
deno task watra --db=watra-test --host=localhost --port=8080
```

## Data import
Add the `import` attribute to the command above to import units and users from a JSON or CSV file:
```
--import=<file_path>      Path to the import file (JSON or CSV)
```

You may also want to generate or process data. This can be done by writing a custom JavaScript file and then running it using the `script` attribute:
```
--script=<script_path>    Path to the custom script file
```

For example, here is a script which creates a unit and a user:
```js
// Import schemas
import Unit from "modules/schemas/unit"
import User from "modules/schemas/user"

// Create unit of type "troop"
const newUnit = await Unit.create({
	type: "troop"
})

// Create new user and assign role "leader" in new unit
const newUser = new User()
await newUnit.setRole(newUser, "leader")

// Generate access code valid for 5 minutes
const accessCode = await newUser.auth.generateAccessCode(1000*60*5)
console.log("New user access code:", accessCode)
```