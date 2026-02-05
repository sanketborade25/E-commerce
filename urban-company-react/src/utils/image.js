export const resolveImage = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("/")) {
    return path;
  }
  return `${path}`;
};
