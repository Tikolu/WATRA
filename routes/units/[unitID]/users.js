import html from "modules/html.js"

import * as Text from "modules/text.js"

import {
	FilterCategory,
	AgeFilterCategory,
	FormFilterCategory,

	ColumnCategory,
	FormColumnCategory,
	PersonalDetailsColumnCategory,

	loadFilterValues,
	loadColumnValues
} from "modules/userTable.js"
import Config from "modules/config.js";


export default async function({user, targetUnit}) {
	await user.requirePermission(targetUnit.PERMISSIONS.ACCESS_MEMBERS)
	
	const archivedUsers = []
	await targetUnit.populate("forms")

	// Create filters
	const filterCategories = [
		new AgeFilterCategory(),
		new FilterCategory({
			name: "Dane użytkownika",
			icon: "user_attributes",
			filters: [
				{
					id: "archived",
					name: "Stan użytkownika",
					options: [
						{value: "archived", name: "Zarchiwizowani"},
						{value: "active", name: "Aktywni"}
					],
					default: "active",
					async verify(value) {
						// Load archived users
						if(value != "active") {
							for await(const unit of targetUnit.traverse("subUnits", {includeSelf: true})) {
								await unit.populate("archivedUsers")
								archivedUsers.push(...unit.archivedUsers)
							}
						}
						return value
					},
					callback(targetUser) {
						if(this.value == "archived") return targetUser.archived
						else if(this.value == "active") return !targetUser.archived
					}
				}
			]
		}),
		...targetUnit.forms.map(form => new FormFilterCategory(form))
	]

	// Insert org filter
	if(!targetUnit.org) {
		filterCategories[1].filters.push({
			id: "org",
			name: "Organizacja",
			options: Object.entries(Config.orgs).map(([id, org]) => ({value: id, name: org.name})),
			callback(targetUser) {
				return !this.value || targetUser.org == this.value
			}
		})
	}

	// Load filter values
	const filterError = await loadFilterValues(filterCategories, this.routeData)

	// Load users and apply filters
	const users = []
	if(!filterError) {
		// Skip loading in archived mode
		const allUsers = filterCategories[1].filters[0].value == "active" ?
			await targetUnit.listMembers(true).toArray() :
			archivedUsers

		for(const user of allUsers.unique("id")) {
			let filtered = false
			for(const filter of filterCategories.flatMap(c => c.filters)) {
				if(!await filter.callback(user)) {
					filtered = true
					break
				}
			}
			if(!filtered) users.push(user)
		}

		// Sort users by name
		users.sort((a, b) => a.displayName.localeCompare(b.displayName))
	}

	// Create columns
	const columnCategories = [
		new PersonalDetailsColumnCategory(users),
		new ColumnCategory({
			name: "Jednostki",
			icon: "groups",
			columns: [
				{
					id: "roles",
					name: "Funkcje",
					async process() {
						await users.populate({"roles": "unit"})
					}
				}
			]
		}),
		...targetUnit.forms.map(form => new FormColumnCategory(form))
	]

	// Insert org column
	if(!targetUnit.org) {
		columnCategories[1].columns.push({
			id: "org",
			name: "Organizacja",
			value: u => Config.orgs[u.org]?.name
		})
	}

	// Load column values
	await loadColumnValues(columnCategories, this.routeData)

	return html("user/list/page", {
		user,
		targetUnit,
		users,
		filterCategories,
		columnCategories,
		filterError
	})
}