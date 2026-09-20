import { NoteCredit, SimpleNote } from './icons/SimpleNote';

import './icons/SimpleNote.css';

export function Loader() {
  // The notes inherit `currentColor`, so the loader follows the theme instead of a fixed hex.
  return (
    <div className="flex max-w-full text-primary">
      <span className="n n1">
        <SimpleNote />
      </span>
      <span className="n n2">
        <SimpleNote />
      </span>
      <span className="n n3">
        <SimpleNote />
      </span>
      <NoteCredit />
    </div>
  );
}
