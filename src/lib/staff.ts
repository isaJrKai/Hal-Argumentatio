export type StaffStatus = 'active' | 'inactive';
export type StaffAvailability = 'available' | 'unavailable';

export interface StaffInput {
  name: string;
  role: string;
  email?: string | null;
  phone?: string | null;
  status?: StaffStatus;
  availability?: StaffAvailability;
}

export function validateStaffInput(value: unknown): { valid: true; value: StaffInput } | { valid: false; error: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { valid: false, error: 'Staff details must be an object.' };
  const body = value as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const role = typeof body.role === 'string' ? body.role.trim() : '';
  const email = body.email == null || body.email === '' ? null : typeof body.email === 'string' ? body.email.trim().toLowerCase() : '__invalid__';
  const phone = body.phone == null || body.phone === '' ? null : typeof body.phone === 'string' ? body.phone.trim() : '__invalid__';
  const status = body.status === undefined ? 'active' : body.status;
  const availability = body.availability === undefined ? 'available' : body.availability;
  if (!name || name.length > 120 || !role || role.length > 80) return { valid: false, error: 'A staff name (max 120 characters) and role (max 80 characters) are required.' };
  if (email === '__invalid__' || (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))) return { valid: false, error: 'Enter a valid email address.' };
  if (phone === '__invalid__' || (phone && phone.length > 40)) return { valid: false, error: 'Phone number must be 40 characters or fewer.' };
  if (!['active', 'inactive'].includes(String(status))) return { valid: false, error: 'Staff status must be active or inactive.' };
  if (!['available', 'unavailable'].includes(String(availability))) return { valid: false, error: 'Availability must be available or unavailable.' };
  return { valid: true, value: { name, role, email, phone, status: status as StaffStatus, availability: availability as StaffAvailability } };
}

export function getEffectiveStaffAvailability(staff: { status: string; availability: string }, activeTaskCount: number): 'available' | 'busy' | 'unavailable' {
  if (staff.status !== 'active' || staff.availability !== 'available') return 'unavailable';
  return activeTaskCount > 0 ? 'busy' : 'available';
}
