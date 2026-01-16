function setTheme(theme) {	
	theme ||= JSON.parse(localStorage.theme || "\"auto\"")
	if(theme == "auto") theme = themeQuery.matches ? "dark" : "light"
	
	// Get current theme
	const currentTheme = document.documentElement.getAttribute("theme")

	// Extract hue from theme
	const currentHue = Number(currentTheme) ?? Number(currentTheme?.split(" ")?.[1])

	// Apply hue if set
	if(currentHue) {
		document.documentElement.style.setProperty("--hue", `${currentHue}deg`)
		theme += ` ${currentHue}`
	}
	
	// Apply theme
	document.documentElement.setAttribute("theme", theme)
	
	// Apply theme colour
	const colour = window.getComputedStyle(document.documentElement).getPropertyValue("--surface-4")
	const meta = document.querySelector("meta[name=theme-color]") || document.createElement("meta")
	meta.name = "theme-color"
	meta.setAttribute("static", "")
	meta.content = colour
	document.head.append(meta)
}
const themeQuery = window.matchMedia("(prefers-color-scheme: dark)")
themeQuery.onchange = () => setTheme()
setTheme()