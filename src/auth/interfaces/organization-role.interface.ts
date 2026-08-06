export interface Role {
  roleCode: string;
  roleName: string;
  roleDescription: string;
  permissions: string[];
  deniedPermissions: string[] | null;
}

export interface OrganizationRole {
  organizationId: string;
  organizationCode: string;
  organizationName: string;
  countryCode: string;
  countryName: string;
  timezone: string;
  roles: Role[];
}
