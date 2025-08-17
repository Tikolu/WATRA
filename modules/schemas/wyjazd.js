import mongoose from "mongoose"
import * as Text from "modules/text.js"
import * as datetime from "jsr:@std/datetime"

import Funkcja from "modules/schemas/funkcja.js"
import HTTPError from "modules/server/error.js"

import { JednostkaClass } from "modules/schemas/jednostka.js"
import { FunkcjaType, JednostkaType, WyjazdoweFunkcjaNames } from "modules/types.js"

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

	description = {
		type: String,
		default: ""
	}

	location = {
		type: String,
		default: ""
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

			/** Sets participants for the wyjazd, by inviting users from the jednostka */
			async setParticipants(participantIDs) {
				const targetWyjazd = this.parent()
				
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
					// Check if user already added
					if(this.invitedUsers.some(i => i.user.id == participant.id)) continue

					// Check if user has a funckja
					const existingFunkcja = await participant.getFunkcjaInJednostka(targetWyjazd)
					if(existingFunkcja) continue
					
					// Add user to invited
					this.invitedUsers.push({
						user: participant.id,
						state: "pending"
					})
					
					// Remove any existing invite
					participant.wyjazdInvites = participant.wyjazdInvites.filter(i => i != targetWyjazd.id)
					
					// Add wyjazd invite to user
					participant.wyjazdInvites.push(targetWyjazd.id)

					// Save user
					await participant.save()
				}

				// Remove participants not on list
				for(const userInvite of this.invitedUsers) {
					if(participantIDs.includes(userInvite.user.id)) continue
				
					await userInvite.populate("user")

					// Remove invite from user
					userInvite.user.wyjazdInvites = userInvite.user.wyjazdInvites.filter(i => i != targetWyjazd.id)
					await userInvite.user.save()
					
					await userInvite.delete()
					
					// Remove user's funkcja
					const existingFunkcja = await userInvite.user.getFunkcjaInJednostka(targetWyjazd)
					if(existingFunkcja) {
						existingFunkcja.$locals.test = "test"
						await existingFunkcja.populate(
							["jednostka", "user"],
							{known: [targetWyjazd, userInvite.user]}
						)
						await existingFunkcja.delete()
					}
				}

				await targetWyjazd.save()
			}

			/** Alias for parent uninviteJednostka method */
			async uninvite() {
				await this.parent().uninviteJednostka(this.jednostka)
			}

			/** Finds approvers of an invited jednostka */
			async * findApprovers() {
				await this.populate("jednostka")

				const jednostki = [this.jednostka]
				jednostki.push(...await Array.fromAsync(this.jednostka.getUpperJednostkiTree()))

				for(const jednostka of jednostki) {
					if(jednostka.type < JednostkaType.HUFIEC) continue

					await jednostka.populate("funkcje")
					for(const funkcja of jednostka.funkcje) {
						if(funkcja.type < FunkcjaType.REFERENT) continue
						await funkcja.populate(
							["user", "jednostka"],
							{known: [jednostka]}
						)
						yield funkcja
					}
				}
			}
		}
	]

	approvers = [
		class {
			funkcja = {
				type: String,
				ref: "Funkcja",
				deriveID: true
			}

			approvedAt = {
				type: Date,
				default: null
			}

			/** Get the approval state of the wyjazd */
			get approved() {
				return this.approvedAt != null
			}

			/** Approves the wyjazd */
			async approve() {
				if(this.approved) return

				this.approvedAt = new Date()
				await this.parent().save()
			}

			/** Unapproves the wyjazd */
			async unapprove() {
				if(!this.approved) return

				this.approvedAt = null
				await this.parent().save()
			}

		}
	]


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

	/** Gets the overall approval state of the wyjazd */
	get approvalState() {
		if(this.approvers.length == 0) return false

		for(const approver of this.approvers) {
			if(!approver.approved) return false
		}

		return true
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

	/** Sets the description for the wyjazd */
	async updateDescription(description) {
		this.description = description || ""
		await this.save()
	}

	/** Sets the location for the wyjazd */
	async updateLocation(location) {
		this.location = location || ""
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
		if(targetInvitation.invitedUsers.length > 0) {
			await targetInvitation.setParticipants([])
		}

		// Remove wyjazd targetInvitation from jednostka
		await targetInvitation.populate("jednostka")
		targetInvitation.jednostka.wyjazdInvites = targetInvitation.jednostka.wyjazdInvites.filter(i => i.id != this.id)
		
		// Delete invitation
		targetInvitation.delete()

		await this.save()
		await targetInvitation.jednostka.save()
	}

	/** Find approver candidates */
	async findApproverCandidates() {
		const candidates = []
		for(const jednostkaInvite of this.invitedJednostki) {
			if(jednostkaInvite.state != "accepted") continue
			candidates.push(...await Array.fromAsync(jednostkaInvite.findApprovers()))
		}
		return candidates
	}

	/** Set approvers from a list */
	async setApprovers(funkcjaIDs) {
		const funkcje = await Funkcja.find({_id: funkcjaIDs})
		
		// Remove approvers not on list
		for(const approver of [...this.approvers]) {
			if(funkcje.hasID(approver.funkcja.id)) continue
			await approver.delete()
		}

		// Add new approvers
		for(const funkcja of funkcje) {
			// Check if user already added
			if(this.approvers.id(funkcja.id)) continue

			// Ensure approver is in candidates
			const candidates = await this.findApproverCandidates()
			if(!candidates.some(c => c.id == funkcja.id)) {
				throw new HTTPError(400, "Użytkownik nie może być zatwierdzającym")
			}

			// Ensure other funkcja of the same user is not added
			await funkcja.populate("user")
			await this.populate({
				"approvers": "funkcja"
			})
			for(const approver of this.approvers) {
				if(approver.funkcja.user.id != funkcja.user.id) continue
				if(approver.funkcja.id == funkcja.id) continue
				throw new HTTPError(400, "Użytkownik jest już zatwierdzającym")
			}

			// Add approver
			this.approvers.push({funkcja})

			// Add approval request to user
			funkcja.user.wyjazdApprovalRequests.push(this.id)
			await funkcja.user.save()
		}

		await this.save()
	}
		
}

