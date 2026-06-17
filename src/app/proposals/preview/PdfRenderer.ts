import dayjs from 'dayjs';

const getBlockTitle = (block: any) => {
  const data = block.data || {};
  const title = block.title || data.title || data.heading;
  if (title) return title;

  switch (block.type) {
    case 'text': return 'Executive Summary';
    case 'pricing': return 'Investment & Costing';
    case 'scope': return 'Project Scope';
    case 'timeline': return 'Schedule & Timeline';
    case 'signature': return 'Agreement & Sign-Off';
    case 'cover': return 'Cover';
    case 'section': return 'Additional Details';
    default: return block.type ? block.type.charAt(0).toUpperCase() + block.type.slice(1) : 'Section';
  }
};

export const generateCoverHtml = (coverBlock: any) => {
  if (!coverBlock) return '';
  const data = coverBlock.data || {};
  const logo = data.logoUrl || data.logo;

  const rawTitle = data.title || 'PROJECT PROPOSAL';
  const titleWords = rawTitle.trim().toUpperCase().split(/\s+/);
  let titlePart1 = 'PROJECT';
  let titlePart2 = 'PROPOSAL';

  if (titleWords.length === 1 && titleWords[0] !== '') {
    titlePart1 = 'PROJECT';
    titlePart2 = titleWords[0];
  } else if (titleWords.length > 1) {
    const mid = Math.ceil(titleWords.length / 2);
    titlePart1 = titleWords.slice(0, mid).join(' ');
    titlePart2 = titleWords.slice(mid).join(' ');
  }

  let titleFontSize = 64;
  if (rawTitle.length > 40) {
    titleFontSize = 42;
  } else if (rawTitle.length > 25) {
    titleFontSize = 52;
  }

  return `
    <div class="cover-page" style="position: relative; height: 297mm; width: 100%; display: flex; flex-direction: column; box-sizing: border-box; background: white; overflow: hidden; margin: 0; padding: 0; font-family: 'Inter', sans-serif;">
      
      <!-- Light blue chevron -->
      <div style="position: absolute; top: -350px; left: -350px; width: 700px; height: 700px; transform: rotate(45deg); border: 20px solid #7dd3fc; border-radius: 24px; z-index: 1;"></div>
      <!-- Bright blue solid -->
      <div style="position: absolute; top: -300px; left: -300px; width: 600px; height: 600px; transform: rotate(45deg); background: #0ea5e9; border-radius: 24px; z-index: 2;"></div>
      <!-- Dark blue solid -->
      <div style="position: absolute; top: -250px; left: -250px; width: 500px; height: 500px; transform: rotate(45deg); background: linear-gradient(135deg, #1e40af, #020617); border-radius: 24px; z-index: 3; box-shadow: 0 10px 30px rgba(0,0,0,0.15);"></div>

      <!-- Bright blue solid -->
      <div style="position: absolute; bottom: -350px; right: -350px; width: 700px; height: 650px; transform: rotate(45deg); background: #0ea5e9; border-radius: 32px; z-index: 2;"></div>
      <!-- Dark blue solid -->
      <div style="position: absolute; bottom: -250px; right: -300px; width: 500px; height: 600px; transform: rotate(45deg); background: linear-gradient(135deg, #0f172a, #1e3a8a); border-radius: 32px; z-index: 3; box-shadow: 0 10px 30px rgba(0,0,0,0.2);"></div>
      <!-- Top Right Dots Pattern -->
      <div style="position: absolute; top: 180px; right: 100px; width: 120px; height: 220px; background-image: radial-gradient(#94a3b8 2px, transparent 2px); background-size: 24px 24px; opacity: 0.6; z-index: 1;"></div>

      <!-- Center Geometric Diamonds -->
      <div style="position: absolute; top: 55%; left: 50%; transform: translate(-50%, -50%); width: 300px; height: 300px; z-index: 1; opacity: 0.15; pointer-events: none;">
        <div style="position: absolute; top: 40px; left: 100px; width: 100px; height: 100px; border: 2px solid #0f172a; transform: rotate(45deg);"></div>
        <div style="position: absolute; top: 100px; left: 40px; width: 100px; height: 100px; border: 2px solid #0f172a; transform: rotate(45deg);"></div>
        <div style="position: absolute; top: 100px; left: 160px; width: 100px; height: 100px; border: 2px solid #0f172a; transform: rotate(45deg);"></div>
        <div style="position: absolute; top: 160px; left: 100px; width: 100px; height: 100px; border: 2px solid #0f172a; transform: rotate(45deg);"></div>
        <div style="position: absolute; top: 110px; left: 110px; width: 80px; height: 80px; border: 2px solid #0f172a; transform: rotate(45deg);"></div>
        <div style="position: absolute; top: 70px; left: 70px; width: 60px; height: 60px; border: 2px solid #0f172a; transform: rotate(45deg);"></div>
        <div style="position: absolute; top: 170px; left: 170px; width: 60px; height: 60px; border: 2px solid #0f172a; transform: rotate(45deg);"></div>
      </div>

      <!-- Top Right Logo & Company -->
      <div style="position: absolute; top: 80px; right: 100px; z-index: 5; display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
        <span style="font-size: 18px; font-weight: 700; color: #0f172a; letter-spacing: 0.02em;">${data.senderCompany || 'Salford & Co.'}</span>
        ${logo ? `<img src="${logo}" style="height: 64px; width: auto; object-fit: contain; border-radius: 4px;" />` : `
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0c4a6e" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
        `}
      </div>

      <!-- Main Title -->
      <div style="position: absolute; top: 280px; left: 100px; z-index: 5;">
        <div style="font-size: ${titleFontSize}px; font-weight: 900; color: #0c4a6e; line-height: 1.15; letter-spacing: 0.02em; text-transform: uppercase;">
          ${titlePart1}
        </div>
        <div style="font-size: ${titleFontSize}px; font-weight: 900; color: #0c4a6e; line-height: 1.15; letter-spacing: 0.02em; text-transform: uppercase;">
          ${titlePart2}
        </div>

        <!-- Prepared For -->
        <div style="margin-top: 50px; font-family: 'Inter', sans-serif;">
          <div style="font-size: 14px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin-bottom: 12px;">PREPARED FOR:</div>
          <div style="display: flex; flex-direction: column; gap: 4px; border-left: 2px solid #0ea5e9; padding-left: 16px;">
            <div style="font-size: 20px; font-weight: 800; color: #0f172a;">
              ${data.clientName || data.clientCompany || 'Client Name'}
            </div>
            ${data.clientCompany && data.clientName !== data.clientCompany ? `<div style="font-size: 15px; font-weight: 600; color: #475569;">${data.clientCompany}</div>` : ''}
            ${data.clientEmail ? `<div style="font-size: 14px; color: #475569; margin-top: 4px;">${data.clientEmail}</div>` : ''}
            ${data.clientPhone ? `<div style="font-size: 14px; color: #475569;">${data.clientPhone}</div>` : ''}
            ${data.clientAddress ? `<div style="font-size: 14px; color: #475569;">${data.clientAddress}</div>` : ''}
          </div>
        </div>
      </div>

      <!-- Bottom Left Prepared By Details -->
      <div style="position: absolute; bottom: 80px; left: 100px; z-index: 5; font-family: 'Inter', sans-serif;">
        <div style="font-size: 14px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin-bottom: 12px;">PREPARED BY:</div>
        <div style="display: flex; flex-direction: column; gap: 4px; border-left: 2px solid #0ea5e9; padding-left: 16px;">
          <div style="font-size: 20px; font-weight: 800; color: #0f172a;">
            ${data.senderName || 'Your Name'}
          </div>
          ${(data.senderTitle || data.senderRole || data.senderPosition) ? `<div style="font-size: 15px; font-weight: 600; color: #475569;">${data.senderTitle || data.senderRole || data.senderPosition}</div>` : `<div style="font-size: 15px; font-weight: 600; color: #475569;">Manager</div>`}
          ${data.senderEmail ? `<div style="font-size: 14px; color: #475569; margin-top: 4px;">${data.senderEmail}</div>` : ''}
          ${data.senderPhone ? `<div style="font-size: 14px; color: #475569;">${data.senderPhone}</div>` : ''}
          ${data.senderWebsite ? `<div style="font-size: 14px; color: #475569;">${data.senderWebsite}</div>` : ''}
          ${data.senderAddress ? `<div style="font-size: 14px; color: #475569;">${data.senderAddress}</div>` : ''}
        </div>
      </div>
    </div>
  `;
};

