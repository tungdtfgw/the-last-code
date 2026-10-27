import type { AccountApi, AccountUser, AdminDocKind, ContentTexts } from "../../account/account-api";
import { AdminEditor } from "./admin-editor";
import { AdminList } from "./admin-list";

/** `#/admin` and `#/admin/<kind>/<id>`; shown by the account gate to admins only. */
export function AdminScreen(props: {
  api: AccountApi;
  user: AccountUser;
  doc: { kind: AdminDocKind; id: string } | null;
  go(hash: string): void;
  onTextSaved(docId: string, entry: ContentTexts[string]): void;
  onSessionExpired(): void;
}) {
  const { doc, go } = props;
  if (!doc) {
    return (
      <AdminList
        api={props.api}
        onOpen={(d) => go(`#/admin/${d.kind}/${encodeURIComponent(d.id)}`)}
        onGame={() => go("#/")}
        onSessionExpired={props.onSessionExpired}
      />
    );
  }
  return (
    <AdminEditor
      key={`${doc.kind}:${doc.id}`}
      api={props.api}
      user={props.user}
      kind={doc.kind}
      id={doc.id}
      onBack={() => go("#/admin")}
      onTextSaved={props.onTextSaved}
      onSessionExpired={props.onSessionExpired}
    />
  );
}
