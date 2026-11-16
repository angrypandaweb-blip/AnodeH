// Google Ads does not send a price on an individual click. The price we can
// use is the campaign's reported cost that day divided by the clicks it reported.
export function googleClickPriceExpr(click = "c"): string {
  return `(
    SELECT CASE WHEN gd.clicks > 0 THEN gd.cost_micros * 1.0 / gd.clicks / 1000000 ELSE NULL END
    FROM google_clicks gc
    JOIN google_daily gd
      ON gd.user_id = gc.user_id
     AND gd.campaign = gc.campaign
     AND gd.day = date(gc.ts, 'unixepoch')
    WHERE gc.user_id = ${click}.user_id
      AND ${click}.click_id != ''
      AND gc.gclid = ${click}.click_id
    LIMIT 1
  )`;
}