const schema = mongoose.Schema.fromClass(WyjazdClass)

schema.beforeDelete = async function() {
	// Uninvite all jednostki
	for(const jednostkaInvite of this.invitedJednostki) {
		await jednostkaInvite.uninvite()
	}

	// Remove all approvers
	await this.setApprovers([])

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
		// Approvers can access
		if(await user.checkPermission(this.PERMISSIONS.APPROVE)) return true

		// Invited users can access
		if(this.findUserInvite(user)) return true

		// Parents of invited users can access
		await user.populate("children")
		for(const child of user.children) {
			if(this.findUserInvite(child)) return true
		}

		// Check for kadra access
		const userFunkcja = await user.getFunkcjaInJednostka(this)
		if(userFunkcja?.type >= FunkcjaType.KADRA) return true

		// Drużynowi of invited jednostki (and upper jednostki) can access
		await this.populate({"invitedJednostki": "jednostka"})
		if(await user.hasFunkcjaInJednostki(FunkcjaType.DRUŻYNOWY, this.invitedJednostki.map(i => i.jednostka))) return true
		if(await user.hasFunkcjaInJednostki(FunkcjaType.DRUŻYNOWY, this.invitedJednostki.map(i => i.jednostka.getUpperJednostkiTree()))) return true

		return false
	},

	async PARTICIPANT_ACCESS(user) {
		// Only kadra can access user data
		const userFunkcja = await user.getFunkcjaInJednostka(this)
		if(userFunkcja?.type >= FunkcjaType.KADRA) return true

		return false
	},

	APPROVE(user) {
		// Users with funkcje on the approver list can approve
		for(const userFunkcja of user.funkcje) {
			const approver = this.approvers.id(userFunkcja.id)
			if(!approver) continue
			return true
		}
		return false
	},

	async MODIFY(user) {
		// Komendant of a wyjazd can modify
		const userFunkcja = await user.getFunkcjaInJednostka(this)
		if(userFunkcja?.type == FunkcjaType.KOMENDANT) return true

		return false
	}
}

export default mongoose.model("Wyjazd", schema, "wyjazdy")