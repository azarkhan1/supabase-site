import { useAuth } from './useAuth';
import { hasPermission } from '../lib/permissions';

export function usePermission(permission) {
  const { user } = useAuth();
  if (!user) return false;
  return hasPermission(user, permission);
}
