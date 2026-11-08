import assert from "node:assert/strict";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import { parse } from "parse5";
import { remarkReferenceLabels, rehypeReferences } from "../src/lib/markdown-references.mjs";

const processor = await createMarkdownProcessor({
  syntaxHighlight: false,
  remarkPlugins: [remarkReferenceLabels],
  rehypePlugins: [rehypeReferences],
  remarkRehype: { footnoteLabel: "References" },
});

function findAll(node, predicate) {
  return [
    ...(predicate(node) ? [node] : []),
    ...(node.childNodes ?? []).flatMap((child) => findAll(child, predicate)),
  ];
}

const attr = (node, name) => node.attrs?.find((entry) => entry.name === name)?.value;
const text = (node) => node.value ?? (node.childNodes ?? []).map(text).join("");
const has = (name) => (node) => attr(node, name) !== undefined;

for (const heading of ["", "## References", "## 参考文献"]) {
  const { code } = await processor.render(`First[^4][^2], repeated[^4].

${heading}

[^1]: Unused definition.
[^2]: Second source with [a link](https://example.com).
[^4]: Fourth source.
`);
  const document = parse(code);
  const refs = findAll(document, has("data-footnote-ref"));
  assert.deepEqual(refs.map(text), ["4", "2", "4"]);
  assert.equal(new Set(refs.map((node) => attr(node, "id"))).size, 3);
  const items = findAll(document, (node) => node.tagName === "li");
  assert.deepEqual(items.map((node) => attr(node, "value")), ["2", "4"]);
  for (const reference of refs) {
    const target = items.find((item) => `#${attr(item, "id")}` === attr(reference, "href"));
    assert.equal(attr(target, "value"), text(reference));
  }
  const backrefs = findAll(document, has("data-footnote-backref"));
  assert.equal(backrefs.length, 3);
  for (const reference of refs) {
    assert.ok(backrefs.some((node) => attr(node, "href") === `#${attr(reference, "id")}`));
  }
  assert.equal(findAll(document, has("data-reference-return")).length, 1);
  assert.ok(findAll(document, has("disabled")).some(has("data-reference-return")));
  assert.equal(findAll(document, (node) => /^h[2-6]$/.test(node.tagName ?? "") && !attr(node, "class")?.includes("sr-only")).length, 1);
  assert.ok(code.includes('href="https://example.com"'));
}

const { code } = await processor.render("Plain text with `[^4]`.\n\n## References\n\nA manually written bibliography.");
assert.ok(!code.includes("data-reference-return"));
assert.ok(!code.includes("data-footnotes"));
console.log("Reference checks passed: author numbering, definition order, repeated citations, headings and shared return control.");
