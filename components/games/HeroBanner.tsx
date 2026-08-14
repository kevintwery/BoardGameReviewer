import Image from "next/image";

interface HeroBannerProps {
  name: string;
  imageUrl: string;
  avgRating: number;
  ratingCount: number;
  minPlayers: number;
  maxPlayers: number;
  playingTime: number;
}

/**
 * Full-width banner at the top of a game's page. Pure presentation —
 * all data comes in as props, fetched by the parent page component.
 */
export function HeroBanner({
  name,
  imageUrl,
  avgRating,
  ratingCount,
  minPlayers,
  maxPlayers,
  playingTime,
}: HeroBannerProps) {
  const playerRange =
    minPlayers === maxPlayers ? `${minPlayers} players` : `${minPlayers}–${maxPlayers} players`;

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-lg sm:h-96">
      <Image
        src={imageUrl}
        alt={name}
        fill
        priority
        className="object-cover"
      />

      {/* Gradient scrim so white text stays readable over any box art. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <h1 className="text-3xl font-bold sm:text-4xl">{name}</h1>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/90">
          <span>
            ★ {avgRating.toFixed(1)} ({ratingCount} {ratingCount === 1 ? "rating" : "ratings"})
          </span>
          <span>{playerRange}</span>
          <span>{playingTime} min</span>
        </div>
      </div>
    </div>
  );
}
