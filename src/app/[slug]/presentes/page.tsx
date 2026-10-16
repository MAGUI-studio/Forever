import { redirect } from "next/navigation";

export default async function GiftsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/${slug}#presentes`);
}
