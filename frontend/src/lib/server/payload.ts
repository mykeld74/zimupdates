import { PUBLIC_BACKEND_URL } from '$env/static/public';

export function getBackendBaseUrl(): string {
	// Handle case where PUBLIC_BACKEND_URL might not be defined
	const fromEnv = (PUBLIC_BACKEND_URL || '').trim();
	return fromEnv || 'http://localhost:3000';
}

export async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
	const res = await fetch(input, init);
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		throw new Error(`Request failed ${res.status}: ${text}`);
	}
	return (await res.json()) as T;
}
