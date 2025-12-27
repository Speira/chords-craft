import { Main } from "~/components";
import { LoginPage } from "~/features/auth";

type IPage = PageProps<"/[locale]/auth/login">;

export default async function Login(props: IPage) {
  const { locale } = await props.params;
  return (
    <Main>
      <LoginPage locale={locale} />
    </Main>
  );
}
