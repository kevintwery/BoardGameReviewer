import { DeleteAccountSection } from "@/components/account/DeleteAccountSection";

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">Account Settings</h1>

      <section className="mt-8 rounded-lg border border-red-200 p-5 dark:border-red-900">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Danger zone</h2>
        <DeleteAccountSection />
      </section>
    </main>
  );
}
