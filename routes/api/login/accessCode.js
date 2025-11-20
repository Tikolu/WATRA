import HTTPError from "modules/server/error.js"

export default async function({accessCode}) {	
	// Check access code
	if(!/^[0-9 ]+$/.test(accessCode)) throw new HTTPError(400, "Nie prawidłowy kod dostępu")
	accessCode = accessCode.replaceAll(" ", "")
	
	const user = await this.session.codeLogin(accessCode)
	if(!user) throw new HTTPError(400, "Nie prawidłowy kod dostępu")

	// Add user to route data
	this.addRouteData({user})
		
	return {
		userID: user.id
	}
}