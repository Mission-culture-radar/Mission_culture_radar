// Safer markdown-to-HTML converter with real table + hr detection + link fixes + blockquotes
export const formatContent = (markdown: string) => {
    let md = markdown ?? "";

    // ---- helpers (sanitize + link builder)
    const sanitizeUrl = (raw: string): string => {
        if (!raw) return "";
        const url = raw.trim();

        // allow anchors & relative links
        if (url.startsWith("#") || url.startsWith("/") || url.startsWith("./") || url.startsWith("../")) return url;

        // allow http(s), mailto, tel
        const lower = url.toLowerCase();
        if (lower.startsWith("mailto:") || lower.startsWith("tel:")) return url;

        try {
            const u = new URL(url);
            if (u.protocol === "http:" || u.protocol === "https:") return url;
        } catch { /* noop */ }
        return ""; 
    };

    const buildLink = (url: string, label: string) => {
        const safe = sanitizeUrl(url);
        if (!safe) return label; // fallback: plain text
        const isHttp = /^https?:/i.test(safe);
        const targetRel = isHttp ? ` target="_blank" rel="nofollow noopener noreferrer"` : "";
        return `<a href="${safe}"${targetRel} class="text-purple-300 underline underline-offset-2 hover:text-purple-200 focus:outline-none focus-visible:ring focus-visible:ring-purple-400 rounded-sm">${label}</a>`;
    };

    // --- 0) Protect code fences so we don't mangle them later
    const codeStore: string[] = [];
    md = md.replace(/```([\s\S]*?)```/g, (_m, code) => {
        const idx = codeStore.push(code) - 1;
        return `{{CODEBLOCK_${idx}}}`;
    });

    // --- 1) Horizontal rules (***, --- or ___) on their own line (no pipes!)
    md = md.replace(
        /^\s{0,3}(?:\*{3,}|-{3,}|_{3,})\s*$/gm,
        '<hr class="my-8 border-purple-500/30 border-t-2">'
    );

    // --- 2) Blockquotes (> marker)
    md = md.replace(
        /(^\s*>\s.*(?:\r?\n(?:(?:\s*$)|\s*>\s.*))*)/gm,
        (quoteBlock) => {
            const content = quoteBlock
                .split(/\r?\n/)
                .filter(l => /^\s*>\s/.test(l))                      // keep only quote lines
                .map(l => l.replace(/^\s*>\s?/, '').trim())          // remove > marker
                .join('\n');
            return `<blockquote class="border-l-4 border-purple-400 pl-6 py-2 my-6 bg-purple-900/20 text-gray-300 italic">${content}</blockquote>`;
        }
    );

    // --- 3) Headings
    md = md.replace(/^### (.*)$/gm, '<h3 class="text-xl font-medium mb-3 text-purple-200 mt-6">$1</h3>');
    md = md.replace(/^## (.*)$/gm, '<h2 class="text-2xl font-semibold mb-4 text-purple-300 mt-8">$1</h2>');
    md = md.replace(/^# (.*)$/gm, '<h1 class="text-3xl font-bold mb-6 text-white">$1</h1>');

    // --- 4) Tables: require header row + separator row
    md = md.replace(
        /(?:^\|.*\|\s*\r?\n?){2,}/gm,
        (block) => {
            const lines = block.trimEnd().split(/\r?\n/);
            if (lines.length < 2) return block;

            const header = lines[0].trim();
            const sep = lines[1].trim();

            const isSeparator = /^\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(sep);
            if (!isSeparator) return block;

            const rowLines = [header, ...lines.slice(2).filter(l => /^\|.*\|\s*$/.test(l))];

            const cellsFrom = (line: string) => line.split('|').slice(1, -1).map(c => c.trim());
            const headerCells = cellsFrom(rowLines[0]);

            let html = '<div class="overflow-x-auto my-6"><table class="min-w-full bg-gray-700/50 rounded-lg border border-purple-500/20">';
            html += '<thead><tr class="bg-purple-600/30">';
            headerCells.forEach(cell => { html += `<th class="px-4 py-3 text-left font-semibold text-purple-200">${cell}</th>`; });
            html += '</tr></thead><tbody>';

            rowLines.slice(1).forEach(line => {
                const cells = cellsFrom(line);
                if (!cells.length) return;
                html += '<tr class="border-t border-purple-500/20 hover:bg-purple-600/10">';
                cells.forEach(cell => { html += `<td class="px-4 py-3 text-gray-300">${cell}</td>`; });
                html += '</tr>';
            });

            html += '</tbody></table></div>';
            return html;
        }
    );

    // --- 5) Lists (contiguous blocks, allow blank lines between items)
    // Unordered lists
    md = md.replace(
        /(^\s*[-+*]\s.*(?:\r?\n(?:(?:\s*$)|\s*[-+*]\s.*))*)/gm,
        (listBlock) => {
            const items = listBlock
                .split(/\r?\n/)
                .filter(l => /^\s*[-+*]\s+/.test(l))                 // keep only bullet lines
                .map(l => l.replace(/^\s*[-+*]\s+/, '').trim())
                .map(txt => `<li class="mb-2 text-gray-300">${txt}</li>`)
                .join('');
            return `<ul class="list-disc list-inside mb-4 ml-4">${items}</ul>`;
        }
    );

    // Ordered lists
    md = md.replace(
        /(^\s*\d+\.\s.*(?:\r?\n(?:(?:\s*$)|\s*\d+\.\s.*))*)/gm,
        (listBlock) => {
            const items = listBlock
                .split(/\r?\n/)
                .filter(l => /^\s*\d+\.\s+/.test(l))                 // keep only numbered lines
                .map(l => l.replace(/^\s*\d+\.\s+/, '').trim())
                .map(txt => `<li class="mb-2 text-gray-300">${txt}</li>`)
                .join('');
            return `<ol class="list-decimal list-inside mb-4 ml-4">${items}</ol>`;
        }
    );

    // --- 6) Inline formatting + LINKS
    // Protect inline code first
    const INLINE_CODE_PLACEHOLDER = '__INLINE_CODE__';
    const inlineStore: string[] = [];
    md = md.replace(/`([^`]+)`/g, (_m, code) => {
        const idx = inlineStore.push(code) - 1;
        return `${INLINE_CODE_PLACEHOLDER}${idx}__`;
    });

    // 6a) Markdown links first
    md = md.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_m, label, url) => {
        return buildLink(url, label);
    });

    // 6b) PROTECT the anchors we just created so autolinks/bare-URLs don't mangle them
    const anchorStore: string[] = [];
    md = md.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, (a) => {
        const idx = anchorStore.push(a) - 1;
        return `{{ANCHOR_${idx}}}`;
    });

    // 6c) Autolinks in angle brackets
    md = md.replace(/<((?:https?:\/\/|mailto:|tel:)[^ >]+)>/g, (_m, url) => {
        const text = url.replace(/^mailto:/i, '');
        return buildLink(url, text);
    });

    // 6d) Bare URLs (now safe, anchors are protected)
    md = md.replace(/\bhttps?:\/\/[^\s<>()\[\]{}"']+[^\s<>()\[\]{}"'.!,?;:)]/g, (url) => {
        return buildLink(url, url);
    });

    // Restore protected anchors
    md = md.replace(/{{ANCHOR_(\d+)}}/g, (_m, i) => anchorStore[+i]);

    // Bold / italics
    md = md.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
    md = md.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Restore inline code
    md = md.replace(new RegExp(`${INLINE_CODE_PLACEHOLDER}(\\d+)__`, 'g'), (_m, i) =>
        `<code class="bg-gray-700 px-2 py-1 rounded text-purple-300 font-mono text-sm">${inlineStore[+i]}</code>`
    );

    // --- 7) Paragraphs: wrap only plain-text blocks (avoid block elements)
    const BLOCK_START = /^(<h[1-6]\b|<hr\b|<div\b|<table\b|<ul\b|<ol\b|<pre\b|<blockquote\b|{{CODEBLOCK_\d+}})/i;

    const html = md
        .split(/\n{2,}/)
        .map(chunk => {
            const trimmed = chunk.trim();
            if (!trimmed) return '';
            if (BLOCK_START.test(trimmed)) return trimmed;
            return `<p class="mb-4 text-white leading-relaxed">${trimmed.replace(/\n/g, '<br>')}</p>`;
        })
        .join('\n');

    // --- 8) Restore code fences at the very end
    const escapeHtml = (s: string) =>
        s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const finalHtml = html.replace(/{{CODEBLOCK_(\d+)}}/g, (_m, i) => {
        const code = escapeHtml(codeStore[+i] ?? '');
        return `<pre class="bg-gray-800/70 rounded-lg p-4 overflow-x-auto"><code class="font-mono text-sm text-purple-300">${code}</code></pre>`;
    });

    return finalHtml;
};