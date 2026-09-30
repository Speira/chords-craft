import type {
  ContactChannel,
  MusicianRole,
  MusicStyle,
  SkillLevel,
} from '@chordcraft/shared/valueObjects';

export interface RoleTagView {
  role: MusicianRole.Slug;
  detail: string | null;
  isPrimary: boolean;
  level: SkillLevel.SkillLevel | null;
}

export interface StyleTagView {
  style: MusicStyle.Slug;
  detail: string | null;
}

export interface ProfileView {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  preferredChannel: ContactChannel.ContactChannel;
  region: { country: string; area: string | null } | null;
  roles: Array<RoleTagView>;
  styles: Array<StyleTagView>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveProfileInput {
  name: string;
  phone: string | null;
  preferredChannel: ContactChannel.ContactChannel;
  region: { country: string; area: string | null } | null;
  roles: Array<RoleTagView>;
  styles: Array<StyleTagView>;
}

export interface UnavailabilityView {
  id: string;
  from: string;
  to: string;
  reason: string | null;
  appliesToAllBands: boolean;
  bandIds: Array<string>;
}

export interface UnavailabilityInput {
  from: string;
  to: string;
  reason: string | null;
}
