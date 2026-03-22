export function normalizeArabicSearch(value: string): string {
	return value.toLowerCase().replace(/\s+/g, "").trim();
}

export function fuzzyIncludes(text: string | undefined | null, query: string) {
	const normalizedText = normalizeArabicSearch(text || "");
	const normalizedQuery = normalizeArabicSearch(query);

	if (!normalizedQuery) return true;
	if (!normalizedText) return false;
	if (normalizedText.includes(normalizedQuery)) return true;

	let queryIndex = 0;
	for (const char of normalizedText) {
		if (char === normalizedQuery[queryIndex]) {
			queryIndex += 1;
			if (queryIndex >= normalizedQuery.length) return true;
		}
	}

	return false;
}
