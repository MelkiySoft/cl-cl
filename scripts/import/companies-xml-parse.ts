const SS = "urn:schemas-microsoft-com:office:spreadsheet";

function localName(tag: string): string {
    const brace = tag.indexOf("}");
    if (brace !== -1) return tag.slice(brace + 1);
    const colon = tag.indexOf(":");
    return colon === -1 ? tag : tag.slice(colon + 1);
}

function attrIndex(el: { attrs: Record<string, string> }): number | null {
    for (const [key, value] of Object.entries(el.attrs)) {
        if (localName(key) === "Index") {
            const n = Number(value);
            return Number.isFinite(n) ? n : null;
        }
    }
    return null;
}

type XmlEl = {
    name: string;
    attrs: Record<string, string>;
    text: string;
    children: XmlEl[];
};

function parseElements(xml: string): XmlEl {
    const root: XmlEl = { name: "#root", attrs: {}, text: "", children: [] };
    const stack: XmlEl[] = [root];
    const re = /<!--[\s\S]*?-->|<([A-Za-zA-Z0-9:._-]+)([^>]*)\/>|<([A-Za-zA-Z0-9:._-]+)([^>]*)>|<\/([A-Za-zA-Z0-9:._-]+)>|([^<]+)/g;

    const parseAttrs = (raw: string) => {
        const attrs: Record<string, string> = {};
        const ar = /([A-Za-zA-Z0-9:._-]+)="([^"]*)"/g;
        let m: RegExpExecArray | null;
        while ((m = ar.exec(raw))) {
            attrs[m[1]] = m[2]
                .replaceAll("&quot;", '"')
                .replaceAll("&amp;", "&")
                .replaceAll("&lt;", "<")
                .replaceAll("&gt;", ">")
                .replaceAll("&apos;", "'");
        }
        return attrs;
    };

    const decode = (s: string) =>
        s
            .replaceAll("&quot;", '"')
            .replaceAll("&amp;", "&")
            .replaceAll("&lt;", "<")
            .replaceAll("&gt;", ">")
            .replaceAll("&apos;", "'")
            .replaceAll("&#10;", "\n")
            .replaceAll("&#13;", "\r");

    let match: RegExpExecArray | null;
    while ((match = re.exec(xml))) {
        if (match[1]) {
            stack[stack.length - 1].children.push({
                name: match[1],
                attrs: parseAttrs(match[2] ?? ""),
                text: "",
                children: [],
            });
            continue;
        }
        if (match[3]) {
            const el: XmlEl = {
                name: match[3],
                attrs: parseAttrs(match[4] ?? ""),
                text: "",
                children: [],
            };
            stack[stack.length - 1].children.push(el);
            stack.push(el);
            continue;
        }
        if (match[5]) {
            if (stack.length > 1) stack.pop();
            continue;
        }
        if (match[6]) {
            stack[stack.length - 1].text += decode(match[6]);
        }
    }

    return root;
}

function findFirst(el: XmlEl, name: string): XmlEl | null {
    if (localName(el.name) === name) return el;
    for (const child of el.children) {
        const found = findFirst(child, name);
        if (found) return found;
    }
    return null;
}

function childrenNamed(el: XmlEl, name: string): XmlEl[] {
    return el.children.filter((c) => localName(c.name) === name);
}

function cellText(cell: XmlEl): string {
    const data = childrenNamed(cell, "Data")[0];
    return (data?.text ?? cell.text ?? "").replace(/\r\n/g, "\n").trim();
}

/**
 * SpreadsheetML → rows of header→value.
 * Duplicate headers become "Категория", "Категория#2", ...
 */
export function parseXml(xml: string): Record<string, string>[] {
    const tree = parseElements(xml);
    const table = findFirst(tree, "Table");
    if (!table) throw new Error("SpreadsheetML Table not found");

    const rows = childrenNamed(table, "Row");
    if (rows.length === 0) return [];

    const headerRow = rows[0];
    const headers = new Map<number, string>();
    const headerCount = new Map<string, number>();
    let col = 1;
    for (const cell of childrenNamed(headerRow, "Cell")) {
        const idx = attrIndex(cell);
        if (idx) col = idx;
        const raw = cellText(cell);
        if (raw) {
            const seen = headerCount.get(raw) ?? 0;
            headerCount.set(raw, seen + 1);
            headers.set(col, seen === 0 ? raw : `${raw}#${seen + 1}`);
        }
        col += 1;
    }

    const out: Record<string, string>[] = [];
    for (const row of rows.slice(1)) {
        const rec: Record<string, string> = {};
        col = 1;
        for (const cell of childrenNamed(row, "Cell")) {
            const idx = attrIndex(cell);
            if (idx) col = idx;
            const header = headers.get(col);
            if (header) rec[header] = cellText(cell);
            col += 1;
        }
        if (Object.values(rec).some((v) => v.trim())) out.push(rec);
    }

    return out;
}

export const SS_NS = SS;
