import { Mail, Phone } from "lucide-react";

import K from "~/constants";
import { getAppTranslations } from "~/lib/next-intl/getAppTranslation";

import { Link } from "./Link";
import { Typography } from "./Typography";

export async function Footer() {
  const t = await getAppTranslations();

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 [&>div]:mx-auto">
          <div>
            <Typography
              isServer
              as="h3"
              label="general.title"
              className="mb-4 text-lg font-semibold"
            />
            <Typography
              isServer
              className="text-muted-foreground mb-4 text-sm"
              as="p"
              label="general.description"
            />
          </div>

          <div>
            <Typography
              isServer
              as="h4"
              label="general.legal"
              className="mb-4 font-semibold"
            />
            <ul className="space-y-2 text-sm">
              <li>
                <Link isServer href={K.PATHS.PRIVACY} label="general.privacy" />
              </li>
              <li>
                <Link isServer href={K.PATHS.TERMS} label="general.terms" />
              </li>
              <li>
                <Link isServer href={K.PATHS.LICENSE} label="general.license" />
              </li>
            </ul>
          </div>

          <div className="flex-col flex">
            <Typography
              isServer
              as="h4"
              label="social.title"
              className="mb-4 font-semibold"
            />
            <div className="mb-4 flex gap-4">
              <Link
                isServer
                href={K.SOCIAL.FACEBOOK}
                target="_blank"
                title={t("social.facebook")}>
                <img
                  height="32"
                  width="32"
                  src="https://unpkg.com/simple-icons/icons/facebook.svg"
                />
              </Link>
              <Link
                isServer
                href={K.SOCIAL.INSTAGRAM}
                target="_blank"
                title={t("social.instagram")}>
                <img
                  height="32"
                  width="32"
                  src="https://unpkg.com/simple-icons/icons/instagram.svg"
                />
              </Link>
              <Link
                isServer
                href={K.SOCIAL.X}
                target="_blank"
                title={t("social.twitter")}>
                <img
                  height="32"
                  width="32"
                  src="https://unpkg.com/simple-icons/icons/x.svg"
                />
              </Link>
              <Link
                isServer
                href={K.SOCIAL.SNAPCHAT}
                target="_blank"
                title={t("social.snapchat")}>
                <img
                  height="32"
                  width="32"
                  src="https://unpkg.com/simple-icons/icons/snapchat.svg"
                />
              </Link>
            </div>
            <div className="text-muted-foreground flex flex-col gap-2 text-sm">
              <Link
                isServer
                href={`mailto:${K.CONTACT.EMAIL}`}
                className="flex items-center gap-2">
                <Mail size={18} />
                <Typography isServer as="span" startNode={K.CONTACT.EMAIL} />
              </Link>
              <Link
                isServer
                href={`tel:${K.CONTACT.PHONE}`}
                className="flex items-center gap-2">
                <Phone size={18} />
                <Typography isServer as="span" startNode={K.CONTACT.PHONE} />
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
