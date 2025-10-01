import type { PageServerLoad } from './$types';
import { getBackendBaseUrl, fetchJson } from '$lib/server/payload';

type UpdateDoc = {
	id: string;
	title: string;
	slug?: string;
	createdAt?: string;
};

type PayloadList<T> = {
	docs: T[];
	totalDocs: number;
};

export const load: PageServerLoad = async () => {
	const base = getBackendBaseUrl();
	const url = `${base}/api/updates?sort=-createdAt&limit=3`;
	const data = await fetchJson<PayloadList<UpdateDoc>>(url);
	return { recent: data.docs };
};
