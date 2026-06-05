// Initial left gutter for root-level items
export const BASE_PADDING = 12;

// Indentation added for each nesting level
export const LEVEL_PADDING = 16;

// Files have no disclosure chevron, so shift them
// to align with folder labels when collapsed.
export const FILE_CHEVRON_OFFSET = 16;

export const getItemPadding = (level: number, isFile: boolean) => {
  return (
    BASE_PADDING + level * LEVEL_PADDING + (isFile ? FILE_CHEVRON_OFFSET : 0)
  );
};
