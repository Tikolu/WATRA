jednostkaAddSubJednostkaOptions.onclick = async event => {
	if(!event.target.matches("button")) return
	const subJednostkaID = event.target.dataset.jednostkaId
	
	event.target.disabled = true
	try {
		await API(`jednostka/${META.jednostkaID}/addSubJednostka`, {subJednostkaID})
	} catch(error) {
		event.target.disabled = false
		alert(error)
		return
	}

	event.target.innerText = "Dodano!"
}

createSubJednostkaButton.onclick = async () => {
	try {
		var response = await API("jednostka/create", {upperJednostkaID: META.jednostkaID})
	} catch(error) {
		alert(error)
		return
	}
	document.location.href = `/jednostki/${response.jednostkaID}`
}