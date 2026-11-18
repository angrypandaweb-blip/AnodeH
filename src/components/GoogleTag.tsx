import Script from "next/script";

const AW_ID = "AW-18572224940";

export function GoogleTag() {
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${AW_ID}`} strategy="beforeInteractive" />
      <Script id="google-ads-tag" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${AW_ID}');
        `}
      </Script>
    </>
  );
}
