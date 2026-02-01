export function _open() {
	if(!this.session.ensureActiveUser(this)) return
}