/**
 * The interface for a Style in Licit Editor
 */
export interface Style {
  /**
   * Name of the style. Case insensitive value must be unique.
   */
  styleName: string;

  mode?: number;

  description?: string;

  styles?: {
    align?: string;

    boldNumbering?: boolean;

    boldPartial?: boolean;

    boldSentence?: boolean;

    fontName?: string;

    fontSize?: string;

    hasNumbering?: boolean;

    indent?: string;

    paragraphSpacingAfter?: string;

    paragraphSpacingBefore?: string;

    strong?: string;

    styleLevel?: string;
  };
}
