import { PostPageClient } from "@/components/forum/PostPageClient";

interface PostPageProps {
  params: { postId: string };
}

export default function PostPage({ params }: PostPageProps) {
  return <PostPageClient postId={params.postId} />;
}
