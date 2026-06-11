const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.next')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.md') || file.endsWith('.xml') || file.endsWith('.gradle') || file.endsWith('.gql') || file.endsWith('.java')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('.');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.toLowerCase().includes('codex-teams')) {
        let newContent = content
            .replace(/Codex Teams/g, 'Codex Teams')
            .replace(/CODEX TEAMS/g, 'CODEX TEAMS')
            .replace(/codex-teams\.dev/g, 'codexteams.dev')
            .replace(/codex-teams\.app\.hq/g, 'codexteams.app.hq')
            .replace(/codex-teams-appearance/g, 'codex-teams-appearance')
            .replace(/codex-teams/g, 'codex-teams');

        if (content !== newContent) {
            fs.writeFileSync(file, newContent, 'utf8');
            console.log(`Updated: ${file}`);
        }
    }
});
