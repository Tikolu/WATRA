import Defaults from "../../defaults.json" with {type: "json"}
	
import User from "modules/schemas/user"
import Unit from "modules/schemas/unit"
import { Logger } from "modules/logger.js"

const logger = new Logger("Setup", 36)

async function createUnit(unit) {
	let newUnit
	if(unit.linkExisting) {
		newUnit = await Unit.findOne({
			type: unit.type,
			name: unit.name
		})
		if(!newUnit) {
			throw new Error(`Linked unit not found: ${unit.type} - ${unit.name}`)
		}
		logger.log(`Linking existing ${newUnit.typeName} - ${newUnit.displayName}`)
	} else {
		newUnit = new Unit({
			type: unit.type,
			name: unit.name
		})
		logger.log(`Creating ${newUnit.typeName} - ${newUnit.displayName}`)
	}
	for(const user of unit.users || []) {
		const newUser = new User()
		if(Array.isArray(user.name)) {
			newUser.name.first = user.name[0]
			newUser.name.last = user.name[1]
		} else if(user.name) {
			newUser.name.first = user.name
		}
		await newUnit.setRole(newUser, user.role)
		if(user.generateAccessCode) {
			const accessCode = await newUser.generateAccessCode()
			logger.log(`${newUser.displayName}'s access code:`, accessCode)
		}
	}
	for(const subUnit of unit.subUnits || []) {
		const newSubUnit = await createUnit(subUnit)
		await newUnit.addSubUnit(newSubUnit)
	}
	await newUnit.save()
	return newUnit
}

// Checks if database setup is required
export async function required() {
	const unit = await Unit.findOne()
	return !unit
}

// Sets up database with default values defined in defaults.json
export async function start() {
	logger.log("Starting...")
	try {
		await createUnit(Defaults)
		logger.log("Complete!")
	} catch(error) {
		logger.log("Error!\n", error)
		const database = await import("modules/database")
		await database.clear()
	}
}