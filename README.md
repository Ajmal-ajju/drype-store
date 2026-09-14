# DRYPE upgraded store

## Included
- Admin product manager at `/admin.html`
- Secure server-side admin password via Netlify environment variables
- Server-side product storage with Netlify Blobs
- Delivery-information-first checkout
- 12% prepaid discount
- UPI intent generated server-side from `UPI_ID`
- DTDC AWB/consignment tracking link using the official DTDC tracking page
- Existing WhatsApp ordering remains available

## Important production setup
Do not put the admin password or UPI ID into HTML/JS.

In Netlify, add environment variables:
- `ADMIN_PASSWORD` = Iamgroot@7
- `SESSION_SECRET` = Iamgroot@7_Secret
- `UPI_ID` = drype@payment.com
- `UPI_NAME` = DRYPE

The prepaid flow creates a UPI intent but does not automatically prove that a payment was received. For automatic payment verification, connect a payment gateway with server-side webhooks before dispatch.

DTDC consumer tracking uses the official tracking page. A DTDC business API is not assumed here because a current public DTDC tracking API could not be verified. The admin stores the AWB/consignment ID and creates the official tracking link.


The site already had 16 demo products in the supplied JavaScript catalog; the admin API can add new products without editing the source files. Existing WhatsApp ordering remains intact. The supplied site structure is the DRYPE storefront with categories, search, sorting and cart. fileciteturn0file0L201-L237
