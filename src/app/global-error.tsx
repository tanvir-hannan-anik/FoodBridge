"use client";

import "./globals.css";
import { Button, ErrorState } from "@/components/ui";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center">
        <ErrorState action={<Button onClick={reset}>Try again</Button>} />
      </body>
    </html>
  );
}
