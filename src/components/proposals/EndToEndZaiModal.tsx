'use client';

import React, { useState } from 'react';
import { Button, Modal, Input, message, Typography, Progress, Checkbox, Dropdown, Popover, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Sparkles, Wand2, Zap, User, Mail, Phone, MapPin, Building, Briefcase, Link } from 'lucide-react';
import { ProposalService } from '@/services/proposalService';
import { useProposalStore, BlockType } from '@/store/proposalStore';
import { nanoid } from 'nanoid';
import { BLOCK_META } from './BlockPalette';
import { PALETTE } from './library/composerComponents';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useActiveCompany, useCompanies } from '@/hooks/useCompanies';
import { useQuery } from '@tanstack/react-query';
import { CompanyLocationService } from '@/services/companyLocationService';

const { Text } = Typography;

const QUICK_TEMPLATES = [
  {
    title: 'Driver Booking App',
    icon: '🚗',
    body:
      'Create proposal for driver booking app with start date 01/05/2026 and end with 23/07/2026 with 5 phases and 3 lakhs budget with 3 terms. Include rider & driver mobile apps, real-time tracking, payments, ratings, and an admin dashboard.',
  },
  {
    title: 'E-commerce Redesign',
    icon: '🛒',
    body:
      'Create proposal for e-commerce redesign over 8 weeks with 4 phases and $25,000 budget covering UI/UX research, design system, Next.js frontend, Stripe & shipping integrations, performance optimization and QA before launch.',
  },
];

const DEFAULT_TERMS_HINT = 'Add infra cost like server, DB, third party integration and all other services and integrations based on the project will be handled by the client side.';

interface ParsedBrief {
  phaseCount?: number;
  termsCount?: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  budgetText?: string;
  budgetAmount?: number;
  currency?: string;
  projectName?: string;
}

const toIsoDate = (d: Date) => d.toISOString().split('T')[0];

