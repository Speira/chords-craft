import * as fs from 'node:fs';
import * as path from 'node:path';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { print } from 'graphql';

export const CONTEXTS_PATHS = ['../../context-chart', '../../context-user'];

/** Merges the contexts' schemas so each root type (Query, Mutation) is declared once. */
export function mergeSchemas(sources: ReadonlyArray<string>): string {
  return print(mergeTypeDefs([...sources]));
}

export const contextsSchemas = CONTEXTS_PATHS.map((context) => {
  const schemaPath = path.join(__dirname, context, 'src/interface/graphql/schema.graphql');
  if (!fs.existsSync(schemaPath)) return '';
  return fs.readFileSync(schemaPath, 'utf-8');
}).filter(Boolean);

const outPath = path.join(__dirname, '../src/generated/schema.graphql');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, mergeSchemas(contextsSchemas));

console.log(`✅ Merged ${contextsSchemas.length} schemas into ${outPath}`);
