const fs = require('fs');
const path = require('path');

const filesToEdit = [
  'app/portal/mom/page.tsx',
  'app/portal/documents/page.tsx',
  'app/portal/milestones/page.tsx',
  'app/portal/change-requests/page.tsx',
  'app/portal/approvals/page.tsx',
  'app/portal/tickets/page.tsx',
  'app/portal/releases/page.tsx',
  'app/portal/environments/page.tsx',
  'app/portal/team/page.tsx'
];

const basePath = 'c:/Users/Bharathi-Zithtech/Desktop/zithspace1/zithspace-fe/src';

filesToEdit.forEach(relativePath => {
  const fullPath = path.join(basePath, relativePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Most likely it's `padding: "13px 40px 6px 40px",`
    if (content.includes('padding: "13px 40px 6px 40px",')) {
      content = content.replace('padding: "13px 40px 6px 40px",', 'padding: "20px 40px 20px 40px",');
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log('Updated', relativePath);
    } else {
      console.log('Padding string not found in', relativePath);
    }
  } else {
    console.log('File not found:', fullPath);
  }
});
