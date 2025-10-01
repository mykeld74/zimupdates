import type { PageServerLoad } from './$types';
import { getBackendBaseUrl, fetchJson } from '$lib/server/payload';
import { serializeAndSanitize } from '$lib/server/richtext';

type UpdateDoc = {
	id: string;
	title: string;
	slug?: string;
	content?: unknown;
	createdAt?: string;
};

type PayloadList<T> = { docs: T[] };

export const load: PageServerLoad = async ({ params }) => {
	const base = getBackendBaseUrl();
	const slug = params.slug;

	// Try by slug first; fall back to ID
	const bySlugUrl = `${base}/api/updates?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`;
	const list = await fetchJson<PayloadList<UpdateDoc>>(bySlugUrl);
	const doc = list.docs[0];

	if (doc) {
		const html = await serializeAndSanitize(doc.content);
		return { update: { ...doc, html } };
	}

	const byIdUrl = `${base}/api/updates/${encodeURIComponent(slug)}`;
	const byId = await fetchJson<UpdateDoc>(byIdUrl);
	const html = await serializeAndSanitize(byId.content);
	return { update: { ...byId, html } };
};
