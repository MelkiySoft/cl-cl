// pnpm structure  (или npm run structure)

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUTPUT_FILE = path.join(ROOT, 'PROJECT_STRUCTURE.md');

const IGNORE = [
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    '.cache',
    'coverage',
    '.vscode',
    '.idea',
    '.env',
    '.env.local',
    '.env.development',
    '.env.production',
    // 'pnpm-lock.yaml',
    // 'package-lock.json',
];

function generateTree(dir, prefix = '') {
    let result = '';
    const items = fs.readdirSync(dir)
        .filter(item => !IGNORE.includes(item))
        .sort((a, b) => {
            const aIsDir = fs.statSync(path.join(dir, a)).isDirectory();
            const bIsDir = fs.statSync(path.join(dir, b)).isDirectory();
            if (aIsDir && !bIsDir) return -1;
            if (!aIsDir && bIsDir) return 1;
            return a.localeCompare(b);
        });

    items.forEach((item, index) => {
        const fullPath = path.join(dir, item);
        const isLast = index === items.length - 1;
        const stat = fs.statSync(fullPath);

        const connector = isLast ? '└── ' : '├── ';
        result += `${prefix}${connector}${item}${stat.isDirectory() ? '/' : ''}\n`;

        if (stat.isDirectory()) {
            const newPrefix = prefix + (isLast ? '    ' : '│   ');
            result += generateTree(fullPath, newPrefix);
        }
    });

    return result;
}

const tree = generateTree(ROOT);

const content = `# Структура проекта cl-cl

> Автоматически сгенерировано скриптом \`scripts/generate-structure.js\`
> 
> Последнее обновление: ${new Date().toISOString()}

\`\`\`bash
${tree}\`\`\`

---

**Примечание:** node_modules, .git, .next и другие служебные папки исключены.
`;

fs.writeFileSync(OUTPUT_FILE, content, 'utf-8');
console.log('✅ PROJECT_STRUCTURE.md успешно обновлён!');