import { medicalCategories } from "modules/medical.js"
import * as Text from "modules/text.js"

export default class {
	_id = false

	confirmed = {
		type: Boolean,
		default: false
	}
	entries = [
		class {
			title = String
			category = {
				type: String,
				enum: medicalCategories.map(c => c.id)
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
		if(this.confirmed) throw Error("Dane medyczne są zatwierdzone")
		
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
			const categoryData = medicalCategories.find(c => c.id == category)
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
		if(this.confirmed) throw Error("Dane medyczne są zatwierdzone")
		
		category = category.trim().toLowerCase()
		title = title.trim()
		
		const entryIndex = this.findEntry(category, title, true)
		if(entryIndex < 0) return

		this.entries.splice(entryIndex, 1)
		
		// Save user
		await this.parent().save()
	}

	/** Confirms and locks medical info */
	async confirm() {
		if(this.confirmed) return
		for(const entry of this.entries) {
			if(!entry.symptoms) throw Error(`Brak opisu objawów dla "${entry.title}"`)
			if(!entry.solutions) throw Error(`Brak opisu zaleceń dla "${entry.title}"`)
		}
		this.confirmed = true
		
		// Save user
		await this.parent().save()
	}
	
	/** Removes confirmation and unlocks medical info */
	async unconfirm() {
		if(!this.confirmed) return
		this.confirmed = false

		// Save user
		await this.parent().save()
	}
}