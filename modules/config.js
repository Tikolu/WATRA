import config from "../config.json" with { type: "json" }

class ConfigError extends Error {
	constructor(message) {
		super(message)
		this.name = "ConfigError"
	}
}

// Tag types
config.tags = {
	"public": {},			

	"editUnit": {},
	"manageSubUnit": {},
	"setRole": {},

	"accessUser": {},
	"manageUser": {},
	"deleteUser": {},

	"manageEvent": {},
	"accessActivity": {},
	"manageEventInvite": {},
	"approveEvent": {},

	"cannotApproveEvent": {}
}

// Process roles
for(const roleID in config.roles) {
	const role = config.roles[roleID]
	
	// Deafult values
	role.id = roleID
	role.tags ||= []
	role.rank ||= 0
	role.name ||= roleID

	// Ensure tags exist
	for(const tag of role.tags) {
		if(!(tag in config.tags)) {
			throw new ConfigError(`Role "${roleID}" has unknown tag "${tag}"`)
		}
	}	
}

// Process units
for(const unitID in config.units) {
	const unit = config.units[unitID]
	unit.id = unitID

	// Ensure roles exist
	for(const roleName of unit.roles || []) {
		if(!config.roles[roleName]) {
			throw new ConfigError(`Unit "${unitID}" references unknown role "${roleName}"`)
		}
	}
	
	// Default defaultRole is role with lowest rank
	if(!unit.defaultRole && unit.roles?.length) {
		let defaultRole = ["", Infinity]
		for(const roleName of unit.roles) {
			const roleType = config.roles[roleName]
			if(roleType[1] > defaultRole[1]) continue
			defaultRole = [roleName, roleType.rank]
		}
		unit.defaultRole = defaultRole[0]
	}

	// Ensure defaultRole exists in unit roles
	if(unit.defaultRole && !unit.roles.includes(unit.defaultRole)) {
		throw new ConfigError(`Unit "${unitID}" has invalid defaultRole "${unit.defaultRole}"`)
	}

	// Default eventRules
	unit.eventRules ||= {
		create: true,
		invite: true,
		link: true
	}
}


// Process event config
if(!config.event) {
	throw new ConfigError("Missing event config")
}
config.event.roles ||= []
config.event.topUnitTypes ||= Object.keys(config.units)[0]


// console.log(config)
export default config