import fs from 'fs';

const content = fs.readFileSync('/Users/zithmi/z-space/zithspace-fe/src/components/projects/drawer/TicketDetailDrawer.tsx', 'utf8');
const lines = content.split('\n');

let divStack = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opener = line.match(/<div(?:\s|>|$)/g);
    const closer = line.match(/<\/div>/g);
    
    if (opener) {
        for (let j = 0; j < opener.length; j++) divStack.push(i + 1);
    }
    if (closer) {
        for (let j = 0; j < closer.length; j++) {
            if (divStack.length === 0) {
                console.log(`Extra </div> at line ${i + 1}`);
            } else {
                divStack.pop();
            }
        }
    }
}

if (divStack.length > 0) {
    console.log(`Unclosed <div> starts at lines: ${divStack.join(', ')}`);
} else {
    console.log('Divs are balanced.');
}
