import './global.css';
import { Providers } from '@/components/providers'

export const metadata = {
  title: 'AWS EC2 VM Monitor',
  description: 'Monitor and control your AWS EC2 instances',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
