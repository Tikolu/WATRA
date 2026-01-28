import Config from "modules/config.js"
import * as Text from "modules/text.js"

export default class {
	_id = false

	entries = [
		class {
			title = String
			category = {
				type: String,
				enum: Config.medicalCategories.map(c => c.id)
			}
			symptoms = {
				type: String,
				trim: true
			}
			solutions = {
				type: String,
				trim: true
			}
		}
	]

	/** Finds a medical entry */
	findEntry(category, title, index=false) {
		title = Text.id(title)
		for(const entryIndex in this.entries) {
			const entry = this.entries[entryIndex]
			if(entry.category != category) continue
			if(Text.id(entry.title) != title) continue
			if(index) return entryIndex
			return entry
		}
		if(index) return -1
	}
			
	/** Updates a medical entry */
	async updateEntry(category, title, symptoms, solutions) {
		category = category.trim().toLowerCase()
		title = title.trim()
		if(!title) return
		
		const entry = this.findEntry(category, title)

		// Update existing entry
		if(entry) {
			if(symptoms) entry.symptoms = symptoms
			if(solutions) entry.solutions = solutions

		// Create new entry
		} else {
			// Attempt to find title from medical data
			const categoryData = Config.medicalCategories.find(c => c.id == category)
			if(!categoryData) throw Error("Nieznana kategoria")

			const entryID = Text.id(title)
			const elementData = categoryData.elements.find(e => Text.id(e.title) == entryID)
			title = elementData?.title || title

			this.entries.push({category, title, symptoms, solutions})
		}
		
		// Save user
		await this.parent().save()
	}

	/** Removes a medical entry */
	async removeEntry(category, title) {
		category = category.trim().toLowerCase()
		title = title.trim()
		
		const entryIndex = this.findEntry(category, title, true)
		if(entryIndex < 0) return

		this.entries.splice(entryIndex, 1)
		
		// Save user
		await this.parent().save()
	}

	/** Generates categories for displaying */
	displayCategories(editable) {
		const displayCategories = []
		
		for(const category of Config.medicalCategories) {
			const categoryElements = []
			for(const element of category.elements) {
				// Get user entry for this element
				const userEntry = this.findEntry(category.id, element.title)
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
			for(const userEntry of this.entries) {
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

		return displayCategories
	}

	/** Checks if any details are missing */
	get complete() {
		for(const entry of this.entries) {
			if(!entry.symptoms) return false
			if(!entry.solutions) return false
		}

		return true
	}
}