export function getDate(daysAgo: number) {
  const now = new Date();
  return new Date(now.setDate(now.getDate() - daysAgo));
}
