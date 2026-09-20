import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export function AuthCallback() {
  return (
    <div className="flex min-h-20 w-full flex-col">
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
