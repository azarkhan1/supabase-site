export const PERMISSIONS = {
  CREATE_TRANSACTION: 'CREATE_TRANSACTION',
  APPROVE_TRANSACTION: 'APPROVE_TRANSACTION',
  VIEW_REPORTS: 'VIEW_REPORTS',
  MANAGE_ACCOUNTS: 'MANAGE_ACCOUNTS',
  MANAGE_USERS: 'MANAGE_USERS',
  EXPORT_DATA: 'EXPORT_DATA',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
  DELETE_WORKSPACE: 'DELETE_WORKSPACE'
};

export const ROLE_PERMISSIONS = {
  owner: [
    PERMISSIONS.CREATE_TRANSACTION,
    PERMISSIONS.APPROVE_TRANSACTION,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_ACCOUNTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.DELETE_WORKSPACE
  ],
  admin: [
    PERMISSIONS.CREATE_TRANSACTION,
    PERMISSIONS.APPROVE_TRANSACTION,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_ACCOUNTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.MANAGE_SETTINGS
  ],
  accountant: [
    PERMISSIONS.CREATE_TRANSACTION,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_DATA
  ],
  viewer: [
    PERMISSIONS.VIEW_REPORTS
  ]
};

export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.isAdmin || user.role === 'owner') return true;
  
  // Custom permissions overrides
  if (user.customPermissions && Array.isArray(user.customPermissions) && user.customPermissions.includes(permission)) {
    return true;
  }
  
  // Default role permissions
  const rolePerms = ROLE_PERMISSIONS[user.role] || [];
  return rolePerms.includes(permission);
}
