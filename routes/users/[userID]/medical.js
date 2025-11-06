import html from "modules/html.js"
import * as Text from "modules/text.js"

import { medicalCategories } from "modules/medical.js"
import HTTPError from "modules/server/error.js"

export default async function({user, targetUser}) {
	// Check permissions
	await user.checkPermission(targetUser.PERMISSIONS.EDIT)
	await user.checkPermission(targetUser.PERMISSIONS.APPROVE)

	const editable = user.hasPermission(targetUser.PERMISSIONS.EDIT) && !targetUser.medical.confirmed

	const displayCategories = []

	// Go through all categories
	for(const category of medicalCategories) {
		const categoryElements = []
		for(const element of category.elements) {
			// Get user entry for this element
			const userEntry = targetUser.medical.findEntry(category.id, element.title)
			// Skip if no entry and not editable
			if(!userEntry && !editable) continue
			categoryElements.push({
				id: Text.id(element.title),
				title: element.title,
				description: element.description,
				selected: !!userEntry,
				symptoms: userEntry?.symptoms,
				solutions: userEntry?.solutions
			})
		}
		// Look for "other" elements in this category
		for(const userEntry of targetUser.medical.entries) {
			if(userEntry.category != category.id) continue
			const id = Text.id(userEntry.title)
			if(categoryElements.some(e => e.id == id)) continue
			categoryElements.push({
				id,
				title: userEntry.title,
				description: "",
				selected: true,
				symptoms: userEntry.symptoms,
				solutions: userEntry.solutions
			})
		}
		// If not editable, skip empty category
		if(!categoryElements.length && !editable) continue
		displayCategories.push({
			id: category.id,
			title: category.title,
			other: category.other,
			symptoms: category.symptoms,
			solutions: category.solutions,
			elements: categoryElements
		})
	}

	return html("user/medical", {
		user,
		targetUser,
		displayCategories,
		editable
	})
}