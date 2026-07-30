import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ChainFlow — Natural Language On-Chain Automation',
  description: 'AI-powered on-chain rule creation and execution engine powered by KeeperHub on Ethereum Sepolia.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
