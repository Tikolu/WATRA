function processSignatureElements() {
	for(const signature of document.querySelectorAll(".signature-container")) {
		const slider = signature.querySelector(".signature-slider")
		if(!slider || signature.classList.contains("complete")) {
			clearTimeout(signature.resetTimeout)
			continue
		}
		
		signature.reset = () => {
			clearTimeout(signature.resetTimeout)
			signature.required = true
			signature.value = null
			signature.classList.remove("loading", "complete", "invalid")
			signature.querySelector(".signature-info")?.remove()
		}
		signature.reset()
		
		signature.start = async () => {
			const startResponse = await API.request("signature/start")

			let credential
			if(startResponse.options.allowCredentials.length > 0) {
				try {
					credential = await top.navigator.credentials.get({
						publicKey: PublicKeyCredential.parseRequestOptionsFromJSON(startResponse.options)
					})
				} catch(error) {
					console.error(error)
					logError(error)
					Popup.error("Anulowano podpisywanie")
					return
				}
			}

			const verificationResponse = await API.request("signature/verify", {
				credential: credential?.toJSON()
			})

			signature.classList.remove("loading")
			signature.classList.add("complete")

			signature.insertAdjacentHTML("afterbegin", `
				<div class="signature-info">
					<h3>
						<i>check</i>
						Podpisano
					</h3>
					<p>${verificationResponse.signature.name}<br>${verificationResponse.displayTime}</p>
				</div>
			`)

			signature.value = verificationResponse.signature

			signature.resetTimeout = setTimeout(signature.reset, 60000)
		}
		
		slider.onpointerdown = () => {
			if(signature.classList.contains("loading")) return
			if(signature.classList.contains("complete")) return
			if(signature.classList.contains("disabled")) return
			signature.bounds = signature.getBoundingClientRect()
			signature.classList.add("dragging")
			signature.classList.remove("invalid")
			navigator.vibrate?.(50)
			
			document.addEventListener("pointermove", slider.update)

			document.addEventListener("pointerup", () => {
				document.removeEventListener("pointermove", slider.update)
				signature.classList.remove("dragging")
				slider.style.setProperty("--x", "0px")

				// Cancel signature if dragged less than 90%
				if(!slider.x || slider.x < signature.bounds.width * 0.9) return
				
				signature.classList.add("loading")
				navigator.vibrate?.(150)
				signature.start().catch(error => {
					signature.reset()
					signature.classList.add("invalid")
					throw error
				})

			}, {once: true})
		}
		
		slider.update = event => {
			slider.x = event.clientX - signature.bounds.left
			slider.style.setProperty("--x", `${slider.x}px`)
		}
	}
}
window.afterDataRefresh.push(processSignatureElements)
processSignatureElements()