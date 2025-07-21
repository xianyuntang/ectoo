import './global.css';
import { Providers } from '@/components/providers';

export const metadata = {
  title: 'ECToo',
  description: 'Monitor and control your AWS EC2 instances',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
