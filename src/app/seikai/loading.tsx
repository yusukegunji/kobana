import { AppBar } from "../_stage/app-bar";

// それ正解は 2 カラム（お題パネル + スコアボード）なのでホームとは別の骨組みにする
export default function Loading() {
  return (
    <div className="koba-stage" aria-busy="true">
      <AppBar />

      <main className="stage-wrap">
        <div className="seikai-grid">
          <section className="seikai-main">
            <div className="skeleton skeleton-seikai-main" />
          </section>
          <aside className="seikai-side">
            <div className="skeleton skeleton-seikai-side" />
          </aside>
        </div>
      </main>
    </div>
  );
}
