import mongoose from "mongoose"
import * as Text from "modules/text.js"
import * as datetime from "jsr:@std/datetime"

import Funkcja from "modules/schemas/funkcja.js"
import HTTPError from "modules/server/error.js"

import { UnitClass } from "modules/schemas/unit"
import { FunkcjaType, UnitType, EventFunkcjaNames } from "modules/types.js"

export class EventClass extends UnitClass {
	/* * Properties * */

	upperUnits = undefined
	subUnits = undefined
	type = undefined
	eventInvites = undefined

	dates = {
		start: {
			type: Date,
			min: MIN_DATE,
			max: MAX_DATE,
			validate: {
				validator: function(value) {
					return value <= this.dates.end
				},
				message: "Data rozpoczęcia musi być przed datą zakończenia"
			}
		},
		end: {
			type: Date,
			min: MIN_DATE,
			max: MAX_DATE,
			validate: {
				validator: function(value) {
					return this.dates.start <= value
				},
				message: "Data rozpoczęcia musi być przed datą zakończenia"
			}
		}
	}

	description = {
		type: String,
		trim: true,
		default: ""
	}

	location = {
		type: String,
		trim: true,
		default: ""
	}

	invitedUnits = [
		class {
			unit = {
				type: String,
				ref: "Unit",
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
						const targetEvent = this.ownerDocument()
						
						// Ignore existing state
						if(this.state === state) return

						// Check participant eligibility
						const eligibilityIssues = await this.getEligibilityIssues()
						if(eligibilityIssues.length) {
							throw new HTTPError(400, "Użytkownik nie spełnia wymagań do uczestnictwa")
						}

						this.state = state
						await targetEvent.save()

						await this.populate("user")

						// Set szeregowy funkcja for new participant
						if(state == "accepted") {
							await targetEvent.setFunkcja(this.user, 0)
						}

						// Remove funkcja if declined
						if(state == "declined") {
							const existingFunkcja = await this.user.getFunkcjaInUnit(targetEvent)
							if(existingFunkcja) await existingFunkcja.delete()
						}
					}

					/** Checks if the user is eligible to participate */
					async getEligibilityIssues() {
						await this.populate("user")
						
						return Array.conditional(
							!this.user.name.first || !this.user.name.last, "Uczestnik musi mieć ustawione imię i nazwisko aby uczestniczyć",
							!this.user.dateOfBirth, "Uczestnik musi mieć ustawioną datę urodzenia aby uczestniczyć",
							!this.user.medical.confirmed, "Uczestnik musi mieć zatwierdzone dane medyczne aby uczestniczyć"
						)
					}

				}
			]

			/** Sets participants for the event, by inviting users from the unit */
			async setParticipants(participantIDs) {
				const targetEvent = this.parent()
				
				// Ensure invitation has been accepted
				if(this.state != "accepted") {
					throw new HTTPError(400, "Zaproszenie na akcję nie zostało zaakceptowane")
				}
				
				// Ensure all participants belong to unit
				await this.populate("unit")
				const members = await Array.fromAsync(this.unit.getSubMembers())
				const participants = []
				for(const participantID of participantIDs) {
					const participant = members.find(m => m.id == participantID)
					if(!participant) {
						throw new HTTPError(400, "Nie można dodać uczestnika, który nie jest członkiem units.")
					}
					participants.push(participant)
				}

				// Add new participants
				for(const participant of participants) {
					// Check if user already added
					if(this.invitedUsers.some(i => i.user.id == participant.id)) continue

					// Check if user has a funckja
					const existingFunkcja = await participant.getFunkcjaInUnit(targetEvent)
					if(existingFunkcja) continue
					
					// Add user to invited
					this.invitedUsers.push({
						user: participant.id,
						state: "pending"
					})
					
					// Remove any existing invite
					participant.eventInvites = participant.eventInvites.filter(i => i != targetEvent.id)
					
					// Add event invite to user
					participant.eventInvites.push(targetEvent.id)

					// Save user
					await participant.save()
				}

				// Remove participants not on list
				for(const userInvite of this.invitedUsers) {
					if(participantIDs.includes(userInvite.user.id)) continue
				
					await userInvite.populate("user")

					// Remove invite from user
					userInvite.user.eventInvites = userInvite.user.eventInvites.filter(i => i != targetEvent.id)
					await userInvite.user.save()
					
					await userInvite.delete()
					
					// Remove user's funkcja
					const existingFunkcja = await userInvite.user.getFunkcjaInUnit(targetEvent)
					if(existingFunkcja) {
						existingFunkcja.$locals.test = "test"
						await existingFunkcja.populate(
							["unit", "user"],
							{known: [targetEvent, userInvite.user]}
						)
						await existingFunkcja.delete()
					}
				}

				await targetEvent.save()
			}

