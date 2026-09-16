"use client";

import { useOnAirSpeaker } from "@/lib/supabase/realtime";
import { AppBar } from "../_stage/app-bar";
import { useToasts } from "../_stage/use-toasts";
import { LivePoll } from "./live-poll";

interface VoteStageProps {
  currentUserId: string | null;
  audienceCount: number;
}

export function VoteStage({ currentUserId, audienceCount }: VoteStageProps) {
  const { kobanashiId, speaker } = useOnAirSpeaker();
  const [toasts, pushToast] = useToasts();

  return (
    <div className="koba-stage">
      <AppBar onAirSpeaker={speaker} />

      <main className="stage-wrap">
        <div className="vote-grid">
          <LivePoll
            currentUserId={currentUserId}
            audienceCount={audienceCount}
            kobanashiId={kobanashiId}
            pushToast={pushToast}
          />
        </div>
      </main>

      <div className="koba-toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className="koba-toast">
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
