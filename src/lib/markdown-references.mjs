function visit(node, callback) {
  callback(node);
  node.children?.forEach((child) => visit(child, callback));
}

// Carry the author's numeric label across remark-rehype without parsing generated IDs.
export function remarkReferenceLabels() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== "footnoteReference" || !/^\d+$/.test(node.identifier)) return;
      node.data ??= {};
      node.data.hProperties ??= {};
      node.data.hProperties.dataReferenceLabel = node.identifier;
    });
  };
}

export function rehypeReferences() {
  return (tree) => {
    const labels = new Map();
    visit(tree, (node) => {
      if (node.properties?.dataFootnoteRef !== undefined) {
        labels.set(node.properties.href, node.children[0].value);
        return;
      }
      const label = node.properties?.dataReferenceLabel;
      if (label === undefined) return;
      delete node.properties.dataReferenceLabel;
      const link = node.children?.find((child) => child.properties?.dataFootnoteRef !== undefined);
      if (!link) return;
      link.children = [{ type: "text", value: label }];
    });

    visit(tree, (node) => {
      if (node.properties?.dataFootnotes === undefined) return;
      const list = node.children.find((child) => child.tagName === "ol");
      if (!list) return;
      for (const item of list.children) {
        const label = labels.get(`#${item.properties?.id}`);
        if (label !== undefined) item.properties.value = Number(label);
      }
      // Definition order is stable even when citations first appear out of order.
      const items = list.children.filter((child) => child.tagName === "li");
      items.sort((a, b) => a.position.start.offset - b.position.start.offset);
      list.children = items;
      const heading = node.children.find((child) => child.properties?.id === "footnote-label");
      const previous = tree.children.slice(0, tree.children.indexOf(node)).findLast((child) => child.type === "element");
      const hasHeading = /^h[2-6]$/.test(previous?.tagName ?? "");
      if (hasHeading) {
        node.properties.className.push("footnotes--continued");
      } else if (heading) {
        heading.properties.className = [];
      }
      node.children.splice(node.children.indexOf(heading) + 1, 0, {
        type: "element",
        tagName: "button",
        properties: {
          type: "button",
          className: ["reference-return"],
          dataReferenceReturn: true,
          dataPagefindIgnore: true,
          disabled: true,
        },
        children: [{ type: "text", value: "回到上次引用跳转处" }],
      });
    });
  };
}