			/** Alias for parent uninviteUnit method */
			async uninvite() {
				await this.parent().uninviteUnit(this.unit)
			}

			/** Finds approvers of an invited unit */
			async * findApprovers() {
				await this.populate("unit")

				const units = [this.unit]
				units.push(...await Array.fromAsync(this.unit.getUpperUnitsTree()))

				for(const unit of units) {
					if(unit.type < UnitType.HUFIEC) continue

					await unit.populate("funkcje")
					for(const funkcja of unit.funkcje) {
						if(funkcja.type < FunkcjaType.REFERENT) continue
						await funkcja.populate(
							["user", "unit"],
							{known: [unit]}
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

			/** Get the approval state of the event */
			get approved() {
				return this.approvedAt != null
			}

			/** Approves the event */
			async approve() {
				if(this.approved) {
					throw new HTTPError(400, "Akcja już została zatwierdzona")
				}

				this.approvedAt = new Date()
				await this.parent().save()
			}

			/** Unapproves the event */
			async unapprove() {
				if(!this.approved) {
					throw new HTTPError(400, "Akcja nie jest zatwierdzona")
				}

				this.approvedAt = null
				await this.parent().save()
			}

		}
	]


	/* * Getters * */
	
	/** Returns event type name, based on its length */
	get typeName() {
		const length = this.length
		if(length === null) return "Wyjazd"
		if(length < 1) return "Akcja"
		if(length < 4) return "Biwak"
		return "Obóz"
	}

	/** Gets the length of the event in days */
	get length() {
		if(!this.dates.start || !this.dates.end) return null
		const difference = datetime.difference(this.dates.start, this.dates.end)
		return difference.days
	}

	/** Gets the overall approval state of the event */
	get approvalState() {
		if(this.approvers.length == 0) return false

		for(const approver of this.approvers) {
			if(!approver.approved) return false
		}

		return true
	}

	/* * Methods * */

	/** Sets a funkcja for a event */
	async setFunkcja(user, funkcjaType) {
		const funkcja = new Funkcja({
			type: funkcjaType,
			eventFunkcja: true
		})
		
		await super.setFunkcja(user, funkcja)
	}

	/** Finds the user invite for a user */
	findUserInvite(user) {
		for(const invitedUnit of this.invitedUnits) {
			const invite = invitedUnit.invitedUsers.id(user.id)
			if(invite) return invite
		}
	}

	/** Returns possible funkcje for a event */
	getFunkcjaOptions() {
		return super.getFunkcjaOptions(EventFunkcjaNames)
	}

	getUpperUnitsTree() {
		return []
	}

	/** Invite unit to event */
	async inviteUnit(unit, state="pending") {
		// Remove existing invites
		this.invitedUnits = this.invitedUnits.filter(i => i.unit != unit.id)
		
		// Invite unit
		this.invitedUnits.push({
			unit: unit.id,
			state
		})

		unit.eventInvites.push(this.id)

		await this.save()
		await unit.save()
	}

	/** Uninvite unit from event */
	async uninviteUnit(unit) {
		// Get invitation
		const targetInvitation = this.invitedUnits.id(unit.id)
		
		// Check if unit invited
		if(!targetInvitation) {
			throw new HTTPError(400, "Jednostka nie jest zaproszona na akcję")
		}
		
		// Uninvite users
		if(targetInvitation.invitedUsers.length > 0) {
			await targetInvitation.setParticipants([])
		}

		// Remove event targetInvitation from unit
		await targetInvitation.populate("unit")
		targetInvitation.unit.eventInvites = targetInvitation.unit.eventInvites.filter(i => i.id != this.id)
		
		// Delete invitation
		targetInvitation.delete()

		await this.save()
		await targetInvitation.unit.save()
	}

	/** Find approver candidates */
	async findApproverCandidates() {
		const candidates = []
		for(const unitInvite of this.invitedUnits) {
			if(unitInvite.state != "accepted") continue
			candidates.push(...await Array.fromAsync(unitInvite.findApprovers()))
		}
		return candidates
	}

	/** Set approvers from a list */
	async setApprovers(funkcjaIDs) {
		const funkcje = await Funkcja.find({_id: funkcjaIDs})
		
		await this.populate({
			"approvers": 
				{"funkcja": "user"}
			},
			{known: funkcje}
		)

		// Remove approvers not on list
		for(const approver of [...this.approvers]) {
			if(funkcje.hasID(approver.id)) continue

			// Remove from user
			approver.funkcja.user.eventApprovalRequests = approver.funkcja.user.eventApprovalRequests.filter(id => id != this.id)
			await approver.funkcja.user.save()

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
				if(approver.id == funkcja.id) continue
				throw new HTTPError(400, "Użytkownik jest już zatwierdzającym")
			}

			// Add approver
			this.approvers.push({funkcja})

			// Add approval request to user
			if(!funkcja.user.eventApprovalRequests.hasID(this.id)) {
				funkcja.user.eventApprovalRequests.push(this.id)
			}
			
			await funkcja.user.save()
		}

		await this.save()
	}

	/** Get an approver of a user */
	getApprover(user) {
		for(const approver of this.approvers) {
			if(user.funkcje.hasID(approver.funkcja.id)) return approver
		}
	}

	/** Generates a list of users which can be mianowani na funkcję */
	async * usersForMianowanie() {
		await this.populate({
			"invitedUnits": {
				"invitedUsers": {
					"user": {}
				}
			},
			"funkcje": "user"
		})
		
		// Get all funkcje already added
		for(const funkcja of this.funkcje) {
			yield funkcja.user
		}

		// Get all accepted invites
		for(const unit of this.invitedUnits) {
			if(unit.state != "accepted") continue
			
			for(const inviteUser of unit.invitedUsers) {
				if(inviteUser.state != "accepted") continue
				
				yield inviteUser.user
			}
		}
	}
}

const schema = mongoose.Schema.fromClass(EventClass)

schema.beforeDelete = async function() {
	// Uninvite all units
	for(const unitInvite of this.invitedUnits) {
		await unitInvite.uninvite()
	}

	// Remove all approvers
	await this.setApprovers([])

	await this.populate("funkcje")

	// Remove all funkcje
	for(const funkcja of this.funkcje) {
		await funkcja.populate("unit", {known: [this]})
		await funkcja.delete()
	}
}

schema.permissions = {
	async CREATE(user) {
		// Kadra of a unit can create a event
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
		const userFunkcja = await user.getFunkcjaInUnit(this)
		if(userFunkcja?.type >= FunkcjaType.KADRA) return true

		// Drużynowi of invited units (and upper units) can access
		await this.populate({"invitedUnits": "unit"})
		if(await user.hasFunkcjaInUnits(FunkcjaType.DRUŻYNOWY, this.invitedUnits.map(i => i.unit))) return true
		if(await user.hasFunkcjaInUnits(FunkcjaType.DRUŻYNOWY, this.invitedUnits.map(i => i.unit.getUpperUnitsTree()))) return true

		return false
	},

	async PARTICIPANT_ACCESS(user) {
		// Only kadra can access user data
		const userFunkcja = await user.getFunkcjaInUnit(this)
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
		// Komendant of a event can modify
		const userFunkcja = await user.getFunkcjaInUnit(this)
		if(userFunkcja?.type == FunkcjaType.KOMENDANT) return true

		return false
	}
}

export default mongoose.model("Event", schema, "events")