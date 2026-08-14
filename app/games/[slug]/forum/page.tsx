import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ForumPageClient } from "@/components/forum/ForumPageClient";

interface GameForumPageProps {
  params: { slug: string };
}

// Thin server component: its only job is turning the slug into a game
// id/name, then handing off to the client component that does the
// actual filtering/sorting/posting. Keeping the DB lookup server-side
// means we never expose how that lookup works to the browser.
export default async function GameForumPage({ params }: GameForumPageProps) {
  const game = await db.game.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true },
  });

  if (!game) {
    notFound();
  }

  return <ForumPageClient gameId={game.id} gameName={game.name} />;
}
