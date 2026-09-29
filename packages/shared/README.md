## @chordcraft/shared

Shared package to be used in front/back (no heavy dependencies).

### Shared Value Object

from the most to the less important :

- TenantID: For the Tenant (mandatory). Non-blank, 1-255 characters.
- Structure: The main part of a chart — each section mapped to its style variants and their chord sequences. `Structure` is the decoded type (Chord instances); `StructureInput` is the encoded one a client sends (chords as shorthand strings)
  - Section: Section name, simple normalized strings
  - Note: For the root note (A, Bb, C, F#, ...)
  - Chord: Complex strings, composed of several parts; the purpose is to produce a strongly normalized string (simple: "Am", complex: "Am7b5add11").
    - Note: To compose the chord
    - Quality: Quality indicates the type of chord (minor, major, augmented, ...)
    - Extension: completes the chords (tetrade: 6, 7, Maj7, 9, 11, ...)
    - Modifier: Subtil alteration (b5, #11)
    - Addition: Any additional note (add11, add13, ...)

    `Chord.parse` currently reads the root, quality and extension only: modifiers and
    additions carry a `TODO: (v2)` and are dropped. `toString` does render them, so a Chord
    built with them round-trips; one parsed from a string does not.

  - Scale: The relation between each note (degree, chromatics, ...)
