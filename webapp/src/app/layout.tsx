import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import TopNav from "@/components/nav/TopNav";
import SideMenu from "@/components/SideMenu";

export const metadata: Metadata = {
  title: "MyStackOverflow",
  description: "A community Q&A site for .NET and web developers: ask questions, share answers, earn reputation.",
};

// Every page renders TopNav, which reads the session, so none of them can ever
// be static anyway. Declaring it stops `next build` from trying to prerender
// pages that call the API: API_URL only exists at runtime, and in a container
// build the attempt fails outright instead of falling back to dynamic.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={'h-full'} suppressHydrationWarning>
      <body className={'flex flex-col bg-stone-200 dark:bg-gray-950 h-full text-gray-900 dark:text-gray-100'}>
        <Providers>
          <TopNav/>
          <div className={'flex grow overflow-auto'}>
            <aside className={'basis-1/6 shrink-0 border-r border-neutral-300 dark:border-gray-700 pt-20 sticky top-0'}>
              <SideMenu/>
            </aside>
            <main className={'flex-1 pt-20 h-full'}>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
