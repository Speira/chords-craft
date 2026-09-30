import type { ProfileView, SaveProfileInput } from './types';

/** The form edits strings; an empty string means "not set". */
export interface ProfileFormValues {
  name: string;
  phone: string;
  preferredChannel: SaveProfileInput['preferredChannel'];
  country: string;
  area: string;
  roles: Array<{ role: string; detail: string; isPrimary: boolean; level: string }>;
  styles: Array<{ style: string; detail: string }>;
}

const orNull = (value: string) => (value.trim() === '' ? null : value.trim());

export function toFormValues(profile: ProfileView | null): ProfileFormValues {
  return {
    name: profile?.name ?? '',
    phone: profile?.phone ?? '',
    preferredChannel: profile?.preferredChannel ?? 'WHATSAPP',
    country: profile?.region?.country ?? '',
    area: profile?.region?.area ?? '',
    roles: profile?.roles.map((tag) => ({
      role: tag.role,
      detail: tag.detail ?? '',
      isPrimary: tag.isPrimary,
      level: tag.level ?? '',
    })) ?? [{ role: 'guitar', detail: '', isPrimary: true, level: '' }],
    styles: profile?.styles.map((tag) => ({ style: tag.style, detail: tag.detail ?? '' })) ?? [],
  };
}

export function toSaveInput(values: ProfileFormValues): SaveProfileInput {
  const country = orNull(values.country);
  return {
    name: values.name.trim(),
    phone: orNull(values.phone),
    preferredChannel: values.preferredChannel,
    region: country === null ? null : { country, area: orNull(values.area) },
    roles: values.roles.map((tag) => ({
      role: tag.role as SaveProfileInput['roles'][number]['role'],
      detail: orNull(tag.detail),
      isPrimary: tag.isPrimary,
      level: (orNull(tag.level) as SaveProfileInput['roles'][number]['level']) ?? null,
    })),
    styles: values.styles.map((tag) => ({
      style: tag.style as SaveProfileInput['styles'][number]['style'],
      detail: orNull(tag.detail),
    })),
  };
}