const tryParseDate = (raw: string): string | undefined => {
  // Accept dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd
  const slash = raw.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (slash) {
    let [, d, m, y] = slash;
    if (y.length === 2) y = '20' + y;
    const dt = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00Z`);
    if (!isNaN(dt.getTime())) return toIsoDate(dt);
  }
  const iso = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const dt = new Date(`${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}T00:00:00Z`);
    if (!isNaN(dt.getTime())) return toIsoDate(dt);
  }
  return undefined;
};

const parseBrief = (text: string): ParsedBrief => {
  const lower = text.toLowerCase();
  const out: ParsedBrief = {};

  const phaseMatch = lower.match(/(\d+)\s*phases?/);
  if (phaseMatch) out.phaseCount = Math.min(20, Math.max(1, parseInt(phaseMatch[1], 10)));

  const termsMatch = lower.match(/(\d+)\s*terms?/);
  if (termsMatch) out.termsCount = Math.min(10, Math.max(1, parseInt(termsMatch[1], 10)));

  const dateMatches = text.match(/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{1,2}-\d{1,2}/g) || [];
  if (dateMatches[0]) out.startDate = tryParseDate(dateMatches[0]);
  if (dateMatches[1]) out.endDate = tryParseDate(dateMatches[1]);

  // Budget — look for "X lakh", "X crore", "$X", "Xk", "X,000"
  const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*lakhs?/);
  const croreMatch = lower.match(/(\d+(?:\.\d+)?)\s*crores?/);
  const dollarMatch = text.match(/\$\s*([\d,]+(?:\.\d+)?)\s*([kKmM])?/);
  const inrMatch = text.match(/(?:rs\.?|inr|₹)\s*([\d,]+)/i);
  const plainK = lower.match(/(\d+(?:\.\d+)?)\s*k\b/);

  if (lakhMatch) {
    const amt = parseFloat(lakhMatch[1]) * 100000;
    out.budgetAmount = amt;
    out.currency = 'INR';
    out.budgetText = `${lakhMatch[1]} lakh INR`;
  } else if (croreMatch) {
    const amt = parseFloat(croreMatch[1]) * 10000000;
    out.budgetAmount = amt;
    out.currency = 'INR';
    out.budgetText = `${croreMatch[1]} crore INR`;
  } else if (dollarMatch) {
    let amt = parseFloat(dollarMatch[1].replace(/,/g, ''));
    if (dollarMatch[2] && /k/i.test(dollarMatch[2])) amt *= 1000;
    if (dollarMatch[2] && /m/i.test(dollarMatch[2])) amt *= 1_000_000;
    out.budgetAmount = amt;
    out.currency = 'USD';
    out.budgetText = `$${amt.toLocaleString()}`;
  } else if (inrMatch) {
    out.budgetAmount = parseFloat(inrMatch[1].replace(/,/g, ''));
    out.currency = 'INR';
    out.budgetText = `INR ${out.budgetAmount.toLocaleString()}`;
  } else if (plainK) {
    out.budgetAmount = parseFloat(plainK[1]) * 1000;
    out.currency = 'USD';
    out.budgetText = `$${out.budgetAmount.toLocaleString()}`;
  }

  // Project name — naive extraction: "for X with/start/over/and"
  const nameMatch = text.match(/for\s+([^,.]+?)(?:\s+(?:with|over|and|covering|including|starting|from)\b|$)/i);
  if (nameMatch) out.projectName = nameMatch[1].trim();

  return out;
};

const padPhases = <T extends { id?: string; title?: string }>(arr: T[], target: number, factory: (idx: number) => T): T[] => {
  const out = [...arr];
  while (out.length < target) {
    out.push(factory(out.length));
  }
  return out.slice(0, target);
};

const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '').trim();

const distributeDeadlines = (start?: string, end?: string, count = 4): string[] => {
  if (!start || !end) return new Array(count).fill('');
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) return new Array(count).fill('');
  const span = endMs - startMs;
  const dates: string[] = [];
  for (let i = 1; i <= count; i++) {
    const t = startMs + (span * i) / count;
    dates.push(toIsoDate(new Date(t)));
  }
  return dates;
};

const normaliseBlockData = (type: BlockType, raw: any, brief: ParsedBrief, coverDetails?: any): any => {
  const data = raw && typeof raw === 'object' ? { ...raw } : {};

  if (type === 'cover') {
    if (!data.title) data.title = brief.projectName ? `${brief.projectName} — Project Proposal` : 'Project Proposal';
    if (!data.projectSummary || (typeof data.projectSummary === 'string' && stripHtml(data.projectSummary).length === 0)) {
      data.projectSummary = `<p>A comprehensive proposal${brief.projectName ? ` for ${brief.projectName}` : ''}${brief.startDate && brief.endDate ? ` running from ${brief.startDate} to ${brief.endDate}` : ''}${brief.budgetText ? ` with a total investment of ${brief.budgetText}` : ''}.</p>`;
    }
    if (!data.date && brief.startDate) data.date = brief.startDate;
    if (!data.validUntil && brief.endDate) data.validUntil = brief.endDate;
    if (!data.senderWebsite) data.senderWebsite = '';

    if (coverDetails?.senderName) data.senderName = coverDetails.senderName;
    if (coverDetails?.senderPosition) data.senderPosition = coverDetails.senderPosition;
    if (coverDetails?.senderEmail) data.senderEmail = coverDetails.senderEmail;
    if (coverDetails?.senderCompany) data.senderCompany = coverDetails.senderCompany;
    if (coverDetails?.senderContact) data.senderContact = coverDetails.senderContact;
    if (coverDetails?.senderAddress) data.senderAddress = coverDetails.senderAddress;
    if (coverDetails?.senderWebsite) data.senderWebsite = coverDetails.senderWebsite;
    if (coverDetails?.theme) data.theme = coverDetails.theme;

    if (coverDetails?.clientName) data.clientName = coverDetails.clientName;
    if (coverDetails?.clientCompany) data.clientCompany = coverDetails.clientCompany;
    if (coverDetails?.clientEmail) data.clientEmail = coverDetails.clientEmail;
    if (coverDetails?.clientPhone) data.clientPhone = coverDetails.clientPhone;
    if (coverDetails?.clientAddress) data.clientAddress = coverDetails.clientAddress;

    return data;
  }

  if (type === 'text') {
    if (!data.heading || stripHtml(String(data.heading)).length === 0) {
      data.heading = 'Executive Summary';
    }
    if (!data.content || stripHtml(String(data.content)).length === 0) {
      data.content = `<p>This proposal outlines our recommended approach${brief.projectName ? ` for ${brief.projectName}` : ''}, the milestones we will deliver, and the investment required.</p>`;
    }
    return data;
  }

  if (type === 'scope') {
    if (!data.title) data.title = 'Scope of Work';
    const targetPhases = brief.phaseCount || (Array.isArray(data.milestones) ? data.milestones.length : 0) || 4;
    data.milestones = padPhases(
      Array.isArray(data.milestones) ? data.milestones : [],
      targetPhases,
      (i) => ({
        id: nanoid(),
        title: `Phase ${i + 1}`,
        deliverables: 'Define deliverables for this phase.',
        tasks: 'Task to be defined\nTask to be defined\nTask to be defined',
      }),
    ).map((m: any) => ({
      id: m.id || nanoid(),
      title: m.title || `Phase`,
      deliverables: m.deliverables || '',
      tasks: m.tasks || '',
    }));

    const targetTerms = brief.termsCount || (Array.isArray(data.terms) ? data.terms.length : 0) || 2;
    data.terms = padPhases(
      Array.isArray(data.terms) ? data.terms : [],
      targetTerms,
      (i) => ({
        id: nanoid(),
        title: i === 0 ? 'Exclusions' : i === 1 ? 'Revision Policy' : `Term ${i + 1}`,
        description: '<p>To be defined.</p>',
        color: i === 0 ? '#ef4444' : '#3b82f6',
      }),
    ).map((t: any) => ({
      id: t.id || nanoid(),
      title: t.title || 'Term',
      description: t.description || '<p></p>',
      color: t.color || '#3b82f6',
    }));
    return data;
  }

  if (type === 'timeline') {
    if (!data.title) data.title = 'Timeline & Schedule';
    if (!data.startDate && brief.startDate) data.startDate = brief.startDate;
    if (!data.finalDate && brief.endDate) data.finalDate = brief.endDate;
    const targetPhases = brief.phaseCount || (Array.isArray(data.phases) ? data.phases.length : 0) || 4;
    const distributed = distributeDeadlines(data.startDate, data.finalDate, targetPhases);
    data.phases = padPhases(
      Array.isArray(data.phases) ? data.phases : [],
      targetPhases,
      (i) => ({
        id: nanoid(),
        title: `Phase ${i + 1}`,
        deadline: distributed[i] || '',
        reviewPeriod: '3 Days',
        description: 'Phase milestone description.',
      }),
    ).map((p: any, i: number) => ({
      id: p.id || nanoid(),
      title: p.title || `Phase ${i + 1}`,
      deadline: p.deadline || distributed[i] || '',
      reviewPeriod: p.reviewPeriod || '3 Days',
      description: p.description || '',
    }));
    if (!data.dependencyNotes || stripHtml(String(data.dependencyNotes)).length === 0) {
      data.dependencyNotes = '<p>All deadlines depend on timely client feedback. Review SLAs apply at each milestone.</p>';
    }
    return data;
  }

  if (type === 'pricing') {
    if (!data.title) data.title = 'Investment';
    data.currency = data.currency || brief.currency || 'USD';
    const targetItems = brief.phaseCount || (Array.isArray(data.items) ? data.items.length : 0) || 4;
    let items: any[] = Array.isArray(data.items) ? data.items : [];
    items = padPhases(items, targetItems, (i) => ({
      id: nanoid(),
      name: `Phase ${i + 1}`,
      description: 'Phase deliverables',
      price: 0,
      quantity: 1,
    })).map((it: any) => ({
      id: it.id || nanoid(),
      name: it.name || 'Line item',
      description: it.description || '',
      price: Number(it.price) || 0,
      quantity: Number(it.quantity) || 1,
    }));

    if (brief.budgetAmount && brief.budgetAmount > 0) {
      const currentTotal = items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
      if (currentTotal === 0) {
        const split = Math.round(brief.budgetAmount / items.length);
        let assigned = 0;
        items = items.map((it, idx) => {
          const isLast = idx === items.length - 1;
          const price = isLast ? brief.budgetAmount! - assigned : split;
          assigned += price;
          return { ...it, price, quantity: 1 };
        });
      }
    }

    data.items = items;
    data.taxRate = Number(data.taxRate) || 0;
    return data;
  }

  if (type === 'signature') {
    if (!data.title) data.title = 'Terms & Conditions';
    if (!data.ipClause) data.ipClause = '<p>Final deliverables transfer to the client upon full payment.</p>';
    if (!data.revisionClause) data.revisionClause = '<p>Includes 2 rounds of revisions per milestone. Major scope changes require a change order.</p>';
    if (!data.terminationClause) data.terminationClause = '<p>Either party may terminate with 7 days written notice. Work completed up to that date will be invoiced.</p>';
    if (!data.ndaClause) data.ndaClause = '<p>Both parties agree to keep proprietary information confidential.</p>';
    data.companyName = coverDetails?.senderCompany || data.companyName || 'Your Agency LLC';
    data.clientName = coverDetails?.clientName || data.clientName || (brief.projectName ? `${brief.projectName} (Client)` : 'Client Company');
    data.companySigner = coverDetails?.senderName || data.companySigner || 'Authorized Signer';
    if (!data.clientSigner) data.clientSigner = 'Authorized Signer';
    return data;
  }

  return data;
};

const buildPhasesOrder = (brief: ParsedBrief, userPrompt: string, extraTerms: string, coverDetails?: any): { type: BlockType; label: string; hint: string }[] => {
  const briefSummary = [
    brief.projectName ? `Project: ${brief.projectName}` : null,
    brief.phaseCount ? `Phase count: ${brief.phaseCount}` : null,
    brief.termsCount ? `Terms count: ${brief.termsCount}` : null,
    brief.startDate ? `Start date: ${brief.startDate}` : null,
    brief.endDate ? `End date: ${brief.endDate}` : null,
    brief.budgetText ? `Budget: ${brief.budgetText}` : null,
    brief.currency ? `Currency: ${brief.currency}` : null,
  ].filter(Boolean).join(' | ');

  const currentYear = new Date().getFullYear();
  const currentDate = new Date().toISOString().split('T')[0];
  const baseContext = `User brief: "${userPrompt}"\n\nParsed brief: ${briefSummary || 'none'}\n\nIMPORTANT CONTEXT:\n- The current date is ${currentDate}, and the current year is ${currentYear}.\n- All timelines, dates, and deadlines you generate MUST be set in the current year (${currentYear}) or later.\n- NEVER generate a deadline in the past (before ${currentDate}).`;

  const senderName = coverDetails?.senderName || "<your contact name>";
  const senderPosition = coverDetails?.senderPosition || "<your position/designation>";
  const senderCompany = coverDetails?.senderCompany || "<your agency name>";
  const senderContact = coverDetails?.senderContact || "<your phone>";
  const senderEmail = coverDetails?.senderEmail || "<your email>";
  const senderAddress = coverDetails?.senderAddress || "<your address>";
  const senderWebsite = coverDetails?.senderWebsite || "<your website url>";

  const clientName = coverDetails?.clientName || "<best-guess client contact name>";
  const clientCompany = coverDetails?.clientCompany || "<best-guess client company>";
  const clientEmail = coverDetails?.clientEmail || "<plausible email>";
  const clientPhone = coverDetails?.clientPhone || "<plausible phone>";
  const clientAddress = coverDetails?.clientAddress || "<plausible single-line address>";

  return [
    {
      type: 'cover',
      label: 'Drafting cover page…',
      hint: `${baseContext}

Return JSON for a "cover" block with EXACTLY these fields, all required and non-empty:
{
  "title": "<concise project title — max 8 words>",
  "projectSummary": "<1-2 short paragraphs (HTML <p> tags) — describe goal, scope, expected outcome>",
  "clientName": "${clientName}",
  "clientCompany": "${clientCompany}",
  "clientEmail": "${clientEmail}",
  "clientPhone": "${clientPhone}",
  "clientAddress": "${clientAddress}",
  "senderName": "${senderName}",
  "senderPosition": "${senderPosition}",
  "senderCompany": "${senderCompany}",
  "senderContact": "${senderContact}",
  "senderEmail": "${senderEmail}",
  "senderWebsite": "${senderWebsite}",
  "senderAddress": "${senderAddress}",
  "date": "${brief.startDate || ''}",
  "validUntil": "${brief.endDate || ''}"
}
projectSummary is mandatory and must be filled.`,
    },
    {
      type: 'text',
      label: 'Writing executive summary…',
      hint: `${baseContext}

Return JSON for a "text" block with EXACTLY:
{
  "heading": "Executive Summary",
  "content": "<2-3 short HTML paragraphs that frame the problem, the approach, the outcome>"
}
heading is mandatory — always set it to "Executive Summary".
content must be HTML (<p>...</p>).`,
    },
    {
      type: 'scope',
      label: 'Structuring scope of work…',
      hint: `${baseContext}

Return JSON for a "scope" block with EXACTLY this shape:
{
  "title": "Scope of Work",
  "milestones": [ /* EXACTLY ${brief.phaseCount || 4} entries */
    { "id": "<unique>", "title": "Phase N: <name>", "deliverables": "<comma-separated artefacts>", "tasks": "<task line 1>\\n<task line 2>\\n<task line 3>" }
  ],
  "terms": [ /* ${brief.termsCount || 2} entries */
    { "id": "<unique>", "title": "<term name>", "description": "<1 short HTML paragraph>", "color": "#3b82f6" }
  ]
}
The milestones array MUST contain exactly ${brief.phaseCount || 4} phases — no fewer, no more. Each phase must have a distinct title, concrete deliverables, and at least 3 detailed tasks separated by \\n.`,
    },
    {
      type: 'timeline',
      label: 'Building timeline…',
      hint: `${baseContext}

Return JSON for a "timeline" block with EXACTLY:
{
  "title": "Timeline & Schedule",
  "startDate": "${brief.startDate || ''}",
  "finalDate": "${brief.endDate || ''}",
  "dependencyNotes": "<short HTML paragraph about review SLAs and dependencies>",
  "phases": [ /* EXACTLY ${brief.phaseCount || 4} entries — distribute deadlines evenly between startDate and finalDate */
    { "id": "<unique>", "title": "Phase N: <name>", "deadline": "<YYYY-MM-DD>", "reviewPeriod": "3 Days", "description": "<one short sentence>" }
  ]
}
The phases array MUST contain exactly ${brief.phaseCount || 4} entries.`,
    },
    {
      type: 'pricing',
      label: 'Pricing the engagement…',
      hint: `${baseContext}

Return JSON for a "pricing" block with EXACTLY:
{
  "title": "Investment",
  "currency": "${brief.currency || 'USD'}",
  "items": [ /* one item per phase, ${brief.phaseCount || 4} items, prices summing to the total budget */
    { "id": "<unique>", "name": "<phase name>", "description": "<short>", "price": <number>, "quantity": 1 }
  ],
  "taxRate": 0
}
Total of all (price * quantity) must equal ${brief.budgetAmount ?? 'the total budget mentioned'}.`,
    },
    {
      type: 'signature',
      label: 'Composing terms…',
      hint: `${baseContext}

Clause directive (must be reflected in clauses): "${extraTerms || DEFAULT_TERMS_HINT}"

Return JSON for a "signature" block with EXACTLY:
{
  "title": "Terms & Conditions",
  "ipClause": "<HTML paragraph on IP transfer>",
  "revisionClause": "<HTML paragraph on revisions>",
  "terminationClause": "<HTML paragraph on termination>",
  "ndaClause": "<HTML paragraph on confidentiality>",
  "companyName": "<your agency>",
  "clientName": "<client company>",
  "companySigner": "<your signer>",
  "clientSigner": "<client signer>"
}
Each clause must be a non-empty HTML paragraph. The infra/integrations directive above must be incorporated into the most relevant clause.`,
    },
  ];
};

interface EndToEndZaiModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
  defaultTheme?: string;
}

export const EndToEndZaiModal: React.FC<EndToEndZaiModalProps> = ({ visible, onClose, onComplete, defaultTheme = 'elegant-classic' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { user } = useAuth();
  const { data: activeCompany } = useActiveCompany();
  const { data: companiesData } = useCompanies({});
  const { data: locations } = useQuery({
    queryKey: ['company-locations'],
    queryFn: () => CompanyLocationService.getAll(),
  });

  const company = activeCompany || (companiesData?.data && companiesData.data.length > 0 ? companiesData.data[0] : null);

  const handleNameChange = (val: string, field: keyof typeof coverDetails) => {
    setCoverDetails({ ...coverDetails, [field]: val.replace(/[^a-zA-Z\s]/g, '') });
  };

  const handlePhoneChange = (val: string, field: keyof typeof coverDetails) => {
    setCoverDetails({ ...coverDetails, [field]: val.replace(/[^0-9+\-()\s]/g, '') });
  };

  const handleEmailChange = (val: string, field: keyof typeof coverDetails) => {
    setCoverDetails({ ...coverDetails, [field]: val.replace(/\s/g, '') });
  };

  const handleTextChange = (val: string, field: keyof typeof coverDetails) => {
    setCoverDetails({ ...coverDetails, [field]: val });
  };

  const renderField = (
    label: string, 
    value: string, 
    onChange: (val: string) => void, 
    icon: React.ReactNode, 
    placeholder: string, 
    validation: { error?: string, isInvalid?: boolean }
  ) => (
    <div>
      <Input 
        size="small" 
        prefix={icon} 
        placeholder={placeholder} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        status={validation.isInvalid ? 'error' : ''} 
        style={{ borderRadius: 6 }} 
      />
      {validation.error && <div style={{ fontSize: 10, color: '#ef4444', paddingLeft: 4, marginTop: 2 }}>{validation.error}</div>}
    </div>
  );

  const isValidEmail = (email: string) => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isCoverDetailsValid = () => {
    return !!(
      coverDetails.clientName && coverDetails.clientCompany &&
      coverDetails.clientEmail && isValidEmail(coverDetails.clientEmail) &&
      coverDetails.clientPhone && coverDetails.clientAddress &&
      coverDetails.senderName && coverDetails.senderPosition &&
      coverDetails.senderCompany && coverDetails.senderContact &&
      coverDetails.senderEmail && isValidEmail(coverDetails.senderEmail) &&
      coverDetails.senderAddress
    );
  };

  const [prompt, setPrompt] = useState('');
  const [extraTerms, setExtraTerms] = useState(DEFAULT_TERMS_HINT);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState('');
  const [step, setStep] = useState<'prompt' | 'components'>('prompt');
  const [activePhases, setActivePhases] = useState<{ id: string; type: string; checked: boolean }[]>(
    BLOCK_META.filter(b => b.type !== 'section').map(b => ({ id: nanoid(), type: b.type, checked: true }))
  );

  const [coverDetails, setCoverDetails] = useState({
    theme: defaultTheme,
    clientName: '',
    clientCompany: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    senderName: '',
    senderPosition: '',
    senderCompany: '',
    senderContact: '',
    senderEmail: '',
    senderAddress: '',
    senderWebsite: '',
  });

  React.useEffect(() => {
    if (!visible) {
      setCoverDetails(prev => ({
        ...prev,
        theme: defaultTheme,
        clientName: '',
        clientCompany: '',
        clientEmail: '',
        clientPhone: '',
        clientAddress: '',
      }));
    }
  }, [visible]);

  React.useEffect(() => {
    let bestAddress = '';
    if (locations && locations.length > 0) {
      const loc = locations[0];
      bestAddress = [loc.flatNumber, loc.street, loc.area, loc.city, loc.state, loc.country, loc.pincode].filter(Boolean).join(', ');
    }
    if (!bestAddress) {
      bestAddress = [company?.plotNo, company?.street, company?.city, company?.country].filter(Boolean).join(', ');
    }

    setCoverDetails(prev => ({
      ...prev,
      senderName: prev.senderName || user?.name || '',
      senderPosition: prev.senderPosition || user?.position?.title || user?.role || '',
      senderCompany: prev.senderCompany || user?.tenantName || company?.name || '',
      senderContact: prev.senderContact || user?.phone || company?.phone || '',
      senderEmail: prev.senderEmail || user?.email || '',
      senderAddress: prev.senderAddress || bestAddress || '',
      senderWebsite: prev.senderWebsite || (company as any)?.website || '',
    }));
  }, [user, company, locations]);

  const { setBlocks } = useProposalStore();

  const callRefineSafely = async (blockType: string, userPrompt: string) => {
    try {
      const res = (await ProposalService.refineBlock({
        blockType,
        currentData: {},
        userPrompt,
      })) as any;

      if (res && (res.success === true || res?.data?.success === true)) {
        return res.data?.data || res.data;
      }
      if (res && typeof res === 'object') {
        return res;
      }
      return null;
    } catch (err) {
      console.error('Zai refine failed for', blockType, err);
      return null;
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      message.warning('Tell Zai what proposal to create');
      return;
    }

    setGenerating(true);
    setProgress(0);

    const brief = parseBrief(prompt);
    const defaultPhases = buildPhasesOrder(brief, prompt, extraTerms, coverDetails);
    const phases = activePhases.filter(p => p.checked).map(p => {
      const dp = defaultPhases.find(d => d.type === p.type);
      if (dp) return { ...dp, id: p.id };
      const meta = BLOCK_META.find(b => b.type === p.type);
      const pal = PALETTE.find(b => b.kind === p.type);
      const label = meta?.label || pal?.label || p.type;
      return {
        type: p.type as BlockType,
        label: `Generating ${label}…`,
        hint: `Return JSON for a "${p.type}" block relevant to the project brief. Ensure it follows standard structure. Keep it short.`
      };
    });

    if (phases.length === 0) {
      message.warning('Please select at least one component to generate.');
      setGenerating(false);
      return;
    }

    const stepIncrement = 100 / phases.length;
    let runningProgress = 0;

    const generated: { type: BlockType; data: any }[] = [];

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      setStepLabel(phase.label);

      const data = await callRefineSafely(phase.type, phase.hint);
      const normalised = normaliseBlockData(phase.type, data || {}, brief, coverDetails);
      generated.push({ type: phase.type, data: normalised });

      runningProgress += stepIncrement;
      setProgress(Math.min(99, Math.round(runningProgress)));
    }

    if (generated.length === 0) {
      setGenerating(false);
      message.error('Zai could not generate the proposal. Please try a different prompt.');
      return;
    }

    const newBlocks = generated.map((g) => ({
      id: nanoid(),
      type: g.type,
      data: g.data,
    }));

    setBlocks(newBlocks);
    setProgress(100);
    setStepLabel('Proposal ready!');

    setTimeout(() => {
      setGenerating(false);
      setProgress(0);
      setStepLabel('');
      setPrompt('');
      onComplete?.();
      onClose();
      message.success('Zai composed your proposal — review and refine each section');
    }, 700);
  };

  return (
    <Modal
      open={visible}
      onCancel={() => !generating && onClose()}
      width={920}
      footer={null}
      destroyOnHidden
      centered
      closable={false}
      title={null}
      styles={{
        mask: { backdropFilter: 'blur(8px)', background: 'rgba(8, 12, 24, 0.55)' },
        content: { padding: 0, borderRadius: 22, overflow: 'hidden', background: 'transparent', boxShadow: '0 30px 80px rgba(8,12,24,0.45)' },
        body: { padding: 0 },
      }}
      wrapClassName="zai-modal-wrap"
    >
      <div className="zai-modal">
        <div className="zai-hero">
          <div className="zai-hero__bg" />
          <div className="zai-hero__content">
            <div className="zai-hero__brand">
              <div className="zai-orb">
                <Sparkles size={20} />
              </div>
              <div className="zai-hero__title-wrap">
                <div className="zai-hero__eyebrow">
                  <span className="zai-pill"><Zap size={10} strokeWidth={2.5} />ZAI · END-TO-END BUILDER</span>
                </div>
                <h2 className="zai-hero__title">
                  Create an entire proposal with <span className="zai-grad">Zai</span>
                </h2>
                <p className="zai-hero__sub">
                  Describe the project — scope, dates, budget, terms — and Zai will assemble cover, summary, scope, timeline, pricing and T&Cs in one go.
                </p>
              </div>
            </div>

            <button className="zai-close" onClick={() => !generating && onClose()} aria-label="Close">×</button>
          </div>
        </div>

        <div className="zai-body" style={{ display: 'flex', flexDirection: 'column', maxHeight: '75vh', overflow: 'hidden' }}>
          {generating ? (
            <div style={{ padding: '12px 4px 8px 4px' }}>
              <div className="zai-loading" style={{ height: 220 }}>
                <div className="zai-loading__orb">
                  <Sparkles size={24} />
                </div>
                <div className="zai-loading__bars">
                  <span /><span /><span />
                </div>
                <Text className="zai-loading__text">{stepLabel}</Text>
              </div>
              <div style={{ marginTop: 16 }}>
                <Progress
                  percent={progress}
                  showInfo={false}
                  strokeColor={{ '0%': '#3b82f6', '50%': '#8b5cf6', '100%': '#ec4899' }}
                  strokeWidth={10}
                  trailColor="rgba(99,102,241,0.10)"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Zai is composing your proposal end-to-end…</Text>
                  <Text style={{ fontSize: 12, color: 'var(--premium-blue)', fontWeight: 700 }}>{progress}%</Text>
                </div>
              </div>
            </div>
          ) : (
            <>
              {step === 'prompt' ? (
                <>
                  <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="zai-prompt">
                      <div className="zai-prompt__label">
                        <Wand2 size={14} />
                        <span>Project Brief</span>
                      </div>
                      <div className="zai-prompt__row">
                        <Input.TextArea
                          rows={4}
                          placeholder='e.g. "Create proposal for driver booking app with start date 01/05/2026 and end 23/07/2026 with 5 phases and 3 lakhs budget"'
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="zai-textarea"
                          bordered={false}
                        />
                        <Button
                          type="primary"
                          onClick={() => {
                            if (!prompt.trim()) {
                              message.warning('Tell Zai what proposal to create');
                              return;
                            }
                            setStep('components');
                          }}
                          className="zai-cta"
                          icon={<Sparkles size={14} />}
                        >
                          Build with Zai
                        </Button>
                      </div>

                      <div className="zai-template-list">
                        <div className="zai-template-list__heading">
                          <span className="zai-suggestions__label">Try one of these</span>
                        </div>
                        <div className="zai-template-grid">
                          {QUICK_TEMPLATES.map((t) => {
                            const active = prompt === t.body;
                            return (
                              <button
                                key={t.title}
                                type="button"
                                className={`zai-template-card ${active ? 'zai-template-card--active' : ''}`}
                                onClick={() => setPrompt(t.body)}
                              >
                                <div className="zai-template-card__head">
                                  <span className="zai-template-card__icon">{t.icon}</span>
                                  <span className="zai-template-card__title">{t.title}</span>
                                  <span className="zai-template-card__use">{active ? 'Selected' : 'Use this'}</span>
                                </div>
                                <p className="zai-template-card__body">{t.body}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="zai-prompt">
                      <div className="zai-prompt__label">
                        <Wand2 size={14} />
                        <span>Terms & Conditions Directive</span>
                      </div>
                      <Input.TextArea
                        rows={3}
                        placeholder="Tell Zai any specific clause guidance for terms & conditions"
                        value={extraTerms}
                        onChange={(e) => setExtraTerms(e.target.value)}
                        className="zai-textarea"
                        bordered={false}
                      />
                    </div>
                  </div>

                  <div className="zai-footer" style={{ flexShrink: 0, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                    <div className="zai-footer__hint">
                      Zai will generate Cover · Summary · Scope · Timeline · Pricing · T&Cs in sequence.
                    </div>
                    <div className="zai-footer__actions">
                      <Button onClick={onClose} className="zai-btn-ghost">Cancel</Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8 }}>
                    <div className="zai-components-selection" style={{ padding: '24px 0' }}>
                      {activePhases.some(p => p.type === 'cover' && p.checked) && (
                        <div
                          style={{
                            marginBottom: 32,
                            padding: "16px 20px",
                            background: isDark
                              ? '#1e293b'
                              : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                            border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                            boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.2)' : '0 8px 32px -4px rgba(148,163,184,0.15)',
                            borderRadius: 16,
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            top: -50,
                            right: -50,
                            width: 150,
                            height: 150,
                            background: isDark ? 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 70%)' : 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, rgba(255,255,255,0) 70%)',
                            borderRadius: '50%',
                            pointerEvents: 'none'
                          }} />

                          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: isDark ? '#60a5fa' : '#2563eb', display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                            <div style={{ padding: 6, background: isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)', borderRadius: 8 }}>
                              <Wand2 size={16} />
                            </div>
                            Cover Page Details
                          </div>

                          {/* Theme Selector */}
                          <div style={{ marginBottom: 16, position: 'relative' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#94a3b8' : '#64748b', marginBottom: 6 }}>Cover Theme</div>
                            <Select
                              value={coverDetails.theme}
                              onChange={(val) => setCoverDetails({ ...coverDetails, theme: val })}
                              style={{ width: '100%', borderRadius: 8 }}
                            >
                              <Select.Option value="modern-blue">Modern Blue</Select.Option>
                              <Select.Option value="minimalist-light">Minimalist Light</Select.Option>
                              <Select.Option value="bold-dark">Bold Dark</Select.Option>
                              <Select.Option value="elegant-classic">Elegant Wave (Default)</Select.Option>
                            </Select>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, position: 'relative' }}>
                            <div style={{
                              padding: 12,
                              backgroundColor: isDark ? '#0f172a' : '#ffffff',
                              borderRadius: 12,
                              border: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`,
                              boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.02)' : '0 1px 3px rgba(0,0,0,0.02)'
                            }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#94a3b8" : "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em", display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
                                Prepared For (Client) <span style={{ color: '#ef4444' }}>*</span>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {renderField('Company Name', coverDetails.clientCompany, (v) => handleNameChange(v, 'clientCompany'), <Building size={12} />, 'Company Name *', { error: !coverDetails.clientCompany ? 'Company Name is required' : undefined, isInvalid: !coverDetails.clientCompany })}
                                {renderField('Contact Person', coverDetails.clientName, (v) => handleNameChange(v, 'clientName'), <User size={12} />, 'Contact Person *', { error: !coverDetails.clientName ? 'Contact Person is required' : coverDetails.clientName.trim().length < 2 ? 'Name is too short' : undefined, isInvalid: !coverDetails.clientName || coverDetails.clientName.trim().length < 2 })}
                                {renderField('Email Address', coverDetails.clientEmail, (v) => handleEmailChange(v, 'clientEmail'), <Mail size={12} />, 'Email Address *', { error: !coverDetails.clientEmail ? 'Email Address is required' : !isValidEmail(coverDetails.clientEmail) ? 'Invalid email format' : undefined, isInvalid: !coverDetails.clientEmail || !isValidEmail(coverDetails.clientEmail) })}
                                {renderField('Phone Number', coverDetails.clientPhone, (v) => handlePhoneChange(v, 'clientPhone'), <Phone size={12} />, 'Phone Number *', { error: !coverDetails.clientPhone ? 'Phone Number is required' : coverDetails.clientPhone.replace(/\D/g, '').length < 8 ? 'Phone must be valid length' : undefined, isInvalid: !coverDetails.clientPhone || coverDetails.clientPhone.replace(/\D/g, '').length < 8 })}
                                {renderField('Business Address', coverDetails.clientAddress, (v) => handleTextChange(v, 'clientAddress'), <MapPin size={12} />, 'Business Address *', { error: !coverDetails.clientAddress ? 'Business Address is required' : undefined, isInvalid: !coverDetails.clientAddress })}
                              </div>
                            </div>

                            <div style={{
                              padding: 12,
                              backgroundColor: isDark ? '#0f172a' : '#ffffff',
                              borderRadius: 12,
                              border: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`,
                              boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.02)' : '0 1px 3px rgba(0,0,0,0.02)'
                            }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#94a3b8" : "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em", display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                                Prepared By (You) <span style={{ color: '#ef4444' }}>*</span>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {renderField('Organization', coverDetails.senderCompany, (v) => handleNameChange(v, 'senderCompany'), <Building size={12} />, 'Organization / Company *', { error: !coverDetails.senderCompany ? 'Organization is required' : undefined, isInvalid: !coverDetails.senderCompany })}
                                {renderField('Your Name', coverDetails.senderName, (v) => handleNameChange(v, 'senderName'), <User size={12} />, 'Your Name *', { error: !coverDetails.senderName ? 'Name is required' : coverDetails.senderName.trim().length < 2 ? 'Name is too short' : undefined, isInvalid: !coverDetails.senderName || coverDetails.senderName.trim().length < 2 })}
                                {renderField('Your Position', coverDetails.senderPosition, (v) => handleTextChange(v, 'senderPosition'), <Briefcase size={12} />, 'Your Position *', { error: !coverDetails.senderPosition ? 'Position is required' : undefined, isInvalid: !coverDetails.senderPosition })}
                                {renderField('Email Address', coverDetails.senderEmail, (v) => handleEmailChange(v, 'senderEmail'), <Mail size={12} />, 'Email Address *', { error: !coverDetails.senderEmail ? 'Email Address is required' : !isValidEmail(coverDetails.senderEmail) ? 'Invalid email format' : undefined, isInvalid: !coverDetails.senderEmail || !isValidEmail(coverDetails.senderEmail) })}
                                {renderField('Phone Number', coverDetails.senderContact, (v) => handlePhoneChange(v, 'senderContact'), <Phone size={12} />, 'Phone Number *', { error: !coverDetails.senderContact ? 'Phone Number is required' : coverDetails.senderContact.replace(/\D/g, '').length < 8 ? 'Phone must be valid length' : undefined, isInvalid: !coverDetails.senderContact || coverDetails.senderContact.replace(/\D/g, '').length < 8 })}
                                {renderField('Website URL', coverDetails.senderWebsite, (v) => handleTextChange(v, 'senderWebsite'), <Link size={12} />, 'Website URL', {})}
                                {renderField('Business Address', coverDetails.senderAddress, (v) => handleTextChange(v, 'senderAddress'), <MapPin size={12} />, 'Business Address *', { error: !coverDetails.senderAddress ? 'Business Address is required' : undefined, isInvalid: !coverDetails.senderAddress })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: isDark ? '#f8fafc' : '#1e293b' }}>Select Components to Generate</div>
                        <Dropdown
                          overlayStyle={{ minWidth: 220 }}
                          trigger={['click']}
                          menu={{
                            style: { maxHeight: 340, overflowY: 'auto', padding: '8px', borderRadius: 12, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)' },
                            items: Object.entries(
                              PALETTE
                                .filter(meta => !activePhases.some(p => p.type === meta.kind))
                                .reduce((acc, meta) => {
                                  const g = meta.group || 'Other';
                                  if (!acc[g]) acc[g] = [];
                                  acc[g].push({
                                    key: meta.paletteId || meta.kind,
                                    style: { padding: '8px 12px', margin: '2px 4px', borderRadius: 8 },
                                    label: (
                                      <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 500, color: 'inherit' }}>
                                        <span style={{ color: meta.accent || '#3b82f6', display: 'flex', opacity: 0.9 }}>{meta.icon}</span>
                                        {meta.label}
                                      </span>
                                    ),
                                    onClick: () => {
                                      setActivePhases([...activePhases, { id: nanoid(), type: meta.kind, checked: true }]);
                                    }
                                  });
                                  return acc;
                                }, {} as Record<string, any[]>)
                            ).map(([groupName, children]) => ({
                              type: 'group',
                              label: <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: 4 }}>{groupName}</span>,
                              children
                            }))
                          }}
                          placement="bottomRight"
                        >
                          <Button type="primary" ghost size="small" icon={<PlusOutlined />} style={{ borderRadius: 6, fontWeight: 500, padding: '0 12px' }}>
                            Add Components
                          </Button>
                        </Dropdown>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
                        {activePhases.map((phase) => {
                          const meta = BLOCK_META.find(b => b.type === phase.type);
                          const pal = PALETTE.find(b => b.kind === phase.type);
                          const label = meta?.label || pal?.label || phase.type;
                          const icon = meta?.icon || pal?.icon || <Zap size={16} />;
                          const color = meta?.color || pal?.accent || '#3b82f6';

                          return (
                            <div
                              key={phase.id}
                              onClick={() => {
                                setActivePhases(activePhases.map(p =>
                                  p.id === phase.id ? { ...p, checked: !p.checked } : p
                                ));
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '12px 16px',
                                borderRadius: 12,
                                border: phase.checked ? `2px solid ${color}` : `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                                backgroundColor: phase.checked ? (isDark ? `${color}15` : `${color}08`) : (isDark ? '#1e293b' : '#ffffff'),
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: phase.checked ? `0 4px 12px ${color}15` : '0 1px 2px rgba(0,0,0,0.02)',
                                opacity: phase.checked ? 1 : 0.7
                              }}
                              onMouseEnter={(e) => {
                                if (!phase.checked) {
                                  e.currentTarget.style.borderColor = isDark ? '#475569' : '#cbd5e1';
                                  e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#f8fafc';
                                  e.currentTarget.style.opacity = '1';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!phase.checked) {
                                  e.currentTarget.style.borderColor = isDark ? '#334155' : '#e2e8f0';
                                  e.currentTarget.style.backgroundColor = isDark ? '#1e293b' : '#ffffff';
                                  e.currentTarget.style.opacity = '0.7';
                                }
                              }}
                            >
                              <span style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                backgroundColor: phase.checked ? `${color}15` : (isDark ? '#334155' : '#f1f5f9'),
                                color: phase.checked ? color : (isDark ? '#94a3b8' : '#64748b'),
                                transition: 'all 0.2s ease'
                              }}>
                                {icon}
                              </span>
                              <span style={{
                                fontSize: 14,
                                fontWeight: phase.checked ? 600 : 500,
                                color: phase.checked ? (isDark ? '#f8fafc' : '#0f172a') : (isDark ? '#cbd5e1' : '#475569'),
                                transition: 'all 0.2s ease'
                              }}>
                                {label}
                              </span>
                              <div style={{ marginLeft: 'auto' }}>
                                <Checkbox
                                  checked={phase.checked}
                                  className="zai-round-checkbox"
                                  style={{ pointerEvents: 'none' }} // Let the parent div handle the click
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="zai-footer" style={{ flexShrink: 0, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
                    <div className="zai-footer__hint">
                      {activePhases.some(p => p.type === 'cover' && p.checked) && !isCoverDetailsValid() ? (
                        <span style={{ color: '#ef4444' }}>Please provide a valid email and fill all required Cover Page Details to proceed.</span>
                      ) : (
                        "Zai will automatically build the selected components in sequence."
                      )}
                    </div>
                    <div className="zai-footer__actions">
                      <Button onClick={() => setStep('prompt')} className="zai-btn-ghost">Back</Button>
                      {(!activePhases.some(p => p.type === 'cover' && p.checked) || isCoverDetailsValid()) && (
                        <Button type="primary" onClick={handleGenerate} className="zai-cta" icon={<Sparkles size={14} />}>Start Generation</Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
