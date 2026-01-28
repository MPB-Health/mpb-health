import { useOrg } from './useOrg';
import {
  OrgRole,
  ORG_ROLE_HIERARCHY,
  ORG_ROLE_PERMISSIONS,
  hasRoleOrHigher as checkRoleOrHigher,
  hasPermission as checkPermission,
} from '../services/orgService';

/**
 * Hook to check if the current user has a specific role in the current org
 */
export function useOrgRole() {
  const { orgRole, activeOrg } = useOrg();

  // Role checks
  const isOwner = orgRole === 'owner';
  const isAdmin = orgRole === 'admin' || isOwner;
  const isManager = orgRole === 'manager' || isAdmin;
  const isAdvisor = orgRole === 'advisor' || isManager;

  // Permission checks
  const canManageUsers = checkPermission(orgRole, 'manage_users');
  const canManageSettings = checkPermission(orgRole, 'manage_settings');
  const canManageTemplates = checkPermission(orgRole, 'manage_templates');
  const canManageSequences = checkPermission(orgRole, 'manage_sequences');
  const canViewReports = checkPermission(orgRole, 'view_reports');
  const canManageCompliance = checkPermission(orgRole, 'manage_compliance');
  const canManageBilling = checkPermission(orgRole, 'manage_billing');

  /**
   * Check if user has one of the specified roles
   */
  const hasRole = (roles: OrgRole | OrgRole[]): boolean => {
    if (!orgRole) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(orgRole);
  };

  /**
   * Check if user has at least the specified role level
   * Role hierarchy: owner > admin > manager > advisor
   */
  const hasRoleOrHigher = (minRole: OrgRole): boolean => {
    return checkRoleOrHigher(orgRole, minRole);
  };

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: string): boolean => {
    return checkPermission(orgRole, permission);
  };

  /**
   * Check if a feature is enabled for this org
   */
  const hasFeature = (feature: string): boolean => {
    return activeOrg?.settings?.features?.[feature] === true;
  };

  return {
    currentRole: orgRole,
    hasRole,
    hasRoleOrHigher,
    hasPermission,
    hasFeature,
    isOwner,
    isAdmin,
    isManager,
    isAdvisor,
    canManageUsers,
    canManageSettings,
    canManageTemplates,
    canManageSequences,
    canViewReports,
    canManageCompliance,
    canManageBilling,
  };
}

/**
 * Hook to require a minimum role, throws if not met
 */
export function useRequireRole(requiredRole: OrgRole) {
  const { currentRole, hasRoleOrHigher } = useOrgRole();

  if (!currentRole) {
    throw new Error('No organization selected');
  }

  if (!hasRoleOrHigher(requiredRole)) {
    throw new Error(`This action requires ${requiredRole} role or higher`);
  }

  return { role: currentRole };
}
