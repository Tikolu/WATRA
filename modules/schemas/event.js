import mongoose from "mongoose"
import * as Text from "modules/text.js"
import * as datetime from "jsr:@std/datetime"

import Role from "modules/schemas/role.js"
import HTTPError from "modules/server/error.js"

import { UnitClass } from "modules/schemas/unit"

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

						await this.populate("user")

						// Check participant eligibility
						if(!this.user.profileComplete) {
							throw new HTTPError(400, "Brakuje danych na profilu uczestnika")
						}
						// Check parent eligibility
						if(this.user.parents.length > 0) {
							await this.populate("parents")
							if(this.parents.every(p => !p.profileComplete)) {
								throw new HTTPError(400, "Brakuje danych na profilu rodzica uczestnika")
							}
						}

						this.state = state
						await targetEvent.save()

						// Set szeregowy role for new participant
						if(state == "accepted") {
							await targetEvent.setRole(this.user, 0)
						}

						// Remove role if declined
						if(state == "declined") {
							const existingRole = await this.user.getRoleInUnit(targetEvent)
							if(existingRole) await existingRole.delete()
						}
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
					const existingRole = await participant.getRoleInUnit(targetEvent)
					if(existingRole) continue
					
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
					
					// Remove user's role
					const existingRole = await userInvite.user.getRoleInUnit(targetEvent)
					if(existingRole) {
						existingRole.$locals.test = "test"
						await existingRole.populate(
							["unit", "user"],
							{known: [targetEvent, userInvite.user]}
						)
						await existingRole.delete()
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
					await unit.populate("roles")
					for(const role of unit.roles) {
						if(role.config.tags.includes("approveEvent")) continue
						await role.populate(
							["user", "unit"],
							{known: [unit]}
						)
						yield role
					}
				}
			}
		}
	]

	approvers = [
		class {
			role = {
				type: String,
				ref: "Role",
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

	/** Sets a role for a event */
	async setRole(user, roleType) {
		const role = new Role({
			type: roleType,
			eventRole: true
		})
		
		await super.setRole(user, role)
	}

	/** Finds the user invite for a user */
	findUserInvite(user) {
		for(const invitedUnit of this.invitedUnits) {
			const invite = invitedUnit.invitedUsers.id(user.id)
			if(invite) return invite
		}
	}

	/** Returns possible roles for a event */
	getRoleOptions() {
		return super.getRoleOptions(EventRoleNames)
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
	async setApprovers(roleIDs) {
		const roles = await Role.find({_id: roleIDs})
		
		await this.populate({
			"approvers": 
				{"role": "user"}
			},
			{known: roles}
		)

		// Remove approvers not on list
		for(const approver of [...this.approvers]) {
			if(roles.hasID(approver.id)) continue

			// Remove from user
			approver.role.user.eventApprovalRequests = approver.role.user.eventApprovalRequests.filter(id => id != this.id)
			await approver.role.user.save()

			await approver.delete()
		}

		// Add new approvers
		for(const role of roles) {
			// Check if user already added
			if(this.approvers.id(role.id)) continue

			// Ensure approver is in candidates
			const candidates = await this.findApproverCandidates()
			if(!candidates.some(c => c.id == role.id)) {
				throw new HTTPError(400, "Użytkownik nie może być zatwierdzającym")
			}

			// Ensure other role of the same user is not added
			await role.populate("user")
			await this.populate({
				"approvers": "role"
			})
			for(const approver of this.approvers) {
				if(approver.role.user.id != role.user.id) continue
				if(approver.id == role.id) continue
				throw new HTTPError(400, "Użytkownik jest już zatwierdzającym")
			}

			// Add approver
			this.approvers.push({role})

			// Add approval request to user
			if(!role.user.eventApprovalRequests.hasID(this.id)) {
				role.user.eventApprovalRequests.push(this.id)
			}
			
			await role.user.save()
		}

		await this.save()
	}

	/** Get an approver of a user */
	getApprover(user) {
		for(const approver of this.approvers) {
			if(user.roles.hasID(approver.role.id)) return approver
		}
	}

	/** Generates a list of users which can have a role assigned */
	async * usersForAssignment() {
		await this.populate({
			"invitedUnits": {
				"invitedUsers": {
					"user": {}
				}
			},
			"roles": "user"
		})
		
		// Get all roles already added
		for(const role of this.roles) {
			yield role.user
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

	await this.populate("roles")

	// Remove all roles
	for(const role of this.roles) {
		await role.populate("unit", {known: [this]})
		await role.delete()
	}
}

schema.permissions = {
	async CREATE(user) {
		await user.populate("roles")
		return user.roles.some(r => r.config.tags.includes("createEvent"))
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
		const userRole = await user.getRoleInUnit(this)
		if(userRole?.type >= RoleType.KADRA) return true

		// Check roles in invited units
		await this.populate({"invitedUnits": "unit"})
		for(const i of this.invitedUnits) {
			if(await user.hasPermissionInUnit("accessEventInvited", i.unit)) return true
		}

		return false
	},

	async PARTICIPANT_ACCESS(user) {
		if(await user.hasPermissionInUnit("accessParticipant")) return true

		return false
	},

	APPROVE(user) {
		// Users with roles on the approver list can approve
		for(const userRole of user.roles) {
			const approver = this.approvers.id(userRole.id)
			if(!approver) continue
			return true
		}
		return false
	},

	async MODIFY(user) {
		if(await user.hasPermissionInUnit("modifyEvent")) return true

		return false
	}
}

export default mongoose.model("Event", schema, "events")