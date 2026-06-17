import ComponentA from '@/components/ComponentA';
import '../globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <ComponentA />
        {children}
      </body>
    </html>
  );
}
