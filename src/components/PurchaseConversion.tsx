import Script from "next/script";
import { PURCHASE_SEND_TO } from "@/lib/google-conversion";

export function PurchaseConversion({ transactionId }: { transactionId: string }) {
  return (
    <Script id="google-ads-purchase" strategy="afterInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('event', 'conversion', {
          'send_to': '${PURCHASE_SEND_TO}',
          'transaction_id': '${transactionId}'
        });
      `}
    </Script>
  );
}
