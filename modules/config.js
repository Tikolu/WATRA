import { Logger } from "./logger.js"

// Global config object
const Config = {}

// Tag types
Config.tags = {
	"public": {},			

	"editUnit": {},
	"manageSubUnit": {},
	"setRole": {},

	"accessUser": {},
	"manageUser": {},

	"manageEvent": {},
	"accessActivity": {},
	"manageEventInvite": {},
	"approveEvent": {},

	"listReports": {}
}

const logger = new Logger("Config", 33)

class ConfigError extends Error {
	constructor(message) {
		super(message)
		this.name = "ConfigError"
	}
}

function processName(entity) {
	// Default to entity id
	entity.name ||= entity.id
	
	// Convert to object
	if(typeof entity.name == "string") {
		entity.name = {default: entity.name}
	}

	// Default name variant
	entity.name.default ||= entity.name[Object.keys(entity.name)[0]]
}

function processDefaultRole(unit) {
	// Ensure roles exist
	for(const roleName of unit.roles || []) {
		if(!Config.roles[roleName]) {
			throw new ConfigError(`Unit "${unit.id}" references unknown role "${roleName}"`)
		}
	}
	
	// Default defaultRole is role with lowest rank
	if(!unit.defaultRole && unit.roles?.length) {
		let defaultRole = ["", Infinity]
		for(const roleName of unit.roles) {
			const roleType = Config.roles[roleName]
			if(roleType[1] > defaultRole[1]) continue
			defaultRole = [roleName, roleType.rank]
		}
		unit.defaultRole = defaultRole[0]
	}

	// Ensure defaultRole exists in unit roles
	if(unit.defaultRole && !unit.roles.includes(unit.defaultRole)) {
		throw new ConfigError(`Unit "${unit.id}" has invalid defaultRole "${unit.defaultRole}"`)
	}
}

for await(const file of Deno.readDir("config")) {
	const {default: json} = await import(`../config/${file.name}`, {with: {type: "json"}})

	logger.log(`Loaded config ${file.name}`)

	for(const key in json) {
		if(key in Config) {
			// Merge duplicate keys
			if(typeof Config[key] == "object" && typeof json[key] == "object") {
				Config[key] = {...Config[key], ...json[key]}
			} else if(Config[key] != json[key]) {
				throw new ConfigError(`Duplicate config key "${key}" in file "${file.name}"`)
			}

		} else {
			Config[key] = json[key]
		}
	}
}


// Process orgs
Config.orgs ||= {}
for(const orgID in Config.orgs) {
	const org = Config.orgs[orgID]

	// Prevent invalid org name
	if(orgID == "default") {
		throw new ConfigError("Invalid org ID \"default\"")
	}

	// Default values
	org.id = orgID
	org.name ||= orgID
}

// Process roles
for(const roleID in Config.roles) {
	const role = Config.roles[roleID]
	
	// Prevent invalid role nname
	if(roleID == "remove") {
		throw new ConfigError("Invalid role ID \"remove\"")
	}
	
	// Default values
	role.id = roleID
	role.tags ||= []
	role.rank ||= 0

	processName(role)

	// Ensure tags exist
	for(const tag of role.tags) {
		if(!(tag in Config.tags)) {
			throw new ConfigError(`Role "${roleID}" has unknown tag "${tag}"`)
		}
	}	
}

// Process departments
Config.departments ||= {}
for(const departmentID in Config.departments) {
	const department = Config.departments[departmentID]

	// Default values
	department.id = departmentID
	
	processName(department)
}

// Process units
for(const unitID in Config.units) {
	const unit = Config.units[unitID]

	// Default values
	unit.id = unitID
	unit.rank ||= 0
	unit.maxUpperUnits ||= 1
	unit.roles ||= []
	
	processName(unit)

	processDefaultRole(unit)

	// Default eventRules
	unit.eventRules ||= {
		create: true,
		invite: true,
		link: true
	}
}


// Process event config
if(!Config.event) {
	throw new ConfigError("Missing event config")
}
Config.event.roles ||= []
Config.event.topUnitTypes ||= Object.keys(Config.units)[0]

// Ensure roles exist
for(const roleName of Config.event.roles || []) {
	if(!Config.roles[roleName]) {
		throw new ConfigError(`Event config references unknown role "${roleName}"`)
	}
}

processDefaultRole(Config.event)


// Other defaults
Config.news ||= []
Config.passkeyRequired ??= true


export default Config