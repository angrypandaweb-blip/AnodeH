import Script from "next/script";
import { PURCHASE_SEND_TO } from "@/lib/google-conversion";

export function PurchaseConversion({
  transactionId,
  value,
  currency,
}: {
  transactionId: string;
  value: number;
  currency: string;
}) {
  const amount = Number.isFinite(value) && value >= 0 ? value : 0;
  const code = /^[A-Z]{3}$/.test(currency) ? currency : "USD";
  return (
    <Script id="google-ads-purchase" strategy="afterInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('event', 'conversion', {
          'send_to': '${PURCHASE_SEND_TO}',
          'transaction_id': '${transactionId}',
          'value': ${amount},
          'currency': '${code}'
        });
      `}
    </Script>
  );
}
