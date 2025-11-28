import { Data } from "effect";
import { ChartID, Chord, Note, Section } from "./value-objects";

export class Chart extends Data.Class<{
  readonly id: ChartID;
  readonly root: Note.Note;
  readonly author: string;
  readonly title: string;
  readonly sections: Record<Section.Section, Chord[]>;
  readonly plan: Section.Section[];
}> {}
