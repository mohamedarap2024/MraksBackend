import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "STDMarks API",
  description: "Student marks API server",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
