import { Provider } from './provider';

export const metadata = {
  title: 'F1 Pit Wall',
  description: 'Live F1 Telemetry Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}