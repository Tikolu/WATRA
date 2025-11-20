function setTheme(theme) {	
	theme ||= JSON.parse(localStorage.theme || "\"auto\"")
	if(theme == "auto") theme = themeQuery.matches ? "dark" : "light"
	
	// Import theme stylesheet
	const link = document.createElement("link")
	link.rel = "stylesheet"
	link.href = `/css/themes/${theme}.css`
	link.className = `theme-stylesheet ${theme}`
	document.head.append(link)

	// Remove previous theme
	const previousLink = document.querySelector(`link.theme-stylesheet:not(.${theme})`)
	if(previousLink) sleep(500).then(() => previousLink.remove())

	// Apply theme colour
	const colour = window.getComputedStyle(document.documentElement).getPropertyValue("--surface-4")
	const meta = document.querySelector("meta[name=theme-color]") || document.createElement("meta")
	meta.name = "theme-color"
	meta.content = colour
	document.head.append(meta)
}
const themeQuery = window.matchMedia("(prefers-color-scheme: dark)")
themeQuery.onchange = () => setTheme()
setTheme()