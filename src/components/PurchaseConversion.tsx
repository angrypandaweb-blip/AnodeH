import Script from "next/script";
import { PURCHASE_SEND_TO } from "@/lib/google-conversion";

/** Event snippet for Purchase conversion page — place right after the Google tag. */
export function PurchaseConversion({ transactionId = "" }: { transactionId?: string }) {
  const id = JSON.stringify(transactionId);
  return (
    <Script id="google-ads-purchase" strategy="beforeInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('event', 'conversion', {
          'send_to': '${PURCHASE_SEND_TO}',
          'transaction_id': ${id}
        });
      `}
    </Script>
  );
}
