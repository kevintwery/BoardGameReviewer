import { GameNightPlanner } from "@/components/planner/GameNightPlanner";

export default function PlannerPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-bold">Game Night Planner</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Tell us who's playing and how much time you have.
      </p>

      <div className="mt-6">
        <GameNightPlanner />
      </div>
    </main>
  );
}
