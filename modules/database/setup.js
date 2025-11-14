import Defaults from "../../defaults.json" with {type: "json"}
	
import User from "modules/schemas/user"
import Unit from "modules/schemas/unit"
import { Logger } from "modules/logger.js"

const logger = new Logger("Setup", 36)

async function generateUsers(unit, count, role) {
	logger.log(`Generating ${count} users for ${unit.typeName} - ${unit.displayName}`)
	for(let i = 0; i < count; i++) {
		const newUser = new User({
			name: {
				first: Defaults.names.first.random(),
				last: Defaults.names.last.random()
			}
		})
		await unit.setRole(newUser, role)
	}
}

async function createUnit(unit) {
	if(!unit.name) throw new Error("Unit name is required")
	if(!unit.type) throw new Error(`Unit type is required for unit: ${unit.name}`)
	
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
			name: unit.name,
			org: unit.org
		})
		logger.log(`Creating ${newUnit.typeName} - ${newUnit.displayName}`)
	}
	for(const user of unit.users || []) {
		let newUser
		if(user.linkExisting) {
			newUser = await User.findOne({
				name: {
					first: user.name[0],
					last: user.name[1]
				}
			})
			if(!newUser) {
				throw new Error(`Linked user not found: ${user.name.join(" ")}`)
			}
		} else if(user.generate) {
			await generateUsers(newUnit, user.generate, user.role)
		} else {
			newUser = new User({
				org: user.org
			})
			if(Array.isArray(user.name)) {
				newUser.name.first = user.name[0]
				newUser.name.last = user.name[1]
			} else if(user.name) {
				newUser.name.first = user.name
			}
		}
		await newUnit.setRole(newUser, user.role)
		if(user.generateAccessCode) {
			const accessCode = await newUser.generateAccessCode()
			logger.log(`${newUser.displayName}'s access code:`, accessCode)
		}
	}
	if(Defaults.generateUsers[newUnit.type]) {
		await generateUsers(newUnit, Defaults.generateUsers[newUnit.type])
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
		await createUnit(Defaults.unit)
		logger.log("Complete!")
	} catch(error) {
		logger.log("Error!\n", error)
		const database = await import("modules/database")
		await database.clear()
	}
}