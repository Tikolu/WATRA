import * as datetime from "datetime"
import * as Text from "modules/text.js"

export class UserFilter {
	static numericOperations = ["equal", "greater", "less"]
	static properties = ["id", "name", "options", "type", "verify", "callback", "default"]
	
	constructor(options={}) {
		for(const key of UserFilter.properties) {
			this[key] = options[key]
		}
		
		if(this.options) this.type = "select"
		if(this.type == "age") {
			this.min = 0
			this.max = 200
		}
		
		this.value = null
	}

	async setValue(value) {
		let valid = true

		if(this.verify) value = await this.verify(value)

		if(this.type == "select" && !this.options.some(o => o.value == value)) valid = false
		else if(this.type == "age") {
			let [operation, age, date] = value.split(",")
			if(!UserFilter.numericOperations.includes(operation)) valid = false
			else if(isNaN(age) || age < this.min || age > this.max) valid = false
			else if(age == 0 && operation == "less") valid = false

			date = new Date(date)
			if(!(date >= MIN_DATE && date <= MAX_DATE)) valid = false

			value = [operation, age, date]
		}
		else if(this.type == "checkbox") {
			if(value != "true") valid = false
		}
		
		if(!valid) throw new Error(`Nieprawidłowa wartość filtra "${this.name}"`)

		this.value = value
	}
}

export class FilterCategory {
	constructor(options={}) {
		this.name = options.name
		this.icon = options.icon
		this.filters = options.filters || []

		this.mapFilters()
	}

	mapFilters() {
		this.filters = this.filters.map(f => {
			if(f instanceof UserFilter) return f
			else return new UserFilter(f)
		})
		return this.filters
	}
}

export class FormFilterCategory extends FilterCategory {
	constructor(form) {
		super({
			name: form.displayName,
			icon: "ballot",
			filters: [
				{
					id: `form.${form.id}.response`,
					name: `Odpowiedź`,
					options: [
						{value: "submitted", name: "Wysłana"},
						{value: "required", name: "Oczekiwana"}
					],
					async callback(user) {
						if(!this.value) return true

						// Load all responses
						form.$locals.responses ||= await form.getUserResponses(null, {submitted: true})
						const hasResponse = form.$locals.responses.some(r => r.user.id == user.id)
						if(this.value == "submitted") {
							return hasResponse
						} else if(this.value == "required") {
							if(!form.config.requireResponse) return false
							if(hasResponse) return false
							return form.userFilter(user)
						}
					}
				}
			]
		})
	}
}

export class AgeFilterCategory extends FilterCategory {
	constructor() {
		super({
			name: "Wiek",
			icon: "calendar_month",
			filters: [
				{
					id: "age",
					name: "Wiek",
					type: "age",
					callback(user) {
						if(!this.value) return true

						if(!user.dateOfBirth || this.value[2] < user.dateOfBirth) return false
						const {years} = datetime.difference(user.dateOfBirth, this.value[2])
						if(this.value[0] == "equal") return years == this.value[1]
						else if(this.value[0] == "greater") return years > this.value[1]
						else if(this.value[0] == "less") return years < this.value[1]
					}
				}
			]
		})
	}
}

export class ColumnCategory {
	constructor(options={}) {
		this.name = options.name
		this.icon = options.icon
		this.columns = options.columns || []

		this.mapColumns()
	}

	mapColumns() {
		this.columns = this.columns.map(f => {
			if(f instanceof DataColumn) return f
			else return new DataColumn(f)
		})
		return this.columns
	}
}

export class DataColumn {
	constructor(options={}) {
		this.id = options.id
		this.name = options.name
		this.default = options.default
		this.value = options.value
		this.process = options.process
		this.selected = false
	}

	async setSelected(selectedList) {
		if(selectedList.includes(this.id)) this.selected = true
		else if(!selectedList.length && this.default) this.selected = true

		if(this.selected) await this.process?.()
	}
}

export class PersonalDetailsColumnCategory extends ColumnCategory {
	constructor(users) {
		super({
			name: "Dane osobowe",
			icon: "assignment",
			columns: [
				{
					id: "dob",
					name: "Data urodzenia",
					default: true,
					value(targetUser) {
						if(targetUser.dateOfBirth) {
							return formatDate(targetUser.dateOfBirth)
						}
					}
				},
				{
					id: "age",
					name: "Wiek",
					default: true,
					value(targetUser) {
						if(targetUser.dateOfBirth) {
							return targetUser.age
						}
					}
				},
				{
					id: "phone",
					name: "Numer telefonu",
					value: u => Text.formatPhone(u.phone)
				},
				{
					id: "email",
					name: "Adres e-mail",
					value: u => u.email
				},
				{
					id: "contacts",
					name: "Kontakty alarmowe",
					async process() {
						await users.populate("parents")
					}
				},
				{
					id: "medical",
					name: "Dane medyczne / dietetyczne"
				}
			]
		})
	}
}

export class FormColumnCategory extends ColumnCategory {
	constructor(form) {
		super({
			name: form.displayName,
			icon: "ballot",
			columns: [
				{
					id: `form.${form.id}.response`,
					name: `Odpowiedź na "${form.displayName}"`,
					async process() {
						form.$locals.responses ||= await form.getUserResponses(null, {submitted: true})
					},
					value(targetUser) {
						const response = form.$locals.responses.find(r => r.user.id == targetUser.id)
						if(response?.submitted) {
							return "Wysłana"
						} else if(
							form.config.requireResponse &&
							form.userFilter(targetUser)
						) {
							return "Oczekiwana"
						}
					}
				}
			]
		})
	}
}

export async function loadFilterValues(filterCategories, routeData) {
	try {
		for(const filter of filterCategories.flatMap(c => c.mapFilters())) {
			if(filter.id in routeData) {
				await filter.setValue(routeData[filter.id])
			} else if(filter.default) {
				await filter.setValue(filter.default)
			}
		}
	} catch(error) {
		return error.message
	}
}

export async function loadColumnValues(columnCategories, routeData) {
	const selectedColumns = routeData.columns?.split(",") || []
	for(const column of columnCategories.flatMap(c => c.mapColumns())) {
		await column.setSelected(selectedColumns)
	}
}