export function matchPath(
  template: string,
  actualPath: string,
): { matched: boolean; params: Record<string, string> } {
  const templateParts = template.split("/").filter(Boolean);
  const actualParts = actualPath.split("/").filter(Boolean);

  if (templateParts.length !== actualParts.length) {
    return { matched: false, params: {} };
  }

  const params: Record<string, string> = {};

  for (let index = 0; index < templateParts.length; index += 1) {
    const templatePart = templateParts[index];
    const actualPart = actualParts[index];

    if (templatePart.startsWith(":")) {
      params[templatePart.slice(1)] = decodeURIComponent(actualPart);
      continue;
    }

    if (templatePart !== actualPart) {
      return { matched: false, params: {} };
    }
  }

  return { matched: true, params };
}
