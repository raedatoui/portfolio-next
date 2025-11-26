import type { Metadata } from 'next';
import Script from 'next/script';
import { Work_Sans } from 'next/font/google';
import { AppProvider } from '@/context/AppContext';
import Header from '@/components/Header';
import { loadContent } from '@/lib/LoadContent';
import { GTM_ID } from '@/lib/constants';
import './globals.css';

const content = loadContent();

const workSans = Work_Sans({
    subsets: ['latin'],
    weight: ['400', '500', '600'],
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Raed Atoui',
    description: content.bio.content,
    keywords: ['Raed Atoui', 'portfolio', 'developer', 'programmer', 'full-stack', 'TypeScript', 'React', 'Next.js', 'Python'],
    authors: [{ name: 'Raed Atoui' }],
    openGraph: {
        title: 'Raed Atoui',
        description: content.bio.content,
        type: 'website',
        url: 'https://raedatoui.com',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Raed Atoui',
        description: content.bio.content,
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const { header } = content;
    const isGTM = GTM_ID?.startsWith('GTM-');
    const isGA = GTM_ID && !isGTM;

    if (process.env.NODE_ENV === 'development' && !GTM_ID) {
        console.warn('NEXT_PUBLIC_GTM_ID is not defined. Analytics will not work.');
    }

    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${workSans.className} min-h-screen`}>
                {isGTM && (
                    <Script
                        id="gtm-script"
                        strategy="afterInteractive"
                        // biome-ignore lint/security/noDangerouslySetInnerHtml: GTM Script
                        dangerouslySetInnerHTML={{
                            __html: `
                                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                                })(window,document,'script','dataLayer','${GTM_ID}');
                            `,
                        }}
                    />
                )}
                {isGTM && (
                    <noscript>
                        <iframe
                            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                            height="0"
                            width="0"
                            style={{ display: 'none', visibility: 'hidden' }}
                            title="gtm"
                        />
                    </noscript>
                )}
                {isGA && (
                    <>
                        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GTM_ID}`} strategy="afterInteractive" />
                        <Script id="google-analytics" strategy="afterInteractive">
                            {`
                                window.dataLayer = window.dataLayer || [];
                                function gtag(){dataLayer.push(arguments);}
                                gtag('js', new Date());
                                gtag('config', '${GTM_ID}');
                            `}
                        </Script>
                    </>
                )}
                <AppProvider content={content}>
                    <div className="max-w-[1200px] mx-auto min-h-screen flex flex-col">
                        <Header data={header} />
                        {children}
                        <footer className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-grey/60">
                            <p>&copy; {new Date().getFullYear()} Raed Atoui</p>
                        </footer>
                    </div>
                </AppProvider>
            </body>
        </html>
    );
}
