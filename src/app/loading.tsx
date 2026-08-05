import { AppBar } from "./_stage/app-bar";

// ホーム（ステージ）のスケルトン。データ取得を待たずにシェルを先に流す。
// 他のページはレイアウトが違うので、各ルートに専用の loading.tsx を置いている。
export default function Loading() {
  return (
    <div className="koba-stage" aria-busy="true">
      <AppBar />

      <main className="stage-wrap">
        <div className="grid">
          <section className="block-stock">
            <div className="skeleton skeleton-rail" />
          </section>

          <section className="block-stage">
            <div className="skeleton skeleton-hero" />
            <div className="skeleton skeleton-list" />
          </section>

          <section className="block-poll">
            <div className="skeleton skeleton-poll" />
          </section>

          <section className="block-rail">
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
          </section>
        </div>
      </main>
    </div>
  );
}
