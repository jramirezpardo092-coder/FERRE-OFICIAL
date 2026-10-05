/** The unfiltered catalog offers category shortcuts. Once a category is selected,
 * its active chip and the full category filter already provide context, changing
 * and clearing; avoid a second navigation row above the product results. */
export function shouldShowCategoryShortcuts(items: readonly { name: string }[], activeCategory: string): boolean {
  return items.length > 0 && !activeCategory;
}
