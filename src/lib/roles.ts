/**
 * Matches the real schema: public.profiles.role column comment says
 * "Professional role selected at signup: real_estate, mortgage, or
 * investor_other. Determines which license field (if any) is required."
 * Label text matches the live Airtable "Subscribers" table's Role select
 * options exactly (base appJxjbSCfHRseOJJ), so no separate mapping is
 * needed when pushing there.
 */
export type Role = "real_estate" | "mortgage" | "investor_other";

export interface RoleConfigEntry {
  key: Role;
  label: string;
  licenseField: "dre_license" | "nmls_id" | null;
  licenseLabel: string | null;
}

export const ROLES: Record<Role, RoleConfigEntry> = {
  real_estate: {
    key: "real_estate",
    label: "Real Estate Broker / Agent",
    licenseField: "dre_license",
    licenseLabel: "DRE license number",
  },
  mortgage: {
    key: "mortgage",
    label: "Mortgage Broker / Loan Officer",
    licenseField: "nmls_id",
    licenseLabel: "NMLS ID",
  },
  investor_other: {
    key: "investor_other",
    label: "Investor / Other",
    licenseField: null,
    licenseLabel: null,
  },
};

export const ROLE_LIST = Object.values(ROLES);

export function isRole(value: string): value is Role {
  return value === "real_estate" || value === "mortgage" || value === "investor_other";
}

export function roleConfig(role: Role): RoleConfigEntry {
  return ROLES[role];
}
