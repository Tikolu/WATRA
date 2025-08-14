import mongoose from "mongoose"
import * as Text from "modules/text.js"
import * as datetime from "jsr:@std/datetime"

import Funkcja from "modules/schemas/funkcja.js"
import HTTPError from "modules/server/error.js"

import { JednostkaClass } from "modules/schemas/jednostka.js"
import { FunkcjaType, WyjazdoweFunkcjaNames } from "modules/types.js"

export class WyjazdClass extends JednostkaClass {
	/* * Properties * */

	upperJednostki = undefined
	subJednostki = undefined
	type = undefined
	wyjazdInvites = undefined

	dates = {
		start: {
			type: Date,
			min: MIN_DATE,
			max: MAX_DATE
		},
		end: {
			type: Date,
			min: MIN_DATE,
			max: MAX_DATE
		}
	}

	invitedJednostki = [
		class {
			jednostka = {
				type: String,
				ref: "Jednostka",
				deriveID: true
			}

			state = {
				type: String,
				enum: ["pending", "accepted", "declined"],
				default: "pending"
			}

			invitedUsers = [
				class {
					user = {
						type: String,
						ref: "User",
						deriveID: true
					}

					state = {
						type: String,
						enum: ["pending", "accepted", "declined"],
						default: "pending"
					}

					/** Alias for parent uninviteUsers method */
					async uninvite() {
						await this.parent().uninviteUsers(this.user)
					}

					/** Sets the invitation state for the user */
					async setState(state) {
						const targetWyjazd = this.ownerDocument()
						
						// Ignore existing state
						if(this.state === state) return

						this.state = state
						await targetWyjazd.save()

						await this.populate("user")

						// Set szeregowy funkcja for new participant
						if(state == "accepted") {
							await targetWyjazd.setFunkcja(this.user, 0)
						}

						// Remove funkcja if declined
						if(state == "declined") {
							const existingFunkcja = await this.user.getFunkcjaInJednostka(targetWyjazd)
							if(existingFunkcja) await existingFunkcja.delete()
						}
					}
				}
			]

			/** Invites user from a jednostka to the wyjazd */
			async inviteUser(user) {
				const targetWyjazd = this.parent()
				
				// Check if user already added
				if(this.invitedUsers.some(i => i.user.id == user.id)) return

				// Check if user has a funckja
				const existingFunkcja = await user.getFunkcjaInJednostka(targetWyjazd)
				if(existingFunkcja) return
				
				// Add user to invited
				this.invitedUsers.push({
					user: user.id,
					state: "pending"
				})
				
				// Remove any existing invite
				user.wyjazdInvites = user.wyjazdInvites.filter(i => i != targetWyjazd.id)
				
				// Add wyjazd invite to user
				user.wyjazdInvites.push(targetWyjazd.id)

				await user.save()
				await targetWyjazd.save()
			}

			/** Uninvites users from the wyjazd */
			async uninviteUsers(users) {
				if(!Array.isArray(users)) users = [users]
				
				const targetWyjazd = this.parent()

				for(const user of users) {
					const targetInvitation = this.invitedUsers.id(user.id)
				
					if(!targetInvitation) return
					await targetInvitation.populate("user")

					// Remove invite from user
					targetInvitation.user.wyjazdInvites = targetInvitation.user.wyjazdInvites.filter(i => i != targetWyjazd.id)
					await targetInvitation.user.save()
					
					await targetInvitation.delete()
					
					// Remove user's funkcja
					const existingFunkcja = await targetInvitation.user.getFunkcjaInJednostka(targetWyjazd)
					if(existingFunkcja) {
						existingFunkcja.$locals.test = "test"
						await existingFunkcja.populate(
							["jednostka", "user"],
							{known: [targetWyjazd, targetInvitation.user]}
						)
						await existingFunkcja.delete()
					}
				}

				console.log(targetWyjazd)
				await targetWyjazd.save()
			}

			/** Sets participants for the wyjazd, by inviting users from the jednostka */
			async setParticipants(participantIDs) {
				// Ensure invitation has been accepted
				if(this.state != "accepted") {
					throw new HTTPError(400, "Zaproszenie na wyjazd nie zostało zaakceptowane")
				}
				
				// Ensure all participants belong to jednostka
				await this.populate("jednostka")
				const members = await Array.fromAsync(this.jednostka.getSubMembers())
				const participants = []
				for(const participantID of participantIDs) {
					const participant = members.find(m => m.id == participantID)
					if(!participant) {
						throw new HTTPError(400, "Nie można dodać uczestnika, który nie jest członkiem jednostki.")
					}
					participants.push(participant)
				}

				// Add new participants
				for(const participant of participants) {
					await this.inviteUser(participant)
				}

				// Remove participants not on list
				const uninviteList = this.invitedUsers.filter(i => !participantIDs.includes(i.user.id))
				await this.uninviteUsers(uninviteList.map(i => i.user))
			}

			/** Alias for parent uninviteJednostka method */
			async uninvite() {
				await this.parent().uninviteJednostka(this.jednostka)
			}
		}
	]

	approvalState = {
		type: Boolean,
		default: false
	}


	/* * Getters * */
	
