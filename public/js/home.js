if(window.newsList) {
	for(const news of newsList.children) {
		const autoOpen = news.dataset.autoOpen || "never"
		const newsID = news.dataset.id
		if(autoOpen == "never") continue

		Local.seenNews ||= []
		// Don't auto-open if seen before
		if(autoOpen == "once" && Local.seenNews.includes(newsID)) continue

		// Add to seen
		Local.seenNews.push(newsID)
		sleep(100).then(() => news.click())
		break
	}
}