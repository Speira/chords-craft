import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export function AuthCallback() {
  return (
    <div className="flex flex-col min-h-20 w-full">
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
