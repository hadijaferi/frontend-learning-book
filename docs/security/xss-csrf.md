# امنیت فرانت‌اند: XSS و CSRF

> یادداشت آموزشی برای React و Next.js — همراه با مثال، راهکارهای دفاعی و نکات مصاحبه Senior Frontend.

## تفاوت در یک نگاه

| موضوع | XSS (Cross-Site Scripting) | CSRF (Cross-Site Request Forgery) |
|---|---|---|
| هدف مهاجم | اجرای JavaScript ناخواسته در بستر سایت قربانی | وادارکردن مرورگر کاربر لاگین‌شده به ارسال درخواست ناخواسته |
| عامل اصلی | رندر ناامن داده کنترل‌شده توسط مهاجم | اعتماد به احراز هویت Cookie بدون بررسی مشروعیت درخواست |
| دفاع‌های مهم | خروجی امن JSX، Sanitization در صورت نیاز، CSP | SameSite، بررسی Origin، CSRF Token |

## ۱. XSS در React

### نمایش امن متن

React مقدار رشته‌ای داخل JSX را به شکل متن نمایش می‌دهد، نه HTML اجرایی:

```tsx
export function Comment({ text }: { text: string }) {
  return <p>{text}</p>;
}
```

اگر مقدار `text` برابر `<img src=x onerror=alert(1)>` باشد، این رشته به شکل متن دیده می‌شود و رویداد اجرا نمی‌شود.

### رندر آسیب‌پذیر

```tsx
// ❌ محتوای کاربر نباید مستقیم وارد HTML خام شود
export function UnsafeComment({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

برای مثال، `<img src="x" onerror="alert('XSS')">` در چنین شرایطی می‌تواند هنگام خطای بارگذاری تصویر اجرا شود.

### وقتی واقعاً HTML لازم داریم

در یک **Client Component** می‌توان HTML غیرقابل‌اعتماد را با DOMPurify پاک‌سازی کرد:

```bash
npm install dompurify
```

```tsx
"use client";

import DOMPurify from "dompurify";

export function RichComment({ html }: { html: string }) {
  const safeHtml = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}
```

این نمونه برای مرورگر است؛ در SSR باید راهکار Sanitization سازگار با محیط سرور انتخاب شود. تنظیمات allowlist و جلوگیری از دستکاری HTML پس از پاک‌سازی نیز مهم‌اند.

- **Escape**: نمایش نشانه‌های HTML به شکل متن، مثل `<strong>Hi</strong>`.
- **Sanitize**: حذف بخش‌های خطرناک از HTML و حفظ تگ‌های مجاز.
- **دفاع چندلایه**: CSP مناسب و خودداری از sinkهای خطرناک، مانند `innerHTML` برای محتوای کاربر.

### XSS و محل نگهداری توکن

- توکن در `localStorage` برای JavaScript همان Origin قابل خواندن است؛ XSS می‌تواند آن را سرقت کند.
- `HttpOnly Cookie` با `document.cookie` قابل خواندن نیست؛ اما XSS همچنان می‌تواند درخواست‌های مجاز را از طرف کاربر اجرا کند.
- در معماری Cookie-based، مرورگر Cookie معتبر را خودش همراه درخواست می‌فرستد. در درخواست Cross-Origin مبتنی بر Axios معمولاً `withCredentials: true` لازم است، همراه با تنظیمات درست Cookie و CORS.
- اگر Backend هدر `Authorization: Bearer` می‌خواهد، کلاینت نمی‌تواند توکن را از HttpOnly Cookie بخواند؛ می‌توان از BFF یا Route Handler سمت سرور Next.js کمک گرفت.

## ۲. CSRF چیست؟

فرض کن کاربری در `https://bank.example` لاگین است و نشست او در Cookie قرار دارد. یک سایت دیگر می‌کوشد مرورگر او را وادار کند درخواست انتقال پول بفرستد. اگر Cookie در آن درخواست ارسال شود و سرور فقط Cookie معتبر را بررسی کند، عملیات ناخواسته ممکن است انجام شود.

**POST به‌تنهایی مانع CSRF نیست.** فرم HTML هم می‌تواند POST ارسال کند. البته موفقیت حمله به فرمت ورودی موردقبول API، سیاست SameSite و سایر دفاع‌ها بستگی دارد؛ مثلاً فرم urlencoded عیناً با APIای که فقط JSON می‌پذیرد سازگار نیست.

