import { execSync } from "child_process";
import fs from "fs";

console.log("🧠 Rendering all Mermaid diagrams in docs/mermaid...");

const folders = fs.readdirSync("docs/mermaid", { withFileTypes: true })
  .filter(dir => dir.isDirectory())
  .map(dir => `docs/mermaid/${dir.name}`);

folders.forEach(folder => {
  const files = fs.readdirSync(folder).filter(f => f.endsWith(".mmd"));
  files.forEach(file => {
    const input = `${folder}/${file}`;
    const output = `${folder}/${file}.png`;
    console.log(`Rendering ${input} → ${output}`);
    execSync(`npx mmdc -i ${input} -o ${output}`);
  });
});

console.log("✅ All diagrams rendered successfully.");

