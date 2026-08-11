import { useAuth } from './useAuth';
import { getPermissions, type PermissionSet } from '../utils/permissions';

export function usePermissions(): PermissionSet {
  const { user } = useAuth();
  return getPermissions(user?.role);
}
