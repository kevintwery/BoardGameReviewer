import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// A couple of real games with hand-filled data, just enough to see every
// part of the game detail page working (hero banner, videos, similar
// games via shared categories). Run with `npm run db:seed`.
async function main() {
  const wingspan = await db.game.upsert({
    where: { bggId: 266192 },
    update: {},
    create: {
      bggId: 266192,
      slug: "wingspan",
      name: "Wingspan",
      description:
        "A competitive, medium-weight, card-driven engine-building board game about birds.",
      imageUrl: "https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__original/img/wingspan.jpg",
      minPlayers: 1,
      maxPlayers: 5,
      playingTime: 70,
      bggWeight: 2.4,
      categories: ["Strategy", "Animals"],
      mechanics: ["Engine Building", "Card Drafting"],
      avgRating: 8.1,
      ratingCount: 42,
      videos: {
        create: [
          { youtubeVideoId: "lH2XCq0oCoA", title: "Wingspan - How to Play", sortOrder: 0 },
        ],
      },
    },
  });

  await db.game.upsert({
    where: { bggId: 174430 },
    update: {},
    create: {
      bggId: 174430,
      slug: "gloomhaven",
      name: "Gloomhaven",
      description:
        "A cooperative campaign game of tactical combat in a persistent, ever-evolving fantasy world.",
      imageUrl: "https://live.staticflickr.com/65535/47096076184_0cfffd4ec9_b.jpg",
      minPlayers: 1,
      maxPlayers: 4,
      playingTime: 120,
      bggWeight: 3.9,
      categories: ["Strategy", "Adventure"],
      mechanics: ["Engine Building", "Cooperative Game"],
      avgRating: 8.6,
      ratingCount: 58,
    },
  });

  console.log("Seeded games:", wingspan.name);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
