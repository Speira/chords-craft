'use client';

import { useUser } from '@clerk/nextjs';

import { Button, Loader } from '#client-web/components';
import { useAppTranslations } from '#client-web/lib/nextIntl/useAppTranslation';

import { errorMessageKey } from './errorMessages';
import { useMyProfile } from './hooks';
import { ProfileForm } from './ProfileForm';
import { UnavailabilityList } from './UnavailabilityList';

export function ProfilePage() {
  const { user } = useUser();
  const t = useAppTranslations();
  const { error, isLoading, profile, reload } = useMyProfile();

  if (isLoading) return <Loader />;

  // A failed load must not show an empty form: saving it would overwrite the real profile.
  // The unavailability list loads independently, so it stays available.
  if (error) {
    return (
      <>
        <div className="flex flex-col items-start gap-2">
          <p className="text-destructive" role="alert">
            {t(errorMessageKey(error.errorType))}
          </p>
          <Button type="button" variant="outline" onClick={() => void reload()}>
            {t('profile.retry')}
          </Button>
        </div>
        <UnavailabilityList />
      </>
    );
  }

  return (
    <>
      <ProfileForm
        email={profile?.email ?? user?.primaryEmailAddress?.emailAddress ?? ''}
        profile={profile}
      />
      <UnavailabilityList />
    </>
  );
}
