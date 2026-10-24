/** What a button in the question toolbar does to the field it acts on. */
export type RichCommand = 'bold' | 'italic' | 'superscript' | 'subscript' | 'math' | 'picture';

/** Which of the toolbar's formatting buttons are on where the cursor is. */
export type Formats = { bold: boolean; italic: boolean; superscript: boolean; subscript: boolean };

export const noFormats: Formats = { bold: false, italic: false, superscript: false, subscript: false };
