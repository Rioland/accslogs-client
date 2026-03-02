# Purchase & Orders Feature - TODO

## Steps

- [x] 1. Append `purchase_product` RPC function to `client/database.sql`
- [x] 2. Update `client/app/components/ProductCheckoutCard.tsx` — add payment handler, auth check, balance check, loading/error/success states
- [x] 3. Fix `client/app/market-place/[id]/page.tsx` — pass correct `productId={product.id}` instead of `0`
- [x] 4. Create `client/app/dashboard/my-orders/page.tsx` — orders page with sidebar, order summary + account credentials
