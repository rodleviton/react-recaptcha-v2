# React reCAPTCHA v2

A lightweight, fully-typed reCAPTCHA v2 wrapper for React & Next.js **App Router** projects.

* 👉 Zero external dependencies (besides React)
* 👉 Typed React component **and** hook (`useReCaptcha`)
* 👉 Supports **normal**, **compact**, and **invisible** modes
* 👉 Works out-of-the-box in **Next.js 13 / 14 App Router** (Server Components + client components)
* 👉 Tree-shakable / side-effect-free build (`esm` & `cjs` + `.d.ts`)

---

## Installation

```bash
npm install react-recaptcha-v2
# or
yarn add react-recaptcha-v2
# or
pnpm add react-recaptcha-v2
```

> The package declares **peer dependencies** for `react`, `react-dom`, and `next`.

---

## Quick Start

### 1️⃣ Add your **client-side site key**

Google reCAPTCHA Admin → **Keys** → copy the **Site key** (not the secret).

### 2️⃣ Use the `ReCaptcha` component (client)

> **Important**: Because Google’s script touches `window`, the component **must** be rendered inside a **Client Component** in the App Router world (`'use client'` on top).

```tsx
// app/contact/_components/ReCaptchaBox.tsx
'use client';

import { ReCaptcha } from 'react-recaptcha-v2';

export default function ReCaptchaBox() {
  return (
    <ReCaptcha
      siteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
      onVerify={(token) => console.log('Token ->', token)}
    />
  );
}
```

That’s it—`token` is ready to send to your API route for verification.

---

## Examples

### Normal size (default)

```tsx
'use client';
import { ReCaptcha } from 'react-recaptcha-v2';

<ReCaptcha
  siteKey="YOUR_SITE_KEY"
/>
```

### Compact size + dark theme

```tsx
<ReCaptcha
  siteKey="YOUR_SITE_KEY"
  size="compact"
  theme="dark"
/>
```

### Invisible reCAPTCHA (programmatic execute)

```tsx
'use client';
import { ReCaptcha } from 'react-recaptcha-v2';
import { useRef } from 'react';

export default function SubmitButton() {
  const recaptchaRef = useRef<import('react-recaptcha-v2').ReCaptchaInstance>(null);

  const handleClick = () => {
    // triggers the challenge
    recaptchaRef.current?.execute();
  };

  return (
    <>
      <ReCaptcha
        ref={recaptchaRef}
        siteKey="YOUR_SITE_KEY"
        size="invisible"
        onVerify={(token) => alert(`Verified token: ${token}`)}
      />
      <button onClick={handleClick}>Submit form</button>
    </>
  );
}

### Invisible reCAPTCHA with **async/await**

```tsx
'use client';
import { ReCaptcha } from 'react-recaptcha-v2';
import { useRef } from 'react';

export default function SubmitAsync() {
  const recaptchaRef = useRef<import('react-recaptcha-v2').ReCaptchaInstance>(null);

  const handleSubmit = async () => {
    try {
      // 🔑 new executeAsync() returns the token
      const token = await recaptchaRef.current?.executeAsync();
      console.log('Verified token:', token);
      // …send `token` to your API
    } catch (err) {
      console.error('reCAPTCHA error', err);
    }
  };

  return (
    <>
      <ReCaptcha
        ref={recaptchaRef}
        siteKey="YOUR_SITE_KEY"
        size="invisible"
      />
      <button onClick={handleSubmit}>Submit form</button>
    </>
  );
}
```

### Using the `useReCaptcha` hook directly

```tsx
'use client';
import { useReCaptcha } from 'react-recaptcha-v2';

export default function HookDemo() {
  const {
    containerRef,
    isReady,
    execute,
    reset,
    getResponse
  } = useReCaptcha({
    siteKey: 'YOUR_SITE_KEY',
    size: 'invisible',
    onVerify: (token) => console.log('Verified', token)
  });

  return (
    <>
      <div ref={containerRef} />
      <button disabled={!isReady} onClick={execute}>
        Verify
      </button>
      <button onClick={() => console.log(getResponse())}>Read token</button>
      <button onClick={reset}>Reset</button>
    </>
  );
}
```

---

## Next.js (App Router) notes

* Components that import `react-recaptcha-v2` must include `'use client'`.
* The library loads Google’s script only **once**, then caches.
* Server Components can render children that **contain** the client component; just keep the actual `ReCaptcha` in a client boundary.

---

## API Reference

### `<ReCaptcha …props />`

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `siteKey` | `string` | — | Your public key from Google Console **(required)** |
| `theme` | `'light' \| 'dark'` | `'light'` | Widget theme |
| `size` | `'normal' \| 'compact' \| 'invisible'` | `'normal'` | Widget size / mode |
| `badge` | `'bottomright' \| 'bottomleft' \| 'inline'` | `'bottomright'` | Position for invisible badge |
| `tabIndex` | `number` | `0` | Tab index |
| `language` | `string` | — | Two-letter locale (`fr`, `ja`, …) |
| `explicit` | `boolean` | `false` | Disable auto render—call hook’s `renderReCaptcha()` manually |
| `hideBadge` | `boolean` | `false` | CSS-hides badge (⚠ follow Google TOS) |
| Callback props | `onVerify`, `onExpired`, `onError`, `onLoad` | — | Lifecycle callbacks |

#### Ref methods (`ReCaptchaInstance`)

* `execute()` – trigger challenge (invisible only)
* `executeAsync()` – trigger **and** resolve with the token (Promise, invisible only)
* `reset()` – reset widget
* `getResponse()` – current token

### `useReCaptcha(options)`

Same options as `<ReCaptcha>` (minus `className`/`id`) plus:

| Return value | Type | Description |
| ------------ | ---- | ----------- |
| `containerRef` | `Ref<HTMLDivElement>` | Attach to a `<div>` placeholder |
| `execute`, `executeAsync`, `reset`, `getResponse` | — | Same methods as ref |
| `isLoaded` | `boolean` | Script finished loading |
| `isReady` | `boolean` | Widget rendered & usable |
| `error` | `string \| null` | Error during load/render |

### Utility exports

```ts
import {
  isReCaptchaAvailable,
  loadReCaptchaScript,
  onReCaptchaLoad,
  generateUniqueId
} from 'react-recaptcha-v2';
```

---

## Troubleshooting

| Issue | Fix |
| ----- | --- |
| *Nothing renders* | Ensure component is in a **client component** (`'use client'`). |
| *`grecaptcha not defined`* | You are calling methods before `isReady` is `true`. |
| *Badge hidden warning* | If you set `hideBadge`, show your own disclosure per Google ToS. |
| *Multiple script tags* | Library guards against double-injection; if you add `<script>` manually, remove it. |

---

## Server-side verification

This package is **client-only**. Verify the token server-side:

```ts
// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  const res = await fetch(
    `https://www.google.com/recaptcha/api/siteverify`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY!,
        response: token
      })
    }
  );

  const json = await res.json();

  if (!json.success) {
    return NextResponse.json({ error: 'reCAPTCHA failed' }, { status: 400 });
  }

  // continue handling…
}
```

---

## License

MIT © Rodney Leviton
