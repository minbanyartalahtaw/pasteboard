"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    // No system option: the theme is always an explicit light or dark choice.
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
