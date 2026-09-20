import { Loader, Main } from "#client-web/components";
import { AuthCallback } from "#client-web/features/auth";

export default function Callback() {
  return (
    <Main>
      <Loader />
      <AuthCallback />
    </Main>
  );
}
