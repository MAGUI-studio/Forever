import { pageMetadata, SEO_ORIGIN, SEO_IMAGE, jsonLd } from "@/lib/seo";
import { ForeverLandingPage } from "@/components/forever/ForeverLandingPage";

export const metadata = pageMetadata({
  title: "Forever | Sites de casamento",
});

export default function ForeverHome() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": "https://magui.studio/#organization",
                name: "MAGUI.studio",
                url: "https://magui.studio",
              },
              {
                "@type": "WebSite",
                "@id": SEO_ORIGIN + "/#website",
                name: "Forever",
                url: SEO_ORIGIN,
                inLanguage: "pt-BR",
                image: SEO_IMAGE.url,
                publisher: { "@id": "https://magui.studio/#organization" },
              },
            ],
          }),
        }}
      />
      <ForeverLandingPage />
    </>
  );
}
