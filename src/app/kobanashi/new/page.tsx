import { KobanashiForm } from "../_components/kobanashi-form";
import { LinkButton } from "../_components/link-button";
import { createKobanashi } from "../actions";

export default function NewKobanashiPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">小噺を新規作成</h1>
        <LinkButton href="/kobanashi" variant="outline">
          一覧に戻る
        </LinkButton>
      </div>
      <KobanashiForm action={createKobanashi} />
    </div>
  );
}
