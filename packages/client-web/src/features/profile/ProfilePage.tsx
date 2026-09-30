'use client';

import { useUser } from '@clerk/nextjs';

import { Loader } from '#client-web/components';

import { useMyProfile } from './hooks';
import { ProfileForm } from './ProfileForm';
import { UnavailabilityList } from './UnavailabilityList';

export function ProfilePage() {
  const { user } = useUser();
  const { isLoading, profile } = useMyProfile();

  if (isLoading) return <Loader />;

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
