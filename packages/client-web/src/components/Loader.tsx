import { NoteCredit, SimpleNote } from "./icons/SimpleNote";

import "./icons/SimpleNote.css";

export function Loader() {
  const color = "#556e84";
  return (
    <div className="flex max-w-full">
      <span className="n n1">
        <SimpleNote color={color} />
      </span>
      <span className="n n2">
        <SimpleNote color={color} />
      </span>
      <span className="n n3">
        <SimpleNote color={color} />
      </span>
      <NoteCredit />
    </div>
  );
}
