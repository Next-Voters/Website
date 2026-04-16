import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Request a region",
  description:
    "Tell us your country, state or province, and city. We will notify you when your region is available.",
};

export default function RequestRegionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
