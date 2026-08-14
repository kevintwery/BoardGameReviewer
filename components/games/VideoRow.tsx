interface VideoRowProps {
  videos: Array<{
    id: string;
    youtubeVideoId: string;
    title: string;
  }>;
}

/**
 * Horizontally-scrolling row of "how to play" videos. Renders nothing if
 * a game has no curated videos yet, rather than showing an empty section.
 */
export function VideoRow({ videos }: VideoRowProps) {
  if (videos.length === 0) return null;

  return (
    <section aria-label="How to play videos" className="mt-8">
      <h2 className="text-xl font-semibold">How to Play</h2>

      <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
        {videos.map((video) => (
          <div key={video.id} className="w-72 flex-shrink-0">
            <div className="aspect-video overflow-hidden rounded-lg">
              <iframe
                src={`https://www.youtube.com/embed/${video.youtubeVideoId}`}
                title={video.title}
                allowFullScreen
                className="h-full w-full"
              />
            </div>
            <p className="mt-1 text-sm font-medium">{video.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
