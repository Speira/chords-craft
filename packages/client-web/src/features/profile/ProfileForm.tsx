'use client';

import { useState } from 'react';

import {
  ContactChannel,
  CountryCode,
  MusicianRole,
  MusicStyle,
  SkillLevel,
} from '@chordcraft/shared/valueObjects';
import { useLocale } from 'next-intl';
import { useFieldArray, useForm } from 'react-hook-form';

import { Button, Input, Label, Typography } from '#client-web/components';
import { useAppTranslations } from '#client-web/lib/nextIntl/useAppTranslation';

import { useSaveMyProfile } from './hooks';
import { type ProfileFormValues, toFormValues, toSaveInput } from './profileForm';
import type { ProfileView } from './types';

const SELECT_CLASS = 'border-input bg-background h-9 w-full rounded-md border px-3 text-sm';

export function ProfileForm({ email, profile }: { email: string; profile: ProfileView | null }) {
  const t = useAppTranslations();
  const locale = useLocale();
  const { error, isSaving, saveProfile } = useSaveMyProfile();
  const [isSaved, setIsSaved] = useState(false);
  const { control, handleSubmit, register, watch } = useForm<ProfileFormValues>({
    defaultValues: toFormValues(profile),
  });
  const roles = useFieldArray({ control, name: 'roles' });
  const styles = useFieldArray({ control, name: 'styles' });
  const countryNames = new Intl.DisplayNames([locale], { type: 'region' });

  const onSubmit = handleSubmit(async (values) => {
    setIsSaved(false);
    try {
      await saveProfile(toSaveInput(values));
      setIsSaved(true);
    } catch {
      // `error` is set by the hook and rendered below.
    }
  });

  const ruleMessage =
    error?.errorType === 'VALIDATION' && error.message in RULE_KEYS
      ? t(RULE_KEYS[error.message as keyof typeof RULE_KEYS])
      : null;

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-2xl flex-col gap-4">
      <Typography as="h2">{t('profile.title')}</Typography>

      <Label>
        {t('profile.name')}
        <Input {...register('name', { required: true, maxLength: 100 })} />
      </Label>
      <Label>
        {t('profile.email')}
        <Input value={email} disabled readOnly />
      </Label>
      <Label>
        {t('profile.channel')}
        <select className={SELECT_CLASS} {...register('preferredChannel')}>
          {ContactChannel.CHANNELS.map((channel) => (
            <option key={channel} value={channel}>
              {t(`contactChannel.${channel}`)}
            </option>
          ))}
        </select>
      </Label>
      <Label>
        {t('profile.phone')}
        <Input type="tel" {...register('phone')} />
      </Label>
      <div className="grid grid-cols-2 gap-4">
        <Label>
          {t('profile.country')}
          <select className={SELECT_CLASS} {...register('country')}>
            <option value="">—</option>
            {CountryCode.ALL.map((code) => (
              <option key={code} value={code}>
                {countryNames.of(code) ?? code}
              </option>
            ))}
          </select>
        </Label>
        <Label>
          {t('profile.area')}
          <Input {...register('area')} />
        </Label>
      </div>

      <Typography as="h3">{t('profile.roles')}</Typography>
      {roles.fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-[2fr_2fr_2fr_auto_auto] items-end gap-2">
          <select className={SELECT_CLASS} {...register(`roles.${index}.role`)}>
            {Object.entries(MusicianRole.FAMILIES).map(([family, slugs]) => (
              <optgroup key={family} label={t(`roleFamily.${family as MusicianRole.Family}`)}>
                {slugs.map((slug) => (
                  <option key={slug} value={slug}>
                    {t(`musicianRole.${slug}`)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {watch(`roles.${index}.role`) === MusicianRole.OTHER ? (
            <Input placeholder="profile.detail" {...register(`roles.${index}.detail`)} />
          ) : (
            <span />
          )}
          <select className={SELECT_CLASS} {...register(`roles.${index}.level`)}>
            <option value="">{t('profile.levelNone')}</option>
            {SkillLevel.LEVELS.map((level) => (
              <option key={level} value={level}>
                {t(`skillLevel.${level}`)}
              </option>
            ))}
          </select>
          <Label className="flex items-center gap-1">
            <input type="checkbox" {...register(`roles.${index}.isPrimary`)} />
            {t('profile.primary')}
          </Label>
          <Button type="button" variant="ghost" onClick={() => roles.remove(index)}>
            {t('profile.remove')}
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        disabled={roles.fields.length >= 10}
        onClick={() => roles.append({ role: 'guitar', detail: '', isPrimary: false, level: '' })}>
        {t('profile.addRole')}
      </Button>

      <Typography as="h3">{t('profile.styles')}</Typography>
      {styles.fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-[2fr_2fr_auto] items-end gap-2">
          <select className={SELECT_CLASS} {...register(`styles.${index}.style`)}>
            {MusicStyle.ALL.map((slug) => (
              <option key={slug} value={slug}>
                {t(`musicStyle.${slug}`)}
              </option>
            ))}
          </select>
          {watch(`styles.${index}.style`) === MusicStyle.OTHER ? (
            <Input placeholder="profile.detail" {...register(`styles.${index}.detail`)} />
          ) : (
            <span />
          )}
          <Button type="button" variant="ghost" onClick={() => styles.remove(index)}>
            {t('profile.remove')}
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        disabled={styles.fields.length >= 20}
        onClick={() => styles.append({ style: 'jazz', detail: '' })}>
        {t('profile.addStyle')}
      </Button>

      {error && (
        <p className="text-destructive" role="alert">
          {ruleMessage ??
            t(ERROR_KEYS[error.errorType as keyof typeof ERROR_KEYS] ?? ERROR_KEYS.INTERNAL)}
          {error.errorType === 'VALIDATION' && ruleMessage === null ? ` (${error.message})` : null}
        </p>
      )}
      {isSaved && <p role="status">{t('profile.saved')}</p>}

      <Button type="submit" disabled={isSaving}>
        {t('profile.save')}
      </Button>
    </form>
  );
}

const RULE_KEYS = {
  DETAIL_ONLY_FOR_OTHER: 'profile.rules.DETAIL_ONLY_FOR_OTHER',
  DETAIL_REQUIRED_FOR_OTHER: 'profile.rules.DETAIL_REQUIRED_FOR_OTHER',
  DUPLICATE_ROLE: 'profile.rules.DUPLICATE_ROLE',
  DUPLICATE_STYLE: 'profile.rules.DUPLICATE_STYLE',
  PHONE_REQUIRED_FOR_CHANNEL: 'profile.rules.PHONE_REQUIRED_FOR_CHANNEL',
  SINGLE_PRIMARY_ROLE: 'profile.rules.SINGLE_PRIMARY_ROLE',
} as const;

const ERROR_KEYS = {
  CONFLICT: 'profile.errors.CONFLICT',
  INTERNAL: 'profile.errors.INTERNAL',
  NETWORK: 'profile.errors.NETWORK',
  VALIDATION: 'profile.errors.VALIDATION',
} as const;
