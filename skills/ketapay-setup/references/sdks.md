# SDK set-up

Server SDKs cover every endpoint with the same names, errors and behaviour: two automatic retries with backoff reusing the `Idempotency-Key`, an idempotency key on every `POST`, one error class per type, auto-paginating lists and webhook verification. Browser SDKs take no keys. Source: https://docs.ketapay.com/sdks/overview

## Node.js (`@ketapay/node`)

```ts
import KetaPay from '@ketapay/node'
const ketapay = new KetaPay(process.env.KETAPAY_SECRET_KEY!)
// options: new KetaPay({ apiKey, maxRetries, timeoutMs, logLevel, logger, appInfo })
```

Lists: `await` for one page, `for await (const e of ketapay.escrows.list({ status: 'active' }))` for all. Customer proof: last argument `{ customerToken }`. Docs: https://docs.ketapay.com/sdks/node

## PHP (`ketapay/ketapay-php`)

```php
use KetaPay\KetaPay;
$ketapay = new KetaPay(getenv('KETAPAY_SECRET_KEY'));
$session = $ketapay->checkoutSessions->create(['amount' => 45_000_000, /* ... */]);
```

Parameters are arrays with the API's snake_case keys; customer proof is `['customerToken' => $token]` as the last argument. Without Composer (WordPress plugins): copy the package and `require_once __DIR__ . '/ketapay-php/init.php';`. Docs: https://docs.ketapay.com/sdks/php

## Laravel (`ketapay/ketapay-laravel`)

```dotenv
KETAPAY_SECRET_KEY=sk_test_...
KETAPAY_WEBHOOK_SECRET=whsec_...
```

Type-hint `KetaPay\KetaPay` or use the `KetaPay\Laravel\Facades\KetaPay` facade. The package registers `POST /ketapay/webhook`, verifies every delivery, and dispatches events named `ketapay.<event type>` (`Event::listen('ketapay.escrow.funded', fn (WebhookReceived $w) => ...)`). More options: `php artisan vendor:publish --tag=ketapay-config`. Docs: https://docs.ketapay.com/sdks/laravel

## Browser (`@ketapay/checkout`)

```js
import { KetaPay } from '@ketapay/checkout' // or the script tag, which adds window.KetaPay
KetaPay.open({ url, onSuccess, onError, onClose })
```

Docs: https://docs.ketapay.com/sdks/javascript

## React (`@ketapay/react`)

`<KetaPayButton url={() => fetchUrl()} onSuccess={...}>` or the `useKetaPayCheckout()` hook. Docs: https://docs.ketapay.com/sdks/react

## WooCommerce

Install the plugin, open **WooCommerce > Settings > Payments > KetaPay escrow**, paste a secret key and save: it registers its own webhook. Orders follow the escrow (paid = Processing, released = Completed, dispute = On hold, refunded = Refunded). Docs: https://docs.ketapay.com/sdks/woocommerce

## Runnable examples

A shop, a marketplace, a freelance platform, a property sale, digital goods and webhooks, in Node and PHP: https://docs.ketapay.com/sdks/examples
