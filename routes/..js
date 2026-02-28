import html from "modules/html.js"

import Session from "modules/session.js"
import User from "modules/schemas/user"
import Event from "modules/schemas/event"

const errorMessages = {
	400: ["Nieprawidłowy URL 😳", "Wpisany przez ciebie URL nie ma sensu"],
	403: ["Brak dostępu 🚫", "Nie masz dostępu do tej strony"],
	404: ["Nie znaleziono 😭", "Ta strona nie istnieje"],
	500: ["Błąd serwera 💀", "Coś poszło nie tak"]
}

// const errorMessages = {
// 	400: ["Invalid URL 😳", "Your URL does not make much sense to the server"],
// 	403: ["Forbidden 😑", "You are not allowed to access this resource"],
// 	404: ["Not found 😭", "The requested resource does not exist on the server"],
// 	500: ["Internal server error 💀", "Something went wrong on the server"]
// }

export async function _open() {
	// Set content type and disable caching
	this.response.headers.set("Content-Type", "text/html; charset=utf-8")
	this.response.headers.set("Cache-Control", "no-store")

	// Add route data from URL parameters
	this.addRouteData(Object.fromEntries(this.request.address.searchParams), false)
	
	// Initialise session
	this.token = this.request.token
	this.session = new Session(this.token)
	
	// Get active user from session
	const user = await this.session.getActiveUser()
	if(user) {
		this.addRouteData({user})
	}
}

export function _exit({user}) {
	if(!this.response.open) return
	
	if(this.lastError) {
		// Default code for all errors is 500
		const code = this.lastError.httpCode || 500
		// Redirect 404 errors to login page
		if(code == 404 && !user && this.routePath[0] != "login") {
			this.response.redirect("/login")
			return
		}
		// Use error message from error unless it is a default
		let message = errorMessages[code]?.[1] || ""
		if(!this.lastError.defaultMessage) message = this.lastError.message

		this.lastOutput = html("error", {
			error: {
				code,
				title: errorMessages[code]?.[0] || "🤔",
				message,
				stack: this.lastError.stack
			},
			ip: this.request.sourceIP,
			path: this.request.address.pathname,
			client: this.token.client,
			userAgent: this.request.headers.get("user-agent"),
			user
		})
	}

	// Convert output to string
	if(typeof this.lastOutput != "string") this.lastOutput = String(this.lastOutput)
	
	// Write to response and close it
	this.response.write(this.lastOutput)
	this.response.close()
}


export default async function({user}) {
	if(!this.session.ensureActiveUser(this, false)) return

	// Check for saved redirect
	const redirect = this.token.redirect
	if(redirect) {
		// Clear redirect token
		delete this.token.redirect

		// Perform redirect
		return this.response.redirect(redirect)
	}

	await user.populate({
		"children": {
			"roles": "unit"
		},
		"roles": "unit"
	})
	await user.populate(
		{
			"eventInvites": {},
			"children": {
				"eventInvites": {},
			}
		},
		{
			filter: {"dates.end": {$gte: new Date()}},
			placeholders: false,
			// select:
		}
	)

	// Check child permissions
	for(const child of user.children) {
		await user.checkPermission(child.PERMISSIONS.APPROVE)
	}

	// Check unit event invites
	for(const role of user.roles) {
		if(!role.hasTag("manageEventInvite")) continue
		await role.unit.populate("eventInvites", {
			filter: {"dates.end": {$gte: new Date()}},
			placeholders: false,
			select: "invitedUnits"
		})
	}

	// Find events for approval
	const approvalEvents = []
	for(const role of user.roles) {
		if(!role.hasTag("approveEvent")) continue
		const events = await Event.find({
			"dates.end": {$gte: new Date()},
			"approvers.role": role.id
		})
		approvalEvents.push(...events)
	}

	const eventOptions = [
		...user.eventInvites,
		...user.children.flatMap(c => c.eventInvites),
		...approvalEvents
	].unique("id")

	const events = []
	for(const event of eventOptions) {
		// Get invite states for user and their children
		const inviteStates = [user, ...user.children].map(u => {
			return event.participants.id(u.id)?.state
		})

		// Get approval state for user (if they are an approver)
		const approvalState = event.getApprover(user)?.approved

		// Skip event for non participant approvers who have approved
		if(approvalState === true && !inviteStates.length) continue

		// If registration is closed, skip event if user is not an approver and declined participation
		if(approvalState !== false && event.registrationClosed && inviteStates.every(s => !s || s == "declined")) continue

		events.push({
			event,
			inviteStates,
			approvalState
		})
	}

	// Find required forms, check permissions
	const formUnits = []
	for(const u of [user, ...user.children]) {
		formUnits.push(...await u.listUnits(true).toArray())
		formUnits.push(...u.eventInvites.filter(event => event.participants.id(u.id)?.state == "accepted"))
	}
	const forms = []
	for(const unit of formUnits.unique("id")) {
		await unit.loadFormsForUser(user)
		for(const form of unit.forms) {
			if(!form.$locals.requiredUserResponses?.length) continue
			forms.push(form)
		}
	}

	// Check permissions
	await user.checkPermission(user.PERMISSIONS.EDIT)
	await user.checkPermission(user.PERMISSIONS.APPROVE)
	
	return html("main", {
		user,
		events,
		forms
	})
}