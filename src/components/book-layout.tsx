import { ChapterSection } from "./chapter-section";
import { SyntaxHighlighter } from "./syntax-highlighter";
import { Sidebar } from "./sidebar";
import type { Chapter } from "@/content/chapters";

export function BookLayout({ chapters }: { chapters: readonly Chapter[] }) {
  return (
    <div className="layout">
      <SyntaxHighlighter />
      <Sidebar />
      <main className="content" id="top">
        <div className="top"><span>Frontend Engineering • مبانی تا پیشرفته</span><span>مفاهیم • مثال‌ها • سؤال‌وجواب</span></div>
        <div className="cover">
          <span className="eyebrow">LEARNING BOOK · VOLUME 01</span>
          <h1>Frontend Engineering<br />از مفاهیم تا معماری</h1>
          <p>مسیر یادگیری مهندسی نرم‌افزار؛ از React و مبانی مهندسی تا Go و هوش مصنوعی.</p>
          <div><span className="pill">فصل اول: Frontend Engineering</span><span className="pill">مطالعه + سؤال‌وجواب</span></div>
        </div>
        <p className="intro">مباحث فعلی React حفظ شده‌اند و سرفصل‌های تازه JavaScript، TypeScript، Next.js، مرورگر، معماری، کیفیت و انتشار به آن‌ها اضافه شده‌اند. هر بخش یک نقطه شروع برای مطالعه عمیق‌تر است.</p>
        {chapters.map((chapter) => <ChapterSection key={chapter.id} chapter={chapter} />)}
        <footer className="foot">نسخه دوم • Next.js static export • قابل مطالعه در مرورگر</footer>
      </main>
    </div>
  );
}
