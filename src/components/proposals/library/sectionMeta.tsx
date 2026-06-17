import React from 'react';
import {
  LayoutTemplate,
  Type as TypeIcon,
  DollarSign,
  CalendarRange,
  ListChecks,
  PenLine,
  ScrollText,
  Quote,
  Images,
  Video,
  MousePointerClick,
  Building2,
  Briefcase,
  ShieldCheck,
  Sparkles,
  Flag,
  FolderOpen,
} from 'lucide-react';
import type { SectionType, SectionCategory } from '@/store/proposalLibraryStore';

// Palette stays within blue / green / ash per the workspace color rule.
export interface TypeMeta {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

const BLUE = '#2563eb';
const GREEN = '#059669';
const ASH = '#475569';

export const SECTION_TYPE_META: Record<SectionType, TypeMeta> = {
  cover:       { label: 'Cover',       icon: <LayoutTemplate size={14} />,      color: BLUE,  bg: 'rgba(37,99,235,0.10)' },
  text:        { label: 'Text',        icon: <TypeIcon size={14} />,            color: ASH,   bg: 'rgba(71,85,105,0.10)' },
  pricing:     { label: 'Pricing',     icon: <DollarSign size={14} />,          color: GREEN, bg: 'rgba(5,150,105,0.10)' },
  timeline:    { label: 'Timeline',    icon: <CalendarRange size={14} />,       color: BLUE,  bg: 'rgba(37,99,235,0.10)' },
  scope:       { label: 'Scope',       icon: <ListChecks size={14} />,          color: GREEN, bg: 'rgba(5,150,105,0.10)' },
  signature:   { label: 'Signature',   icon: <PenLine size={14} />,             color: BLUE,  bg: 'rgba(37,99,235,0.10)' },
  terms:       { label: 'Terms',       icon: <ScrollText size={14} />,          color: ASH,   bg: 'rgba(71,85,105,0.10)' },
  testimonial: { label: 'Testimonial', icon: <Quote size={14} />,               color: GREEN, bg: 'rgba(5,150,105,0.10)' },
  gallery:     { label: 'Gallery',     icon: <Images size={14} />,              color: BLUE,  bg: 'rgba(37,99,235,0.10)' },
  video:       { label: 'Video',       icon: <Video size={14} />,               color: ASH,   bg: 'rgba(71,85,105,0.10)' },
  cta:         { label: 'CTA',         icon: <MousePointerClick size={14} />,   color: GREEN, bg: 'rgba(5,150,105,0.10)' },
};

export const typeMeta = (t: SectionType): TypeMeta =>
  SECTION_TYPE_META[t] || SECTION_TYPE_META.text;

export interface CategoryMeta {
  label: SectionCategory;
  icon: React.ReactNode;
  color: string;
}

export const CATEGORY_META: Record<SectionCategory, CategoryMeta> = {
  Introduction: { label: 'Introduction', icon: <Building2 size={14} />,   color: BLUE },
  Service:      { label: 'Service',      icon: <Briefcase size={14} />,   color: GREEN },
  Pricing:      { label: 'Pricing',      icon: <DollarSign size={14} />,  color: GREEN },
  Legal:        { label: 'Legal',        icon: <ShieldCheck size={14} />, color: ASH },
  Trust:        { label: 'Trust',        icon: <Sparkles size={14} />,    color: BLUE },
  Closing:      { label: 'Closing',      icon: <Flag size={14} />,        color: ASH },
  Custom:       { label: 'Custom',       icon: <FolderOpen size={14} />,  color: ASH },
};

export const CATEGORY_ORDER: SectionCategory[] = [
  'Introduction',
  'Service',
  'Pricing',
  'Legal',
  'Trust',
  'Closing',
  'Custom',
];

export const SECTION_TYPES: SectionType[] = [
  'text',
  'cover',
  'pricing',
  'timeline',
  'scope',
  'signature',
  'terms',
  'testimonial',
  'gallery',
  'video',
  'cta',
];

export const SECTION_CATEGORIES: SectionCategory[] = CATEGORY_ORDER;

/** Short human description for each section type — used in the type picker. */
export const SECTION_TYPE_PURPOSE: Record<SectionType, string> = {
  text: 'Normal rich content',
  cover: 'Proposal cover page',
  pricing: 'Pricing / investment table',
  timeline: 'Project timeline',
  scope: 'Scope of work & milestones',
  signature: 'E-sign acceptance',
  terms: 'Legal content',
  testimonial: 'Client reviews',
  gallery: 'Portfolio images',
  video: 'Embedded video',
  cta: 'Accept-proposal call to action',
};
