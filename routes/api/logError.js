export default function({message, url, stack}) {
	if(typeof message != "string") message = undefined
	if(typeof url != "string") url = undefined
	if(typeof stack != "string") stack = undefined
	return {message, url, stack}
}