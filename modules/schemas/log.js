import mongoose from "mongoose"

import randomID from "modules/randomID.js"

const eventTypes = {
	"logout": "Wylogowano",
	"login/accessCode": "Zalogowano przy użyciu kodu",
	"login/verify": "Zalogowano przy użyciu klucza",
	"login/getKeys": "Zalogowano",
	"logError": "Error w przeglądarce",
	"report/submit": "Przesłano opinię",

	"passkey/create": "Rozpoczęto tworzenie klucza",
	"passkey/save": "Zapisano klucz",
	"passkey/*/delete": "Usunięto klucz",

	"user/*/update/*": "Zaktualizowano dane użytkownika $USER",
	"user/*/accessCode/generate": "Wygenerowano kod rejestracyjny dla $USER",
	"user/*/delete": "Usunięto użytkownika",
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
	"unit/*/event/*/invitation/decline": "Odrzucono zaproszenie $UNIT na $EVENT",
	"unit/*/event/*/setParticipants": "Ustawiono uczestników z $UNIT na $EVENT",

	"event/*/update/*": "Zaktualizowano dane akcji $EVENT",
	"event/*/delete": "Usunięto akcję",
	"event/*/approval/approve": "Zatwierdzono $EVENT",
	"event/*/approval/unapprove": "Cofnięto zatwierdzenie $EVENT",
	"event/*/unit/*/invite": "Zaproszono $UNIT na $EVENT",
	"event/*/unit/*/uninvite": "Cofnięto zaproszenie $UNIT na $EVENT",
	"event/*/file/add": "Dodano dokument do $EVENT",
	"event/*/file/*/delete": "Usunięto dokument z $EVENT",
	"event/*/member/*/invite": "Zaproszono $USER na $EVENT",
	"event/*/member/*/setParticipation": "Ustawiono uczestnictwo $USER na $EVENT",
	"event/*/member/*/setRole": "Ustawiono funkcję $USER na $EVENT",
	"event/*/setUpperUnits": "Zmieniono jednostki nadrzędne $EVENT",
	"event/*/registration/enable": "Włączono zapisy na $EVENT",
	"event/*/registration/disable": "Wyłączono zapisy na $EVENT",

	"form/create": "Utworzono formularz $FORM",
	"form/*/delete": "Usunięto formularz",
	"form/*/update/*": "Zmieniono ustawienia formularza $FORM",
	"form/*/response/*/payment/start": "Rozpoczęto płatność za formularz $FORM",
	"form/*/response/*/submit": "Wysłano odpowiedź na formularz $FORM"
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

	static formatDescription(description, targetUser, targetUnit, targetEvent, targetForm) {
		description = description.replace("$USER", targetUser || "(użytkownik)")
		description = description.replace("$UNIT", targetUnit || "(jednostka)")
		description = description.replace("$EVENT", targetEvent || "(akcja)")
		description = description.replace("$FORM", targetForm || "(formularz)")

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

	targetForm = {
		type: String,
		ref: "Form"
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
			this.targetEvent?.displayName || this.targetEvent,
			this.targetForm?.displayName || this.targetForm
		)
		
		// Fallback to event type
		return `(${this.eventType})`
	}
}

const schema = mongoose.Schema.fromClass(LogClass)

schema.permissions = {
	async ACCESS(user) {
		const fields = ["user", "targetUser", "targetUnit", "targetEvent", "targetForm"]
		
		for(const field of fields) {
			await this.populate(field, {placeholders: false})
			if(this[field] && await user.checkPermission(this[field].PERMISSIONS.ACCESS)) return true
		}
		
		return false
	}
}

export default mongoose.model("Log", schema)