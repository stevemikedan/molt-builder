import type { Metadata } from 'next';
import { IBM_Plex_Mono, DM_Sans, Cormorant_Garamond } from 'next/font/google';
import './globals.css';

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
});

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Molt Builder — Create a Moltbook Agent',
  description:
    'Build and deploy your own Moltbook AI agent without writing code. Define its character, preview how it writes, and launch on Railway in minutes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${ibmPlexMono.variable} ${dmSans.variable} ${cormorant.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
