/**
 * Commit-msg hook: enforce Conventional Commits without extra dependencies.
 *
 * @example
 *   feat(context-chart): add chart projection
 *   fix: stop orphaning section headers
 */
import { readFileSync } from 'node:fs';

const TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'perf',
  'test',
  'build',
  'ci',
  'chore',
  'revert',
];
const CONVENTIONAL_PATTERN = new RegExp(String.raw`^(${TYPES.join('|')})(\([\w./-]+\))?!?: \S.*`);
/** Messages written by git itself (merges, reverts, fixup/squash for autosquash). */
const GIT_GENERATED_PATTERN = /^(Merge |Revert "|fixup! |squash! |amend! )/;

const messageFile = process.argv[2];

if (messageFile === undefined) {
  console.error('Usage: node scripts/checkCommitMessage.ts <commit-msg-file>');
  process.exit(1);
}

const header = readFileSync(messageFile, 'utf8').split('\n')[0]?.trim() ?? '';
const isValid = CONVENTIONAL_PATTERN.test(header) || GIT_GENERATED_PATTERN.test(header);

if (!isValid) {
  console.error(
    [
      `✖ Invalid commit message: "${header}"`,
      '  Expected: <type>(<optional scope>): <summary>',
      `  Types: ${TYPES.join(', ')}`,
      '  Example: feat(context-chart): add chart projection',
    ].join('\n'),
  );
  process.exit(1);
}
