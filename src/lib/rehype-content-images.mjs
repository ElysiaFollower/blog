export function rehypeContentImages() {
  return (tree) => {
    const visit = (node) => {
      if (node?.type === "element" && node.tagName === "img") {
        node.properties ??= {};
        node.properties.loading ??= "lazy";
        node.properties.decoding ??= "async";
      }

      node?.children?.forEach(visit);
    };

    visit(tree);
  };
}
