# ISR در Next.js — مثال کامل ۱۶۰ ثانیه

این درس مربوط به سرفصل **Next.js Architecture → ISR و Revalidation** است و برای App Router با تنظیمات رایج (بدون `cacheComponents`) نوشته شده است.

## مفاهیم

`revalidate = 160` یعنی صفحه پس از گذشت ۱۶۰ ثانیه *واجد شرایط بازاعتبارسنجی* می‌شود؛ بازسازی دقیقاً هر ۱۶۰ ثانیه خودکار اجرا نمی‌شود. درخواست بعدی می‌تواند بازسازی در پس‌زمینه را شروع کند و تا آماده‌شدن خروجی جدید، نسخه قبلی ارائه شود. برای محصولی با قیمت لحظه‌ای، در Checkout باید قیمت و موجودی دوباره روی سرور تأیید شوند.

ساختار:
```text
src/app/products/[id]/page.tsx
src/app/api/revalidate/route.ts
.env.local
```

## صفحه محصول

```tsx
// src/app/products/[id]/page.tsx
import { notFound } from "next/navigation";

export const revalidate = 160;
export const dynamicParams = true;

type Product = {
  id: number;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
};

async function getProduct(id: string): Promise<Product | null> {
  const response = await fetch(`https://dummyjson.com/products/${id}`, {
    next: { revalidate: 160 },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Product fetch failed");
  return response.json();
}

export async function generateStaticParams() {
  return [{ id: "1" }];
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <main>
      <h1>{product.title}</h1>
      <img src={product.thumbnail} alt={product.title} width={300} height={300} />
      <p>{product.description}</p>
      <strong>Price: {product.price}</strong>
    </main>
  );
}
```

`generateStaticParams` محصول ۱ را هنگام Build تعیین می‌کند. `dynamicParams = true` اجازه می‌دهد سایر محصولات هنگام درخواست ساخته شوند. `export const revalidate` در سطح صفحه و `next.revalidate` در سطح fetch دو راه تنظیم‌اند؛ در این مثال ساده، تنظیم هر دو با یک مقدار الزامی نیست.

## On-demand Revalidation

بعد از **ذخیره موفق تغییر قیمت در منبع داده** می‌توان مسیر محصول را با `revalidatePath` نامعتبر کرد. این API در محیط سرور فراخوانی می‌شود و نباید بدون احراز هویت و مجوز ویرایش در اختیار کلاینت قرار گیرد.

```tsx
// src/app/api/revalidate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidate-secret");
  if (!process.env.REVALIDATE_SECRET ||
      secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const id = (body as { id?: unknown } | null)?.id;
  if (typeof id !== "string" || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
  }

  revalidatePath(`/products/${id}`);
  return NextResponse.json({ success: true, id });
}
```

```env
# .env.local
REVALIDATE_SECRET=replace-with-long-random-value
```

```bash
npm run build
npm run start

curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: replace-with-long-random-value" \
  -d '{"id":"1"}'
```

این endpoint فقط کش را نامعتبر می‌کند و داده DummyJSON را تغییر نمی‌دهد. در Route Handler، بازسازی عموماً در مراجعه بعدی رخ می‌دهد؛ کاربران دارای صفحه باز الزاماً فوراً نتیجه تازه را نمی‌بینند. رفتار development ممکن است با production متفاوت باشد.

## پرسش‌های مصاحبه

**تفاوت revalidate = 160 با revalidatePath؟** اولی بازاعتبارسنجی زمان‌محور، دومی نامعتبرسازی رویدادمحور برای یک مسیر مشخص است.

**آیا بعد از ۱۶۰ ثانیه حتماً نسخه تازه نمایش داده می‌شود؟** خیر؛ ممکن است درخواست بعدی ابتدا نسخه قبلی را دریافت کند و بازسازی در پس‌زمینه انجام شود.

**آیا ISR برای قیمت Checkout کافی است؟** خیر؛ قیمت و موجودی نهایی باید توسط سرور تأیید شوند.

**اگر cacheComponents فعال باشد؟** مدل کش متفاوت است و از `use cache` و `cacheLife` استفاده می‌شود.

منبع: https://nextjs.org/docs/app/guides/incremental-static-regeneration
