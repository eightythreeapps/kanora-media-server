/**
 * Generate a sort name from a display name by removing common prefixes
 * and converting to lowercase.
 */
export function generateSortName(name: string): string {
  // Convert to lowercase
  let sortName = name.toLowerCase();

  // Remove common prefixes
  const prefixes = ['the ', 'a ', 'an '];
  for (const prefix of prefixes) {
    if (sortName.startsWith(prefix)) {
      sortName = sortName.substring(prefix.length);
      break;
    }
  }

  return sortName;
}
