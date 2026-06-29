import { api } from '@/lib/axios';
import type { LibraryTemplate } from '@/store/proposalLibraryStore';

export interface TemplatePayload {
  name: string;
  description?: string;
  /** Full composed builder content (ProposalBlock[]). */
  blocks?: any[];
  /** Legacy: ordered section-id references. */
  sectionIds?: string[];
  themeId?: string;
  fontId?: string;
}

const BASE = '/api/proposal-templates';

export const ProposalTemplateService = {
  list: () => api.get<LibraryTemplate[]>(BASE),
  getById: (id: string) => api.get<LibraryTemplate>(`${BASE}/${id}`),
  create: (payload: TemplatePayload) => api.post<LibraryTemplate>(BASE, payload),
  update: (id: string, payload: Partial<TemplatePayload> & { archived?: boolean }) =>
    api.put<LibraryTemplate>(`${BASE}/${id}`, payload),
  archive: (id: string, archived: boolean) =>
    api.patch<LibraryTemplate>(`${BASE}/${id}/archive`, { archived }),
  duplicate: (id: string) => api.post<LibraryTemplate>(`${BASE}/${id}/duplicate`),
  remove: (id: string) => api.delete(`${BASE}/${id}`),
};
