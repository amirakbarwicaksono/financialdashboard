import '@app/ui/global.css';
import { inter } from '@/app/ui/font';  // Importing global CSS and font styles


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
