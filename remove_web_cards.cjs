const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/Analytics.tsx', 'utf8');

const targetStr = `<div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">`;
const endStr = `</div>

      <div className="flex flex-wrap items-center gap-3">`;

if (content.includes(targetStr)) {
  const startIndex = content.indexOf(targetStr);
  const endIndex = content.indexOf(endStr);
  if (endIndex > startIndex) {
    const chunkToRemove = content.substring(startIndex, endIndex + 6); // include </div>
    content = content.replace(chunkToRemove, '');
    fs.writeFileSync('src/pages/admin/Analytics.tsx', content);
    console.log('Removed StatCard grid from web!');
  } else {
    console.log('endStr not found after targetStr');
  }
} else {
  console.log('targetStr not found');
}
