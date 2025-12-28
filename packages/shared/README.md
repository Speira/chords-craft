## @speira/chordschart-shared

Shared package to be used in front/back (no heavy dependencies).

### Shared Value Object

from the most to the less important :

- TenantId: For the Tenant (mandatory).
- SectionRecord: Used to create the main part of a chart, composed of sections and chords
  - Section: Section name, simple normalized strings
  - Chord: Complexe strings, composed in may parts, the purpose is to make a strongly normalized string (simple: "Am", complex: "Am7b5add11").
    - Note: International notation (A,bB,C, C#, ...)
    - Quality: Quality indicates the type of chord (minor, major, augmented, ...)
    - Extension: completes the chords (tetrade: 6, 7, Maj7, 9, 11, ...)
    - Modifier: Subtil alteration (b5, #11)
    - Addition: Any additional note (add11, add13, ...)
  - Scale: The relation between each note (degree, chromatics, ...)
