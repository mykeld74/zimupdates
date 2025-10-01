import DOMPurify from 'isomorphic-dompurify';

// Relaxed sanitizer to preserve typical rich text HTML coming from Payload Lexical
const SANITIZE_CONFIG: DOMPurify.Config = {
	ALLOWED_TAGS: [
		'a',
		'abbr',
		'b',
		'blockquote',
		'br',
		'code',
		'del',
		'em',
		'i',
		'img',
		'ins',
		'kbd',
		'li',
		'mark',
		'ol',
		'p',
		'pre',
		's',
		'small',
		'span',
		'strong',
		'sub',
		'sup',
		'u',
		'ul',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'figure',
		'figcaption',
		'hr'
	],
	ALLOWED_ATTR: [
		'href',
		'title',
		'target',
		'rel',
		'src',
		'alt',
		'width',
		'height',
		'loading',
		'decoding',
		'class',
		'id',
		'aria-label',
		'role'
	],
	KEEP_CONTENT: true
};

type UnknownJson = unknown;

async function trySerialize(content: UnknownJson): Promise<string | null> {
	try {
		// eslint-disable-next-line @typescript-eslint/consistent-type-imports
		const mod: any = await import('@payloadcms/richtext-lexical');
		const maybe = mod?.lexicalToHtml || mod?.serializeLexical || mod?.serialize || mod?.default;
		if (typeof maybe === 'function') {
			const html = await maybe(content);
			if (typeof html === 'string') return html;
		}
	} catch {}
	return null;
}

export async function serializeAndSanitize(content: UnknownJson): Promise<string> {
	if (!content) return '';
	if (typeof content === 'string') {
		return content;
	}
	const html = (await trySerialize(content)) ?? naiveLexicalToHtml(content);
	if (typeof html === 'string') {
		return html;
	}
	return '';
}

function naiveLexicalToHtml(input: UnknownJson): string | null {
	try {
		const doc = input as any;
		const root = doc?.root;
		const children = Array.isArray(root?.children) ? root.children : [];
		const out: string[] = [];

		const escape = (s: string) =>
			s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

		const renderText = (node: any): string => {
			let text = escape(String(node?.text ?? ''));
			if (node?.format & 1) text = `<strong>${text}</strong>`; // bold
			if (node?.format & 2) text = `<em>${text}</em>`; // italic
			if (node?.format & 4) text = `<u>${text}</u>`; // underline
			if (node?.format & 8) text = `<s>${text}</s>`; // strikethrough
			return text;
		};

		const renderNodes = (nodes: any[]): string =>
			nodes
				.map((n) => {
					const type = n?.type;
					if (type === 'text') return renderText(n);
					if (type === 'linebreak') return '<br />';
					if (type === 'link') {
						const href = escape(String(n?.fields?.url ?? n?.url ?? '#'));
						const inner = renderNodes(Array.isArray(n?.children) ? n.children : []);
						return `<a href="${href}">${inner}</a>`;
					}
					if (type === 'paragraph') {
						const inner = renderNodes(Array.isArray(n?.children) ? n.children : []);
						return inner ? `<p>${inner}</p>` : '<p></p>';
					}
					if (type === 'heading') {
						const raw = n?.tag ?? n?.level ?? n?.size;
						let tag = 'h2';
						if (typeof raw === 'string') {
							if (/^h[1-6]$/i.test(raw)) tag = raw.toLowerCase();
							else {
								const num = Number(raw);
								if (Number.isFinite(num)) tag = `h${Math.min(6, Math.max(1, Math.trunc(num)))}`;
							}
						} else if (typeof raw === 'number') {
							tag = `h${Math.min(6, Math.max(1, Math.trunc(raw)))}`;
						}
						const inner = renderNodes(Array.isArray(n?.children) ? n.children : []);
						return `<${tag}>${inner}</${tag}>`;
					}
					if (type === 'list') {
						const tag = n?.listType === 'number' ? 'ol' : 'ul';
						const inner = renderNodes(Array.isArray(n?.children) ? n.children : []);
						return `<${tag}>${inner}</${tag}>`;
					}
					if (type === 'listitem') {
						const inner = renderNodes(Array.isArray(n?.children) ? n.children : []);
						return `<li>${inner}</li>`;
					}
					if (type === 'quote') {
						const inner = renderNodes(Array.isArray(n?.children) ? n.children : []);
						return `<blockquote>${inner}</blockquote>`;
					}
					// Fallback: render children only
					return renderNodes(Array.isArray(n?.children) ? n.children : []);
				})
				.join('');

		out.push(renderNodes(children));
		return out.join('');
	} catch {
		return null;
	}
}
