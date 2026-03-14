import { Button, Toast, ToastQueue } from "@heroui/react";

type DemoToast = {
  description?: string;
  title: string;
  variant?: "danger" | "default" | "success" | "warning";
};

const searchParams = new URLSearchParams(window.location.search);
const useWorkaround = searchParams.get("workaround") === "1";

function createQueueOptions(maxVisibleToasts: number) {
  return useWorkaround
    ? { maxVisibleToasts, wrapUpdate: (fn: () => void) => fn() }
    : { maxVisibleToasts };
}

const topQueue = new ToastQueue<DemoToast>(createQueueOptions(3));
const topEndQueue = new ToastQueue<DemoToast>(createQueueOptions(5));

let sequenceCount = 0;

function switchMode(nextUseWorkaround: boolean): void {
  const nextUrl = new URL(window.location.href);

  if (nextUseWorkaround) {
    nextUrl.searchParams.set("workaround", "1");
  } else {
    nextUrl.searchParams.delete("workaround");
  }

  window.location.href = nextUrl.toString();
}

function addBurst(tag: string): void {
  topQueue.add({
    description: `Top queue toast A at ${tag}`,
    title: "Mutation success",
    variant: "success",
  });

  topQueue.add({
    description: `Top queue toast B at ${tag}`,
    title: "Cache invalidated",
    variant: "default",
  });

  topEndQueue.add({
    description: `Top-end queue toast A at ${tag}`,
    title: "Background event",
    variant: "default",
  });

  topEndQueue.add(
    {
      description: `Persistent toast in the top-end queue at ${tag}`,
      title: "Sticky notification",
      variant: "warning",
    },
    { timeout: 0 },
  );
}

function replayLoadSequence(): void {
  sequenceCount += 1;
  const tag = `run ${sequenceCount}`;

  addBurst(tag);

  window.setTimeout(() => {
    topQueue.add({
      description: `Follow-up toast after ${tag}`,
      title: "Mutation error",
      variant: "danger",
    });
  }, 120);

  window.setTimeout(() => {
    addBurst(`${tag} replay`);
  }, 260);
}

export default function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-12 text-zinc-50">
      <Toast.Provider placement="top" queue={topQueue} />
      <Toast.Provider placement="top end" queue={topEndQueue} />

      <section className="w-full rounded-[24px] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-400">
          HeroUI toast repro
        </p>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          Edge jank in default ToastQueue mode
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-300">
          On Win11 + Edge, repeatedly click <code>Replay load sequence</code>. The jank
          reproduces in <code>default mode</code> and does not reproduce in{" "}
          <code>workaround mode</code>.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-zinc-200">
            {useWorkaround ? "workaround mode" : "default mode"}
          </span>

          <Button variant="secondary" onPress={replayLoadSequence}>
            Replay load sequence
          </Button>

          <Button variant="secondary" onPress={() => switchMode(!useWorkaround)}>
            {useWorkaround ? "Switch to default mode" : "Switch to workaround mode"}
          </Button>
        </div>
      </section>
    </main>
  );
}