### راهکار A: بررسی Origin در Route Handler

```ts
// app/api/transfer/route.ts
import { NextRequest, NextResponse } from "next/server";

const TRUSTED_ORIGIN = "https://app.example.com";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin !== TRUSTED_ORIGIN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // مثال مفهومی: این دو تابع باید در پروژه پیاده‌سازی شوند.
  const session = await getAuthenticatedSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  // در کد واقعی: اعتبارسنجی schema، مجوز حساب مقصد،
  // کنترل مبلغ و ثبت تراکنش اتمیک نیز ضروری است.
  await transferMoney(session.userId, body);
  return NextResponse.json({ ok: true });
}
```

در Endpoint حساس، Origin غایب یا غیرمجاز نباید خودکار مورد اعتماد قرار بگیرد. Origin در مرورگر محدودیت امنیتی مهمی دارد، اما جایگزین احراز هویت و کنترل مجوز نیست.

### راهکار B: Cookie مناسب

```ts
response.cookies.set("session", sessionId, {
  httpOnly: true,
  secure: true,
  sameSite: "lax", // یا "strict" بر اساس تجربه کاربری و نیاز محصول
  path: "/",
});
```

- `HttpOnly`: جلوگیری از خواندن Cookie توسط JS، **نه** جلوگیری مستقیم از CSRF.
- `Secure`: محدودکردن ارسال Cookie به HTTPS.
- `SameSite=Strict`: جلوگیری از ارسال Cookie در درخواست‌های Cross-Site.
- `SameSite=Lax`: محافظت در بیشتر درخواست‌های Cross-Site تغییردهنده وضعیت، با اجازه برخی ناوبری‌های سطح بالا.
- `SameSite=None`: برای سناریوهای Cross-Site نیازمند `Secure` است و به محافظت CSRF قوی‌تری نیاز دارد.

### راهکار C: CSRF Token

در الگوی **Synchronizer Token**، سرور Token تصادفی و غیرقابل‌حدسی را به نشست مرتبط می‌کند و از کلاینت می‌خواهد در درخواست حساس آن را ارسال کند:

```ts
const { data } = await api.get("/auth/csrf");

await api.post(
  "/transfer",
  { amount: 100_000, toAccount: "123456" },
  { headers: { "X-CSRF-Token": data.csrfToken } }
);
```

سرور باید CSRF Token را در برابر نشست همان کاربر **اعتبارسنجی** کند. صرف وجود هدر کافی نیست. مهاجم Cross-Site معمولاً نمی‌تواند پاسخ Endpoint صدور CSRF Token را بخواند یا هدر سفارشی را بدون گذر از سیاست‌های CORS ارسال کند. CORS نباید Originهای ناشناس را با Credentials مجاز کند.

## ۳. Same-Origin و Same-Site

- `https://app.example.com` و `https://api.example.com`: **Cross-Origin** ولی **Same-Site** (با HTTPS در هر دو).
- `https://app.example.com` و `https://api.another.com`: **Cross-Site**.

در مثال اول، `SameSite=Strict` به‌خودی‌خود جلوی ارسال Cookie معتبر API را نمی‌گیرد؛ اما دامنه و مسیر Cookie، `withCredentials` و CORS نیز اهمیت دارند.

در مثال دوم، `SameSite=Strict` Cookie را در درخواست Cross-Site ارسال نمی‌کند. همچنین یک ساب‌دامین آلوده می‌تواند **Same-Site** محسوب شود؛ پس SameSite به‌تنهایی دفاع کامل CSRF نیست.

## ۴. پاسخ کوتاه مصاحبه

**جلوگیری از XSS:** در React داده کاربر را با JSX به صورت متن نمایش می‌دهم. اگر HTML لازم باشد آن را با Sanitizer معتبر پاک‌سازی می‌کنم، از CSP و اجتناب از sinkهای ناامن بهره می‌برم و توکن حساس را بی‌دلیل در localStorage نمی‌گذارم.

**جلوگیری از CSRF:** برای عملیات تغییردهنده وضعیت، علاوه بر احراز هویت و بررسی مجوز، از تنظیمات درست SameSite/Secure، اعتبارسنجی Origin و در صورت نیاز CSRF Token وابسته به نشست استفاده می‌کنم؛ POST و HttpOnly به‌تنهایی کافی نیستند.

## منابع

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- [MDN: Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)
