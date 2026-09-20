import { Main } from '#client-web/components';
import { SignUpPage } from '#client-web/features/auth';

type IPage = PageProps<'/[locale]/auth/sign-up'>;

export default async function Signup(props: IPage) {
  const { locale } = await props.params;
  return (
    <Main>
      <SignUpPage locale={locale} />
    </Main>
  );
}
