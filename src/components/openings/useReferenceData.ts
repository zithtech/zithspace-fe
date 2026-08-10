'use client';

import { useEffect, useState } from 'react';
import type { SearchableDropdownOption } from '@/components/common/SearchableDropdown';
import { DepartmentService } from '@/services/departmentService';
import { CompanyDetailsService } from '@/services/companyDetailsService';
import { employmentTypeService } from '@/services/employmentTypeService';
import { MembersService } from '@/services/membersService';
import { ProjectService } from '@/services/projectService';
import { SubDepartmentService } from '@/services/subDepartmentService';
import { RecruitmentClientService } from '@/services/recruitmentClient.service';

// Master data the opening form and filters need, loaded once and shared.
// An opening links to departments, projects, people and locations that all live
// in other modules — this hook keeps that fan-out in one place instead of every
// panel refetching the same five lists.

export interface ReferenceData {
  departments: SearchableDropdownOption[];
  subDepartments: SearchableDropdownOption[];
  clients: SearchableDropdownOption[];
  projects: SearchableDropdownOption[];
  people: SearchableDropdownOption[];
  locations: SearchableDropdownOption[];
  employmentTypes: SearchableDropdownOption[];
  loading: boolean;
}

/** Every lookup is optional to the form, so one failing list must not blank the rest. */
async function settle<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

function toArray(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.data?.data)) return raw.data.data;
  return [];
}

export function useReferenceData(enabled = true): ReferenceData {
  const [data, setData] = useState<Omit<ReferenceData, 'loading'>>({
    departments: [],
    subDepartments: [],
    clients: [],
    projects: [],
    people: [],
    locations: [],
    employmentTypes: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      const [departments, subDepartments, locations, employmentTypes, members, projects, clients] =
        await Promise.all([
          settle(DepartmentService.getAll(), [] as any),
          settle(SubDepartmentService.getAll(), [] as any),
          settle(CompanyDetailsService.getBranches(), [] as any),
          settle(employmentTypeService.getAll(), [] as any),
          settle(MembersService.getMembers({ limit: 500 } as any), { data: [] } as any),
          settle(ProjectService.getProjects({ limit: 500 } as any), { data: [] } as any),
          settle(RecruitmentClientService.getClients({ limit: 500 } as any), { data: [] } as any),
        ]);
      if (cancelled) return;

      setData({
        departments: toArray(departments).map((d: any) => ({
          value: d.id,
          label: d.name,
          description: d.code,
        })),
        subDepartments: toArray(subDepartments).map((d: any) => ({
          value: d.id,
          label: d.name,
          description: d.code,
        })),
        clients: toArray(clients).map((c: any) => ({
          value: c.id,
          label: c.clientName ?? c.companyName ?? 'Client',
          description: [c.industry, c.city].filter(Boolean).join(' · ') || undefined,
        })),
        locations: toArray(locations).map((l: any) => ({
          value: l.id,
          label: l.branchName || [l.city, l.state, l.country].filter(Boolean).join(', ') || 'Branch',
          description:
            [l.city, l.state, l.country].filter(Boolean).join(', ') || undefined,
        })),
        employmentTypes: toArray(employmentTypes).map((t: any) => ({
          value: t.id,
          label: t.name,
          description: t.code,
        })),
        people: toArray(members).map((m: any) => ({
          value: m.id,
          label: m.name,
          description: m.workEmail || m.email,
          avatarUrl: m.avatarUrl ?? m.profilePicture ?? null,
        })),
        projects: toArray(projects).map((p: any) => ({
          value: p.id,
          label: p.name,
          description: p.code ?? undefined,
        })),
      });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { ...data, loading };
}
