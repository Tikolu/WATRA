import * as CSV from "csv"

import User from "modules/schemas/user"
import Unit from "modules/schemas/unit"
import { Logger } from "modules/logger.js"

const logger = new Logger("Import", 36)

const accessCodeExpiry = 1000 * 60 * 60 * 48

async function createUser(user) {
	if(Array.isArray(user.name)) {
		user.firstName = user.name[0]
		user.lastName = user.name[1]
	} else if(user.name) {
		user.firstName = user.name
	}
	
	const newUser = new User({
		_id: user.id,
		org: user.org,
		name: {
			first: user.firstName || "",
			last: user.lastName || ""
		},
		phone: user.phone,
		email: user.email
	})
	logger.log(`Creating ${newUser.displayName}`)
	await newUser.save()

	for(const role of user.roles || []) {
		const unit = await Unit.findOne({ name: role.unit })
		if(!unit) {
			throw new Error(`Unit not found for role assignment: ${role.unit}`)
		}
		logger.log(`Adding ${newUser.displayName} to ${unit.displayName} as ${role.role}`)
		await unit.setRole(newUser, role.role)
	}
	
	if(user.generateAccessCode) {
		const accessCode = await newUser.auth.generateAccessCode(accessCodeExpiry)
		logger.log(`${newUser.displayName}'s access code:`, accessCode, `(expires in ${accessCodeExpiry / 1000} seconds)`)
	}
	return newUser
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
		} else {
			newUser = await createUser(user)
		}
		logger.log(`Adding ${newUser.displayName} to ${newUnit.displayName} as ${user.role}`)
		await newUnit.setRole(newUser, user.role)
	}
	for(const subUnit of unit.subUnits || []) {
		const newSubUnit = await createUnit(subUnit)
		await newUnit.addSubUnit(newSubUnit)
	}
	await newUnit.save()
	return newUnit
}

export async function setup(file) {
	const importData = {}
	logger.log("Starting...")
	
	const text = await Deno.readTextFile(file)
	if(file.endsWith(".csv")) {
		const data = CSV.parse(text, {
			skipFirstRow: true
		})
		for(const user of data) {
			let roleIndex = 1
			user.roles = []
			while(user[`unit${roleIndex}`]) {
				user.roles.push({
					unit: user[`unit${roleIndex}`],
					role: user[`role${roleIndex}`]
				})
				roleIndex += 1
			}
			const newUser = await createUser(user)
		}

	} else if(file.endsWith(".json")) {
		const data = JSON.parse(text)
		
		for(const unit of data.units || []) await createUnit(unit)
		for(const user of data.users || []) await createUser(user)

	} else {
		throw new Error("Unsupported import file: " + file)
	}
	
	logger.log("Complete!")
}