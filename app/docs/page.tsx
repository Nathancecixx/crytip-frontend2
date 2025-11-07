import { promises as fs } from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";

export default async function Docs() {
  const documentationPath = path.join(
    process.cwd(),
    "content",
    "Documentation.md",
  );
  const documentation = await fs.readFile(documentationPath, "utf-8");

  return (
    <article className="prose prose-invert max-w-none">
      <ReactMarkdown>{documentation}</ReactMarkdown>
    </article>
  );
}
