import { isHrEmail } from './constants';

/** Client-side HR gate matching SQL is_staff_hr() allowlist. */
export function checkIsStaffHr(email: string | null | undefined): boolean {
  return isHrEmail(email);
}
