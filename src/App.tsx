import { Button, Toast, ToastQueue } from "@heroui/react";
import { useEffect } from "react";

type DemoToast = {
  description?: string;
  title: string;
  variant?: "danger" | "default" | "success" | "warning";
};

const searchParams = new URLSearchParams(window.location.search);
const useWorkaround = searchParams.get("workaround") === "1";

const queueOptions = useWorkaround
  ? { maxVisibleToasts: 1, wrapUpdate: (fn: () => void) => fn() }
  : { maxVisibleToasts: 1 };

const messageQueue = new ToastQueue<DemoToast>(queueOptions);
const notificationQueue = new ToastQueue<DemoToast>(queueOptions);

function reloadWithMode(nextUseWorkaround: boolean): void {
  const nextUrl = new URL(window.location.href);

  if (nextUseWorkaround) {
    nextUrl.searchParams.set("workaround", "1");
  } else {
    nextUrl.searchParams.delete("workaround");
  }

  window.location.href = nextUrl.toString();
}

function addReproductionSequence(): number[] {
  const timeouts: number[] = [];
  const sequenceTag = new Date().toLocaleTimeString();

  messageQueue.add({
    description: `Automatic toast after reload at ${sequenceTag}`,
    title: "Load sequence started",
    variant: "default",
  });

  timeouts.push(
    window.setTimeout(() => {
      notificationQueue.add(
        {
          description: "Persistent notification (timeout: 0) from the top-end queue",
          title: "Sticky notification",
          variant: "warning",
        },
        { timeout: 0 },
      );
    }, 120),
  );

  timeouts.push(
    window.setTimeout(() => {
      messageQueue.add({
        description: "Second queue update shortly after mount",
        title: "Mutation success",
        variant: "success",
      });
    }, 260),
  );

  timeouts.push(
    window.setTimeout(() => {
      messageQueue.add({
        description: "Another update hitting the same queue",
        title: "Mutation error",
        variant: "danger",
      });
    }, 420),
  );

  timeouts.push(
    window.setTimeout(() => {
      notificationQueue.add({
        description: "Cross-queue update to mimic a separate notification channel",
        title: "Background event",
        variant: "default",
      });
    }, 620),
  );

  return timeouts;
}

function addBurst(): void {
  for (let index = 0; index < 6; index += 1) {
    window.setTimeout(() => {
      const burstNumber = index + 1;

      messageQueue.add({
        description: `Burst toast ${burstNumber} from the top queue`,
        title: `Burst ${burstNumber}`,
        variant: burstNumber % 2 === 0 ? "success" : "default",
      });

      if (burstNumber % 2 === 1) {
        notificationQueue.add({
          description: `Interleaved notification ${burstNumber}`,
          title: "Notification queue update",
          variant: "warning",
        });
      }
    }, index * 120);
  }
}

function clearAllToasts(): void {
  messageQueue.clear();
  notificationQueue.clear();
}

export default function App() {
  useEffect(() => {
    const timeouts = addReproductionSequence();

    return () => {
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10 text-zinc-50">
      <Toast.Provider placement="top" queue={messageQueue} />
      <Toast.Provider placement="top end" queue={notificationQueue} />

      <section className="rounded-[28px] border border-white/10 bg-black/30 p-6 shadow-2xl shadow-black/30 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">StackBlitz repro</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight">
          HeroUI Toast jank/freezes in Edge with the default ToastQueue update wrapper
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300">
          This sandbox pins <code>@heroui/react@3.0.0-beta.8</code>, uses two{" "}
          <code>Toast.Provider</code> instances, auto-fires a short toast sequence on every page
          load, and keeps one persistent notification alive with <code>timeout: 0</code>.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            React 19.2.4
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            HeroUI beta.8
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
            {useWorkaround ? "Mode: workaround enabled" : "Mode: default wrapUpdate"}
          </span>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Reproduction steps</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-zinc-300">
            <li>Open this sandbox in Microsoft Edge.</li>
            <li>Hard refresh repeatedly with F5 or Ctrl/Cmd + R.</li>
            <li>After a few refreshes, click <strong>Trigger burst</strong> and keep interacting.</li>
            <li>Compare that with the workaround mode, which swaps in <code>wrapUpdate: (fn) =&gt; fn()</code>.</li>
          </ol>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Actions</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary" onPress={() => addReproductionSequence()}>
              Replay load sequence
            </Button>
            <Button variant="secondary" onPress={() => addBurst()}>
              Trigger burst
            </Button>
            <Button variant="secondary" onPress={() => notificationQueue.add(
              {
                description: "Manual sticky notification for another long-lived toast",
                title: "Manual persistent toast",
                variant: "warning",
              },
              { timeout: 0 },
            )}>
              Add sticky toast
            </Button>
            <Button variant="secondary" onPress={() => clearAllToasts()}>
              Clear all
            </Button>
            <Button variant="secondary" onPress={() => reloadWithMode(false)}>
              Reload default mode
            </Button>
            <Button variant="secondary" onPress={() => reloadWithMode(true)}>
              Reload workaround mode
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
