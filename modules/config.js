import config from "../config.json" with { type: "json" }

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

// Process orgs
config.orgs ||= {}
for(const orgID in config.orgs) {
	const org = config.orgs[orgID]

	// Prevent invalid org name
	if(orgID == "default") {
		throw new ConfigError("Invalid org ID \"default\"")
	}

	// Default values
	org.id = orgID
	org.name ||= orgID
}

// Process roles
for(const roleID in config.roles) {
	const role = config.roles[roleID]
	
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
		if(!(tag in config.tags)) {
			throw new ConfigError(`Role "${roleID}" has unknown tag "${tag}"`)
		}
	}	
}

// Process departments
config.departments ||= {}
for(const departmentID in config.departments) {
	const department = config.departments[departmentID]

	// Default values
	department.id = departmentID
	
	processName(department)
}

// Process units
for(const unitID in config.units) {
	const unit = config.units[unitID]

	// Default values
	unit.id = unitID
	unit.rank ||= 0
	
	processName(unit)

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

// Ensure roles exist
for(const roleName of config.event.roles || []) {
	if(!config.roles[roleName]) {
		throw new ConfigError(`Event config references unknown role "${roleName}"`)
	}
}


// console.log(config)
export default config