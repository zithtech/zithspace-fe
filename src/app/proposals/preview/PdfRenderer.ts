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
  const theme = data.theme || 'elegant-classic';

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

  const senderSection = `
      <div style="position: absolute; bottom: 80px; left: 100px; z-index: 5; font-family: 'Inter', sans-serif;">
        <div style="font-size: 14px; font-weight: 700; color: ${theme === 'bold-dark' ? '#dc2626' : '#64748b'}; letter-spacing: 0.05em; margin-bottom: 12px;">PREPARED BY:</div>
        <div style="display: flex; flex-direction: column; gap: 4px; border-left: 2px solid ${theme === 'bold-dark' ? '#dc2626' : (theme === 'minimalist-light' ? '#10b981' : '#1e293b')}; padding-left: 16px;">
          <div style="font-size: 20px; font-weight: 800; color: ${theme === 'bold-dark' ? '#0f172a' : (theme === 'minimalist-light' ? '#10b981' : '#1e293b')};">
            ${data.senderName || 'Your Name'}
          </div>
          ${(data.senderTitle || data.senderRole || data.senderPosition) ? `<div style="font-size: 15px; font-weight: 600; color: ${theme === 'bold-dark' ? '#334155' : '#475569'};">${data.senderTitle || data.senderRole || data.senderPosition}</div>` : `<div style="font-size: 15px; font-weight: 600; color: ${theme === 'bold-dark' ? '#334155' : '#475569'};">Manager</div>`}
          ${data.senderEmail ? `<div style="font-size: 14px; color: ${theme === 'bold-dark' ? '#334155' : '#475569'}; margin-top: 4px;">${data.senderEmail}</div>` : ''}
          ${data.senderPhone ? `<div style="font-size: 14px; color: ${theme === 'bold-dark' ? '#334155' : '#475569'};">${data.senderPhone}</div>` : ''}
          ${data.senderWebsite ? `<div style="font-size: 14px; color: ${theme === 'bold-dark' ? '#334155' : '#475569'};">${data.senderWebsite}</div>` : ''}
          ${data.senderAddress ? `<div style="font-size: 14px; color: ${theme === 'bold-dark' ? '#334155' : '#475569'};">${data.senderAddress}</div>` : ''}
        </div>
      </div>
  `;

  const clientSection = `
        <div style="margin-top: 50px; font-family: 'Inter', sans-serif;">
          <div style="font-size: 14px; font-weight: 700; color: ${theme === 'bold-dark' ? '#dc2626' : '#64748b'}; letter-spacing: 0.05em; margin-bottom: 12px;">PREPARED FOR:</div>
          <div style="display: flex; flex-direction: column; gap: 4px; border-left: 2px solid ${theme === 'bold-dark' ? '#dc2626' : (theme === 'minimalist-light' ? '#10b981' : '#1e293b')}; padding-left: 16px;">
            <div style="font-size: 20px; font-weight: 800; color: ${theme === 'bold-dark' ? '#0f172a' : (theme === 'minimalist-light' ? '#10b981' : '#1e293b')};">
              ${data.clientName || data.clientCompany || 'Client Name'}
            </div>
            ${data.clientCompany && data.clientName !== data.clientCompany ? `<div style="font-size: 15px; font-weight: 600; color: ${theme === 'bold-dark' ? '#334155' : '#475569'};">${data.clientCompany}</div>` : ''}
            ${data.clientEmail ? `<div style="font-size: 14px; color: ${theme === 'bold-dark' ? '#334155' : '#475569'}; margin-top: 4px;">${data.clientEmail}</div>` : ''}
            ${data.clientPhone ? `<div style="font-size: 14px; color: ${theme === 'bold-dark' ? '#334155' : '#475569'};">${data.clientPhone}</div>` : ''}
            ${data.clientAddress ? `<div style="font-size: 14px; color: ${theme === 'bold-dark' ? '#334155' : '#475569'};">${data.clientAddress}</div>` : ''}
          </div>
        </div>
  `;

  const topRightLogo = `
      <div style="position: absolute; top: 80px; right: 100px; z-index: 5; display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
        <span style="font-size: 18px; font-weight: 700; color: ${theme === 'bold-dark' ? '#dc2626' : '#0f172a'}; letter-spacing: 0.02em;">${data.senderCompany || 'Salford & Co.'}</span>
        ${logo ? `<img src="${logo}" style="height: 64px; width: auto; object-fit: contain; border-radius: 4px;" />` : `
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${theme === 'bold-dark' ? '#dc2626' : '#1e293b'}" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
        `}
      </div>
  `;

  if (theme === 'minimalist-light') {
    return `
      <div class="cover-page" style="position: relative; height: 297mm; width: 100%; display: flex; flex-direction: column; box-sizing: border-box; background: #ffffff; overflow: hidden; margin: 0; padding: 0; font-family: 'Inter', sans-serif;">
        <!-- Top Right Waves -->
        <svg style="position: absolute; top: 0; right: 0; width: 500px; height: 600px; z-index: 2;" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 20 0 C 40 30, 80 60, 100 90 L 100 0 Z" fill="#1e293b" />
          <path d="M 40 0 C 50 20, 85 45, 100 70 L 100 0 Z" fill="#10b981" />
          <path d="M 60 0 C 65 10, 90 30, 100 50 L 100 0 Z" fill="#1e293b" />
        </svg>

        <!-- Bottom Left Waves -->
        <svg style="position: absolute; bottom: 0; left: 0; width: 100%; height: 250px; z-index: 2;" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 0 30 C 30 35, 70 80, 100 100 L 0 100 Z" fill="#1e293b" />
          <path d="M 0 50 C 20 50, 50 85, 80 100 L 0 100 Z" fill="#10b981" />
          <path d="M 0 70 C 15 70, 35 90, 60 100 L 0 100 Z" fill="#1e293b" />
        </svg>

        ${topRightLogo.replace('right: 100px;', 'left: 100px; right: auto; text-align: left; align-items: flex-start;')}

        <div style="position: absolute; top: 220px; left: 100px; z-index: 5; width: 55%; max-width: 650px;">
          <div style="font-size: ${titleFontSize}px; font-weight: 800; color: #1e293b; line-height: 1.15; letter-spacing: -0.02em; text-transform: uppercase; word-wrap: break-word; overflow-wrap: break-word;">
            ${titlePart1}
          </div>
          <div style="font-size: ${titleFontSize}px; font-weight: 800; color: #1e293b; line-height: 1.15; letter-spacing: -0.02em; text-transform: uppercase; word-wrap: break-word; overflow-wrap: break-word;">
            ${titlePart2}
          </div>

          <div style="margin-top: 60px;">
            ${senderSection.replace('position: absolute; bottom: 80px; left: 100px;', 'position: relative; margin-bottom: 40px;')}
            ${clientSection.replace('margin-top: 50px;', 'margin-top: 0;')}
          </div>
        </div>
      </div>
    `;
  }

  if (theme === 'bold-dark') {
    return `
      <div class="cover-page" style="position: relative; height: 297mm; width: 100%; display: flex; flex-direction: column; box-sizing: border-box; background: #f8fafc; overflow: hidden; margin: 0; padding: 0; font-family: 'Inter', sans-serif;">
        <!-- Top right dotted pattern -->
        <div style="position: absolute; top: -50px; right: -50px; width: 300px; height: 300px; background-image: radial-gradient(#dc2626 2px, transparent 2px); background-size: 16px 16px; opacity: 0.2; transform: rotate(45deg); z-index: 1;"></div>
        
        <!-- Top left geometric blocks -->
        <svg style="position: absolute; top: 0; left: 0; width: 300px; height: 300px; z-index: 2;" viewBox="0 0 300 300" preserveAspectRatio="none">
          <polygon points="0,0 300,0 0,300" fill="#334155" />
          <polygon points="0,0 200,0 0,200" fill="#dc2626" />
        </svg>

        <!-- Bottom right geometric blocks -->
        <svg style="position: absolute; bottom: 0; right: 0; width: 600px; height: 500px; z-index: 2;" viewBox="0 0 600 500" preserveAspectRatio="none">
          <polygon points="0,500 600,0 600,500" fill="#475569" />
          <polygon points="120,500 600,100 600,500" fill="#1e293b" />
          <polygon points="240,500 600,200 600,500" fill="#dc2626" />
        </svg>

        <!-- Top Right Logo -->
        ${topRightLogo}

        <!-- Main Title & Client -->
        <div style="position: absolute; top: 240px; left: 100px; z-index: 5; max-width: 650px;">
          <div style="font-size: ${titleFontSize}px; font-weight: 900; color: #0f172a; line-height: 1.15; letter-spacing: -0.02em; text-transform: uppercase; word-wrap: break-word; overflow-wrap: break-word;">
            ${titlePart1}
          </div>
          <div style="font-size: ${titleFontSize}px; font-weight: 900; color: #dc2626; line-height: 1.15; letter-spacing: -0.02em; text-transform: uppercase; word-wrap: break-word; overflow-wrap: break-word;">
            ${titlePart2}
          </div>

          <div style="margin-top: 60px;">
            ${clientSection.replace('margin-top: 50px;', 'margin-top: 0;')}
            <div style="height: 40px;"></div>
            ${senderSection.replace('position: absolute; bottom: 80px; left: 100px;', 'position: relative;')}
          </div>
        </div>
      </div>
    `;
  }

  if (theme === 'elegant-classic') {
    return `
      <div class="cover-page" style="position: relative; height: 297mm; width: 100%; display: flex; flex-direction: column; box-sizing: border-box; background: #ffffff; overflow: hidden; margin: 0; padding: 0; font-family: 'Inter', sans-serif;">
        <!-- Right side vertical wave -->
        <svg style="position: absolute; top: 0; right: 0; width: 45%; height: 100%; z-index: 1;" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 50 0 C 20 40, 90 60, 40 100 L 100 100 L 100 0 Z" fill="#1e293b" />
          <path d="M 40 0 C 10 40, 80 60, 30 100" fill="none" stroke="#1f2937" stroke-width="4" vector-effect="non-scaling-stroke" />
        </svg>

        <!-- Top Left Logo -->
        ${topRightLogo.replace('right: 100px;', 'left: 100px; right: auto; text-align: left; align-items: flex-start;')}

        <div style="position: absolute; top: 220px; left: 100px; z-index: 5; width: 50%; max-width: 650px;">
          <div style="font-size: ${titleFontSize}px; font-weight: 700; color: #1e293b; line-height: 1.15; letter-spacing: 0.05em; text-transform: uppercase; word-wrap: break-word; overflow-wrap: break-word;">
            ${titlePart1}
          </div>
          <div style="font-size: ${titleFontSize}px; font-weight: 700; color: #1e293b; line-height: 1.15; letter-spacing: 0.05em; text-transform: uppercase; word-wrap: break-word; overflow-wrap: break-word;">
            ${titlePart2}
          </div>

          <div style="margin-top: 80px;">
            ${clientSection.replace('margin-top: 50px;', 'margin-top: 0;')}
          </div>
        </div>

        ${senderSection}
      </div>
    `;
  }

  // Default fallback: modern-blue
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

      ${topRightLogo}

      <!-- Main Title -->
      <div style="position: absolute; top: 280px; left: 100px; z-index: 5; max-width: 650px;">
        <div style="font-size: ${titleFontSize}px; font-weight: 900; color: #0c4a6e; line-height: 1.15; letter-spacing: 0.02em; text-transform: uppercase; word-wrap: break-word; overflow-wrap: break-word;">
          ${titlePart1}
        </div>
        <div style="font-size: ${titleFontSize}px; font-weight: 900; color: #0c4a6e; line-height: 1.15; letter-spacing: 0.02em; text-transform: uppercase; word-wrap: break-word; overflow-wrap: break-word;">
          ${titlePart2}
        </div>

        ${clientSection}
      </div>

      ${senderSection}
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
