"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

export function LinkButton({
  href,
  children,
  variant,
  size,
}: {
  href: string;
  children: React.ReactNode;
} & VariantProps<typeof buttonVariants>) {
  return (
    <Link href={href} className={buttonVariants({ variant, size })}>
      {children}
    </Link>
  );
}
