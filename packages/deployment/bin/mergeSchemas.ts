import * as fs from "fs";
import * as path from "path";

export const CONTEXTS_PATHS = [
  "../../context-chart",
  // "../../contexts/user",
];

export const contextsSchemas = CONTEXTS_PATHS.map((context) => {
  const schemaPath = path.join(
    __dirname,
    context,
    "src/interface/graphql/schema.graphql",
  );
  if (!fs.existsSync(schemaPath)) return "";
  return fs.readFileSync(schemaPath, "utf-8");
}).filter(Boolean);

const mergedSchema = contextsSchemas.join("\n\n");
const outPath = path.join(__dirname, "../src/generated/schema.graphql");

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, mergedSchema);

console.log(`✅ Merged ${contextsSchemas.length} schemas into ${outPath}`);
