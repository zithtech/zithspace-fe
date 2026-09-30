import { api, apiUtils, PaginatedResponse } from '@/lib/axios';
import type { LibrarySection, SectionComponent, SectionCategory, SectionType } from '@/store/proposalLibraryStore';

export interface SectionPayload {
  name: string;
  category?: SectionCategory;
  type?: SectionType;
  description?: string;
  components?: SectionComponent[];
  data?: any;
  isGlobal?: boolean;
}

export interface ProposalSectionFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  view?: string;
  archived?: boolean | string;
  all?: boolean;
}

const BASE = '/api/proposal-sections';

export const ProposalSectionService = {
  list: (params?: ProposalSectionFilters): Promise<PaginatedResponse<LibrarySection>> => {
    return apiUtils.getPaginated<LibrarySection>(BASE, params);
  },
  listAll: (): Promise<LibrarySection[]> => api.get<LibrarySection[]>(`${BASE}?all=true`),
  getById: (id: string) => api.get<LibrarySection>(`${BASE}/${id}`),
  create: (payload: SectionPayload) => api.post<LibrarySection>(BASE, payload),
  update: (id: string, payload: Partial<SectionPayload> & { archived?: boolean }) =>
    api.put<LibrarySection>(`${BASE}/${id}`, payload),
  archive: (id: string, archived: boolean) =>
    api.patch<LibrarySection>(`${BASE}/${id}/archive`, { archived }),
  duplicate: (id: string) => api.post<LibrarySection>(`${BASE}/${id}/duplicate`),
  remove: (id: string) => api.delete(`${BASE}/${id}`),
};
