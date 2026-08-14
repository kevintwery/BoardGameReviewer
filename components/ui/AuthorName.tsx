import { DELETED_USER_DISPLAY_NAME } from "@/lib/constants";

export function AuthorName({ name }: { name: string }) {
  if (name === DELETED_USER_DISPLAY_NAME) {
    return <span className="italic text-slate-400 dark:text-slate-500">{name}</span>;
  }
  return <>{name}</>;
}
