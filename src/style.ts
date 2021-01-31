/**
 * The interface for a Style in Licit Editor
 */
export interface Style {
  //
  // Currently the only known / required value.
  //
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
