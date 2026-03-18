import html from "modules/html.js"
import HTTPError from "modules/server/error.js"
import * as datetime from "datetime"
import Config from "modules/config.js"

import * as Text from "modules/text.js"

import {
	FilterCategory,
	AgeFilterCategory,
	FormFilterCategory,
	
	ColumnCategory,
	PersonalDetailsColumnCategory,
	FormColumnCategory,
	
	loadFilterValues,
	loadColumnValues,
	sortUsers
} from "modules/userTable.js"


export default async function({user, targetEvent}) {
	// Load units
	await targetEvent.populate({
		"invitedUnits": "unit",
		"forms": {}
	})

	const eventOrg = await targetEvent.getOrg()

	// List unit options
	const unitOptions = []
	await user.checkPermission(targetEvent.PERMISSIONS.ACCESS_PARTICIPANTS)
	for(const invitedUnit of targetEvent.invitedUnits) {
		if(	!user.hasPermission(targetEvent.PERMISSIONS.ACCESS_PARTICIPANTS) &&
			!await user.checkPermission(invitedUnit.unit.PERMISSIONS.MANAGE_INVITES)) continue
		unitOptions.push(invitedUnit.unit)
	}
	if(targetEvent.invitedUnits.length > 0 && unitOptions.length == 0) throw new HTTPError(403)

	// Create filters
	const filterCategories = [
		new FilterCategory({
			name: "Uczestnictwo",
			icon: "people",
			filters: [
				{
					id: "participation",
					name: "Stan zapisu",
					options: [
						{value: "accepted", name: "Zaakceptowane"},
						{value: "declined", name: "Odrzucone"},
						{value: "pending", name: "Brak odpowiedzi"}
					],
					callback(targetUser) {
						return !this.value || targetUser.$locals.participant.state == this.value
					}
				},

				{
					id: "unit",
					name: "Jednostka",
					options: unitOptions.map(u => ({value: u.id, name: u.displayName})),
					async verify(value) {
						if(value == "no-unit") {
							await user.requirePermission(targetEvent.PERMISSIONS.ACCESS_PARTICIPANTS)
						} else {
							// Ensure access permissions for the selected unit
							if(!unitOptions.hasID(value)) throw new HTTPError(403, "Brak dostępu do tej jednostki")
						}
						return value
					},
					callback(targetUser) {
						// If user cannot access participants, they can only filter by their own unit
						if(!user.hasPermission(targetEvent.PERMISSIONS.ACCESS_PARTICIPANTS) && !unitOptions.hasID(targetUser.$locals.participant.originUnit?.id)) return false
						return !this.value || targetUser.$locals.participant.originUnit?.id == this.value || (this.value == "no-unit" && !targetUser.$locals.participant.originUnit)
					}
				},

				{
					id: "role",
					name: "Funkcja w akcji",
					verify: async value => {
						await targetEvent.populate("roles")
						return value
					},
					options: [
						{value: "no-role", name: "Bez funkcji"},
						{value: "role", name: "Z funkcją"}
					],
					callback(targetUser) {
						if(!this.value) return true
						const hasRole = targetEvent.roles.some(r => r.user.id == targetUser.id)
						return this.value == "role" ? hasRole : !hasRole
					}
				}
			]
		}),
		new AgeFilterCategory(),
		...targetEvent.forms.map(form => new FormFilterCategory(form))
	]

	// Add "no-unit" option
	if(await user.checkPermission(targetEvent.PERMISSIONS.ACCESS_PARTICIPANTS)) {
		filterCategories[0].filters[1].options.unshift({value: "no-unit", name: "(brak)"})
	}

	// Insert org filter
	if(!eventOrg) {
		filterCategories[0].filters.push({
			id: "org",
			name: "Organizacja",
			options: Object.entries(Config.orgs).map(([id, org]) => ({value: id, name: org.name})),
			callback(targetUser) {
				return !this.value || !targetUser.org || targetUser.org == this.value
			}
		})
	}

	// Load filter values
	const filterError = await loadFilterValues(filterCategories, this.routeData)

	// Load participants and apply filters
	const users = []
	if(!filterError) {
		await targetEvent.participants.populate(
			["user", "originUnit"],
			{known: unitOptions}
		)
		for(const participant of targetEvent.participants) {
			participant.user.$locals.participant = participant
			
			let filtered = false
			for(const filter of filterCategories.flatMap(c => c.filters)) {
				if(!await filter.callback(participant.user)) {
					filtered = true
					break
				}
			}
			if(!filtered) users.push(participant.user)
		}
	}


	// Create columns
	const permissionCheck = u => targetEvent.participants.id(u.id)?.state == "accepted"
	const columnCategories = [
		new ColumnCategory({
			name: "Uczestnictwo",
			icon: "people",
			columns: [
				{
					id: "participation",
					name: "Stan zapisu",
					default: true,
					value(targetUser) {
						const state = targetUser.$locals.participant.state
						if(state == "accepted") {
							return "Zaakceptowano"
						} else if(state == "pending") {
							return "Brak odpowiedzi"
						} else if(state == "declined") {
							return "Odrzucono"
						}
					},
					sortable: true
				},
				{
					id: "unit",
					name: "Jednostka",
					default: true,
					value: u => u.$locals.participant.originUnit?.displayName,
					sortable: true
				},
				{
					id: "participationTime",
					name: "Czas zapisu",
					value: u => u.$locals.participant.signature?.time && datetime.format(u.$locals.participant.signature?.time, "yyyy-MM-dd HH:mm"),
					sortable: true
				},
				{
					id: "role",
					name: "Funkcja w akcji",
					default: true,
					process: async () => await targetEvent.populate({"roles": "user"}),
					value: u => targetEvent.roles.find(r => r.user.id == u.id)?.displayName,
					sortable: true
				}
			]
		}),
		new PersonalDetailsColumnCategory(users, permissionCheck),
		...targetEvent.forms.map(form => new FormColumnCategory(form))
	]

	// Insert org column
	if(!eventOrg) {
		columnCategories[0].columns.splice(2, 0, {
			id: "org",
			name: "Organizacja",
			value: u => Config.orgs[u.org]?.name
		})
	}

	// Insert age column
	if(targetEvent.dates.start) {
		columnCategories[1].columns[1].name = "Wiek (dzisiaj)"
		columnCategories[1].columns.splice(2, 0, {
			id: "event.age",
			name: "Wiek (w dniu akcji)",
			value: targetUser => {
				if(!targetUser.dateOfBirth || targetEvent.dates.start < targetUser.dateOfBirth) return false
				const {years} = datetime.difference(targetUser.dateOfBirth, targetEvent.dates.start)
				return years
			},
			sortable: true
		})
	}

	// Load column values
	await loadColumnValues(columnCategories, this.routeData)

	// Sort users
	const sort = await sortUsers(users, columnCategories, this.routeData.sort)

	return html("user/list/page", {
		user,
		targetUnit: targetEvent,
		users,
		filterCategories,
		columnCategories,
		filterError,
		sort,
		title: "Uczestnicy"
	})
}