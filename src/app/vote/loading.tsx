import { AppBar } from "../_stage/app-bar";

// 投票ページは1カラムなので、投票カード1枚分の骨組みだけ先に流す
export default function Loading() {
  return (
    <div className="koba-stage" aria-busy="true">
      <AppBar />

      <main className="stage-wrap">
        <div className="vote-grid">
          <section className="block-poll">
            <div className="skeleton skeleton-poll" />
          </section>
        </div>
      </main>
    </div>
  );
}
