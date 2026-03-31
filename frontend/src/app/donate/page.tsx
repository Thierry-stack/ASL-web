import { DonateForm } from "./donate-form";

export const metadata = {
  title: "Donate | Sign Language LMS",
  description: "Support accessible sign language education via MTN Mobile Money.",
};

export default function DonatePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Donate</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        Contributions help keep sign language education accessible. Test payments use your Flutterwave sandbox keys from{" "}
        <code className="rounded bg-zinc-100 px-1 text-sm dark:bg-zinc-800">backend/.env</code>.
      </p>
      <div className="mt-10">
        <DonateForm />
      </div>
    </div>
  );
}
