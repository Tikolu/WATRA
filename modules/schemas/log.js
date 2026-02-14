import mongoose from "mongoose"

import randomID from "modules/randomID.js"

const eventTypes = {
	"logout": "Wylogowano",
	"login/accessCode": "Zalogowano przy użyciu kodu",
	"login/verify": "Zalogowano przy użyciu klucza",
	"login/getKeys": "Zalogowano",
	"logError": "Error w przeglądarce",

	"passkey/create": "Rozpoczęto tworzenie klucza",
	"passkey/save": "Zapisano klucz",
	"passkey/*/delete": "Usunięto klucz",

	"user/*/update/*": "Zaktualizowano dane użytkownika $USER",
	"user/*/accessCode/generate": "Wygenerowano kod rejestracyjny dla $USER",
	"user/*/delete": "Usunięto $USER",
	"user/*/confirm": "Zatwierdzono dane $USER",
	"user/*/unconfirm": "Cofnięto zatwierdzenie danych $USER",
	"user/*/parent/create": "Utworzono rodzica dla $USER",
	"user/*/parent/link": "Dodano rodzica do $USER",
	"user/*/medical/*": "Edytowano dane medyczne $USER",
	"user/*/archive": "Zarchiwizowano $USER",
	"user/*/unarchive": "Cofnięto archiwizację $USER",

	"signature/verify": "Podpisano",

	"unit/*/update/*": "Zaktualizowano dane jednostki $UNIT",
	"unit/*/delete": "Usunięto jednostkę $UNIT",
	"unit/*/member/add": "Dodano użytkowników do $UNIT",
	"unit/*/member/create": "Utworzono użytkownika w $UNIT",
	"unit/*/member/remove": "Usunięto użytkownika z $UNIT",
	"unit/*/member/setRole": "Ustawiono funkcję w $UNIT",
	"unit/*/subUnit/create": "Utworzono jednostkę w $UNIT",
	"unit/*/subUnit/link": "Dodano jednostkę do $UNIT",
	"unit/*/subUnit/*/remove": "Usunięto jednostkę z $UNIT",
	"unit/*/event/create": "Utworzono akcję w $UNIT",
	"unit/*/event/*/invitation/accept": "Zaakceptowano zaproszenie $UNIT na $EVENT",
	"unit/*/event/*/invitation/decline": "Odrzucono zaproszenie $UNIT na $EVENT",
	"unit/*/event/*/setParticipants": "Ustawiono uczestników z $UNIT na $EVENT",

	"event/*/update/*": "Zaktualizowano dane akcji $EVENT",
	"event/*/delete": "Usunięto akcję $EVENT",
	"event/*/approval/approve": "Zatwierdzono $EVENT",
	"event/*/approval/unapprove": "Cofnięto zatwierdzenie $EVENT",
	"event/*/unit/*/invite": "Zaproszono $UNIT na $EVENT",
	"event/*/unit/*/uninvite": "Cofnięto zaproszenie $UNIT na $EVENT",
	"event/*/file/add": "Dodano dokument do $EVENT",
	"event/*/file/*/delete": "Usunięto dokument z $EVENT",
	"event/*/member/*/invite": "Zaproszono $USER na $EVENT",
	"event/*/member/*/setParticipation": "Ustawiono uczestnictwo $USER na $EVENT",
	"event/*/member/*/setRole": "Ustawiono funkcję $USER na $EVENT",
	"event/*/setUpperUnits": "Zmieniono jednostki nadrzędne $EVENT"
}

const types = {}
for(const eventType in eventTypes) {
	const type = {
		description: eventTypes[eventType]
	}
	if(eventType.includes("*")) {
		const pattern = new RegExp(`^${eventType.replaceAll("*", "[^\\/]+")}$`)
		type.pattern = pattern
	}
	types[eventType] = type
}

export class LogClass {
	/* * Static methods * */
	static eventTypes = types
	
	static dateToID(date) {
		date = new Date(date).getTime()
		return date.toString(36)
	}

	static formatDescription(description, targetUser, targetUnit, targetEvent) {
		description = description.replace("$USER", targetUser || "(użytkownik)")
		description = description.replace("$UNIT", targetUnit || "(jednostka)")
		description = description.replace("$EVENT", targetEvent || "(akcja)")

		return description
	}
	
	/* * Properties * */
	_id = {
		type: String,
		default: () => LogClass.dateToID(Date.now()) + randomID(4),
	}
	
	user = {
		type: String,
		ref: "User"
	}

	eventType = {
		type: String,
		required: true
	}

	targetUser = {
		type: String,
		ref: "User"
	}

	targetUnit = {
		type: String,
		ref: "Unit"
	}

	targetEvent = {
		type: String,
		ref: "Event"
	}

	data = {}

	ip = String
	agent = String


	/* * Getters * */
	get time() {
		const time = Number.parseInt(this.id.slice(0, -4), 36)
		return new Date(time)
	}
	
	get description() {
		// If log has error data, user error message as description
		if(this.data?.error?.message) return this.data.error.message
		
		// Attempt to find exact match
		let text = LogClass.eventTypes[this.eventType]?.description || ""

		// Search for pattern match
		if(!text) {
			for(const type in LogClass.eventTypes) {
				const {pattern, description} = LogClass.eventTypes[type]
				if(!pattern?.test(this.eventType)) continue
				text = description
				break
			}
		}

		// Return formatted description
		if(text) return LogClass.formatDescription(text,
			this.targetUser?.displayName || this.targetUser,
			this.targetUnit?.displayName || this.targetUnit,
			this.targetEvent?.displayName || this.targetEvent
		)
		
		// Fallback to event type
		return `(${this.eventType})`
	}
}

const schema = mongoose.Schema.fromClass(LogClass)

schema.permissions = {
	async ACCESS(user) {
		await this.populate(["targetUser", "targetUnit", "targetEvent", "user"], {placeholders: false})
		
		if(this.user && await user.checkPermission(this.user.PERMISSIONS.ACCESS)) return true
		
		if(this.targetUser && await user.checkPermission(this.targetUser.PERMISSIONS.ACCESS)) return true
		if(this.targetUnit && await user.checkPermission(this.targetUnit.PERMISSIONS.ACCESS)) return true
		if(this.targetEvent && await user.checkPermission(this.targetEvent.PERMISSIONS.ACCESS)) return true
		
		return false
	}
}

export default mongoose.model("Log", schema)