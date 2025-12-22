import * as fs from "fs";
import * as path from "path";

const CONTEXTS = [
  "../../contexts/chart",
  // "../../contexts/user",
];

const schemas = CONTEXTS.map((context) => {
  const schemaPath = path.join(
    __dirname,
    context,
    "src/interface/graphql/schema.graphql",
  );
  if (!fs.existsSync(schemaPath)) return "";
  return fs.readFileSync(schemaPath, "utf-8");
}).filter(Boolean);

const mergedSchema = schemas.join("\n\n");
const outPath = path.join(__dirname, "../lib/graphql/merged-schema.graphql");

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, mergedSchema);

console.log(`✅ Merged ${schemas.length} schemas into ${outPath}`);
