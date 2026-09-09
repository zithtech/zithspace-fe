"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import MainLayout from "@/components/layout/MainLayout";
import { Permissions } from "@/types/permissions";

const ORG_TARGETS = [
  { path: "/org-structure/overview", feature: ["admin_org_structure_overview", "admin_org_structure"], perms: [Permissions.ORG_READ] },
  { path: "/org-structure/grades", feature: ["admin_org_structure_grades"], perms: [Permissions.ORG_GRADE_READ, Permissions.ORG_MANAGE] },
  { path: "/org-structure/employment-types", feature: ["admin_org_structure_employment_type"], perms: [Permissions.ORG_EMPLOYMENT_TYPE_READ, Permissions.ORG_MANAGE] },
  { path: "/org-structure/departments", feature: ["admin_org_structure_department"], perms: [Permissions.ORG_DEPARTMENT_READ, Permissions.ORG_MANAGE] },
  { path: "/org-structure/sub-departments", feature: ["admin_org_structure_sub_department"], perms: [Permissions.ORG_DEPARTMENT_READ, Permissions.ORG_MANAGE] },
  { path: "/org-structure/positions", feature: ["admin_org_structure_position"], perms: [Permissions.ORG_POSITION_READ, Permissions.ORG_MANAGE] },
];

export default function OrgStructureRootRedirect() {
  const router = useRouter();
  const { hasAnyPermission, hasAnySubscriptionFeature, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const firstAvailable = ORG_TARGETS.find((target) => {
      const hasPerm = hasAnyPermission(...target.perms);
      const hasSub = hasAnySubscriptionFeature(...target.feature);
      return hasPerm && hasSub;
    });

    if (firstAvailable) {
      router.replace(firstAvailable.path);
    } else {
      router.replace("/dashboard");
    }
  }, [isLoading, hasAnyPermission, hasAnySubscriptionFeature, router]);

  return (
    <MainLayout>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <ZukvoLoader size="lg" message="Loading Org Structure..." />
      </div>
    </MainLayout>
  );
}
