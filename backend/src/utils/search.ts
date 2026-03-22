import { and, or, sql } from "drizzle-orm";

export function normalizeSearchTerm(term: string): string {
	return term.toLowerCase().replace(/\s+/g, "").trim();
}

export function buildNormalizedContainsCondition(column: any, search: string) {
	const normalized = normalizeSearchTerm(search);
	if (!normalized) return undefined;

	return sql`replace(lower(${column}), ' ', '') LIKE ${`%${normalized}%`}`;
}

export function buildLooseFuzzyCondition(column: any, search: string) {
	const normalized = normalizeSearchTerm(search);
	if (!normalized) return undefined;

	const chars = normalized.split("").filter(Boolean);
	if (chars.length < 2) {
		return buildNormalizedContainsCondition(column, normalized);
	}

	const first = chars[0];
	const last = chars[chars.length - 1];
	const startsWith = sql`replace(lower(${column}), ' ', '') LIKE ${`${first}%`}`;
	const contains = buildNormalizedContainsCondition(column, normalized);
	const hasLast = sql`replace(lower(${column}), ' ', '') LIKE ${`%${last}%`}`;

	return and(or(contains, startsWith), hasLast);
}