export const generateTocHtml = (blocks: any[], proposalTitle: string) => {
  const tocItems = blocks.filter((b: any) => {
    const title = getBlockTitle(b);
    if (proposalTitle && title && title.trim().toLowerCase() === proposalTitle.trim().toLowerCase()) {
      return false;
    }

    const data = b.data || {};
    const hasTitle = b.title || data.title || data.heading;
    if (hasTitle) return true;
    const validTypes = ['text', 'pricing', 'scope', 'timeline', 'signature', 'section'];
    return validTypes.includes(b.type);
  });

  if (tocItems.length === 0) return '';

  return `
  <div style="padding: 100px 120px; box-sizing: border-box; min-height: 297mm; background: white; font-family: 'Inter', sans-serif; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); margin-bottom: 32px; border-radius: 8px;">
    <h2 style="font-size: 48px; font-weight: 900; color: #0c4a6e; margin-bottom: 60px; text-transform: uppercase; letter-spacing: 0.02em;">TABLE OF CONTENTS</h2>
    <div style="display: flex; flex-direction: column;">
      ${tocItems.map((block: any, index: number) => {
    let title = getBlockTitle(block);
    if (title === title.toUpperCase() && title.length > 3) {
      title = title.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    return `
           <div style="display: flex; align-items: center; border-bottom: 1px solid #f1f5f9; padding: 24px 0;">
             <div style="font-size: 24px; font-weight: 800; color: #0ea5e9; margin-right: 40px; min-width: 40px;">
               ${String(index + 1).padStart(2, '0')}
             </div>
             <div style="font-size: 20px; font-weight: 600; color: #334155;">
               ${title}
             </div>
           </div>
         `;
  }).join('')}
    </div>
  </div>
  `;
};
