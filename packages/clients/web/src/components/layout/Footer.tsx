import { Mail, Phone } from "lucide-react";

import K from "~/constants";
import { getAppTranslations } from "~/lib/next-intl/getAppTranslation";

import { Link } from "../Link";
import { Typography } from "../Typography";

export async function Footer() {
  const t = await getAppTranslations();

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="mx-auto">
            <Typography
              as="h3"
              label="general.title"
              className="mb-4 text-lg font-semibold"
            />
            <Typography
              className="text-muted-foreground mb-4 text-sm"
              as="p"
              label="general.description"
            />
          </div>

          <div className="mx-auto">
            <Typography as="h4" label="general.help" className="mb-4  font-semibold" />
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={K.PATHS.CONTACT} label="contact.title" />
              </li>
              <li>
                <Link href={K.PATHS.FAQ} label="general.faq" />
              </li>
            </ul>
          </div>

          <div className="flex-col flex mx-auto">
            <Typography as="h4" label="social.title" className="mb-4 font-semibold" />
            <div className="mb-4 flex gap-4">
              <Link href={K.SOCIAL.FACEBOOK} target="_blank" title={t("social.facebook")}>
                <img
                  height="32"
                  width="32"
                  src="https://unpkg.com/simple-icons/icons/facebook.svg"
                />
              </Link>
              <Link
                href={K.SOCIAL.INSTAGRAM}
                target="_blank"
                title={t("social.instagram")}>
                <img
                  height="32"
                  width="32"
                  src="https://unpkg.com/simple-icons/icons/instagram.svg"
                />
              </Link>
              <Link href={K.SOCIAL.X} target="_blank" title={t("social.twitter")}>
                <img
                  height="32"
                  width="32"
                  src="https://unpkg.com/simple-icons/icons/x.svg"
                />
              </Link>
              <Link href={K.SOCIAL.SNAPCHAT} target="_blank" title={t("social.snapchat")}>
                <img
                  height="32"
                  width="32"
                  src="https://unpkg.com/simple-icons/icons/snapchat.svg"
                />
              </Link>
            </div>
            <div className="text-muted-foreground flex flex-col gap-2 text-sm">
              <Link
                href={`mailto:${K.CONTACT.EMAIL}`}
                className="flex items-center gap-2">
                <Mail size={18} />
                <Typography as="span" before={K.CONTACT.EMAIL} />
              </Link>
              <Link href={`tel:${K.CONTACT.PHONE}`} className="flex items-center gap-2">
                <Phone size={18} />
                <Typography as="span" before={K.CONTACT.PHONE} />
              </Link>
            </div>
          </div>
        </div>
        <div className="text-muted-foreground mt-8 border-t pt-8 text-center text-sm">
          © {new Date().getFullYear()} {t("general.title")}.{" "}
          {t("general.allRightsReserved")}.
        </div>
      </div>
    </footer>
  );
}
