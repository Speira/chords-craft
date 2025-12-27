import { Loader, Main } from "~/components";
import { AuthCallback } from "~/features/auth";

export default function Callback() {
  return (
    <Main>
      <Loader />
      <AuthCallback />
    </Main>
  );
}