	/** Returns wyjazd type name, based on its length */
	get typeName() {
		const length = this.length
		if(length === null) return "Wyjazd"
		if(length < 1) return "Akcja"
		if(length < 4) return "Biwak"
		return "Obóz"
	}

	/** Gets the length of the wyjazd in days */
	get length() {
		if(!this.dates.start || !this.dates.end) return null
		const difference = datetime.difference(this.dates.start, this.dates.end)
		return difference.days
	}

	/* * Methods * */

	/** Sets a funkcja for a wyjazd */
	async setFunkcja(user, funkcjaType) {
		const funkcja = new Funkcja({
			type: funkcjaType,
			wyjazdowa: true
		})
		
		await super.setFunkcja(user, funkcja)
	}

	/** Sets the dates for the wyjazd */
	async updateDates(startDate, endDate) {
		this.dates.start = startDate ? new Date(startDate) : undefined
		this.dates.end = endDate ? new Date(endDate) : undefined

		if(this.dates.start && this.dates.end && this.dates.start >= this.dates.end) throw new Error("Data rozpoczęcia musi być przed datą końca")

		await this.save()
	}

	/** Finds the user invite for a user */
	findUserInvite(user) {
		for(const invitedJednostka of this.invitedJednostki) {
			const invite = invitedJednostka.invitedUsers.id(user.id)
			if(invite) return invite
		}
	}

	/** Returns possible funkcje for a wyjazd */
	getFunkcjaOptions() {
		return super.getFunkcjaOptions(WyjazdoweFunkcjaNames)
	}

	getUpperJednostkiTree() {
		return []
	}

	/** Invite jednostka to wyjazd */
	async inviteJednostka(jednostka) {
		// Remove existing invites
		this.invitedJednostki = this.invitedJednostki.filter(i => i.jednostka != jednostka.id)
		
		// Invite jednostka
		this.invitedJednostki.push({
			jednostka: jednostka.id,
			state: "pending"
		})

		jednostka.wyjazdInvites.push(this.id)

		await this.save()
		await jednostka.save()
	}

	/** Uninvite jednostka from wyjazd */
	async uninviteJednostka(jednostka) {
		// Get invitation
		const targetInvitation = this.invitedJednostki.id(jednostka.id)
		
		// Check if jednostka invited
		if(!targetInvitation) {
			throw new HTTPError(400, "Jednostka nie jest zaproszona na wyjazd")
		}
		
		// Uninvite users
		targetInvitation.setParticipants([])

		// Remove wyjazd targetInvitation from jednostka
		await targetInvitation.populate("jednostka")
		targetInvitation.jednostka.wyjazdInvites = targetInvitation.jednostka.wyjazdInvites.filter(i => i.id != this.id)
		
		// Delete invitation
		targetInvitation.delete()

		await this.save()
		await targetInvitation.jednostka.save()
	}
}

const schema = mongoose.Schema.fromClass(WyjazdClass)

schema.beforeDelete = async function() {
	// Uninvite all jednostki
	for(const jednostkaInvite of this.invitedJednostki) {
		await jednostkaInvite.uninvite()
	}

	await this.populate("funkcje")

	// Remove all funkcje
	for(const funkcja of this.funkcje) {
		await funkcja.populate("jednostka", {known: [this]})
		await funkcja.delete()
	}
}

schema.permissions = {
	async CREATE(user) {
		// Kadra of a jednostka can create a wyjazd
		await user.populate("funkcje")
		return user.funkcje.some(f => f.type >= FunkcjaType.PRZYBOCZNY)
	},
	
	async ACCESS(user) {
		// Invited users can access
		if(this.findUserInvite(user)) return true

		// Parents of invited users can access
		await user.populate("children")
		for(const child of user.children) {
			if(this.findUserInvite(child)) return true
		}

		// Check for kadra access
		if(await user.checkPermission(this.PERMISSIONS.DATA)) return true

		// Drużynowi of invited jednostki (and upper jednostki) can access
		await this.populate({"invitedJednostki": "jednostka"})
		if(await user.hasFunkcjaInJednostki(FunkcjaType.DRUŻYNOWY, this.invitedJednostki.map(i => i.jednostka))) return true
		if(await user.hasFunkcjaInJednostki(FunkcjaType.DRUŻYNOWY, this.invitedJednostki.map(i => i.jednostka.getUpperJednostkiTree()))) return true

		return false
	},

	async DATA(user) {
		// Only kadra can access user data
		const userFunkcja = await user.getFunkcjaInJednostka(this)
		if(userFunkcja?.type >= FunkcjaType.KADRA) return true

		return false
	},

	async MODIFY(user) {
		if(!await user.checkPermission(this.PERMISSIONS.DATA)) return false

		// Komendant of a wyjazd can modify
		const userFunkcja = await user.getFunkcjaInJednostka(this)
		if(userFunkcja?.type == FunkcjaType.KOMENDANT) return true

		return true
	},

	async DELETE(user) {
		if(!await user.checkPermission(this.PERMISSIONS.MODIFY)) return false
		
		return true
	}
}

export default mongoose.model("Wyjazd", schema, "wyjazdy")