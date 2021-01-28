import { resolve, join } from 'path';
import { readFile, writeFile } from 'fs/promises';
import type { Style } from './style';
/**
 * A case-insensitive store for styles
 */
export class Styles {
  /**
   * Fully qualified path to file where styles are saved to disk.
   */
  private readonly filename: string;

  /**
   * Sorted list of style keys.
   */
  private keys: string[];

  /**
   * Last saved keys for change tracking.
   */
  private saved: string[];

  /**
   * Running timer.
   */
  private saver: NodeJS.Timeout;

  /**
   * In memory store of all styles.
   */
  private readonly styles: Map<string, Style>;

  /**
   *
   * @param dataRoot
   */
  constructor(readonly dataRoot: string) {
    this.filename = resolve(join(dataRoot, 'styles.json'));
    this.keys = [];
    this.saved = this.keys;
    this.saver = null;
    this.styles = new Map();
  }

  /**
   * Create error for bad argument.
   *
   * @param name Name of invalid argument.
   */
  private badArgument(name): Error {
    return new Error(`The "${name}" argument is required.`);
  }

  /**
   * Create error for missing property.
   * @param parent Parent argument.
   * @param name Name of missing property.
   */
  private badProperty(parent, name): Error {
    return new Error(
      `The "${parent}" argument is missing required property "${name}".`
    );
  }

  /**
   * clear the array of styles
   */
  clear(): void {
    if (this.styles.size) {
      this.styles.clear();
      this.keys = [];
    }
  }

  /**
   * Removes an existing style.
   *
   * @param stylename Style to remove.
   * @returns true if removed, otherwise false.
   * @throws Error on invalid argument.
   */
  delete(stylename: string): boolean {
    if (!stylename) {
      throw this.badArgument('stylename');
    }
    if (this.styles.delete(stylename.toLowerCase())) {
      this.keys = Array.from(this.styles.keys()).sort();
      return true;
    }
    return false;
  }

  /**
   * Get existing style by name
   *
   * @param stylename Name of style to get.
   */
  get(stylename: string): Style | undefined {
    if (!stylename) {
      throw this.badArgument('stylename');
    }
    return this.styles.get(stylename.toLowerCase());
  }

  /**
   * Flush contents to disk, if necessary.
   */
  async flush(): Promise<void> {
    if (this.saver) {
      clearInterval(this.saver);
      this.saver = null;
    }
    await this.save();
  }

  /**
   * Loads saved style entries from disk.
   * Starts change listener.
   */
  async init(): Promise<void> {
    try {
      const json = await readFile(this.filename, 'utf-8');
      this.merge(JSON.parse(json), true);
    } catch (err) {
      console.warn(`Failed to read "${this.filename}".`);
    } finally {
      // No need to save file that was just read
      this.keys = Array.from(this.styles.keys()).sort();
      this.saved = this.keys;
    }

    // Check save twice per minute.
    this.saver = setInterval(this.flush.bind(this), 30000);
  }

  /**
   * Return list of styles.
   */
  list(): Style[] {
    return this.keys.map((key) => this.styles.get(key));
  }

  /**
   *  Merge supplied collection of styles into current.
   *  Styles with same names will be overwritten.
   *  If replace is true, all existing styles will be removed.
   */
  merge(styles: Style[], replace?: boolean): void {
    if (!styles) {
      throw this.badArgument('styles');
    }
    if (!styles.every((style) => style && style.stylename)) {
      throw new Error('One or more styles are invalid.');
    }
    if (replace) {
      this.styles.clear();
    }
    for (const style of styles) {
      this.styles.set(style.stylename.toLowerCase(), style);
    }
    this.keys = Array.from(this.styles.keys()).sort();
  }

  /**
   * Rename existing style.
   *
   * @throws Error on invalid argument.
   * @throws Error if old style does not exist.
   * @throws Error if new style already exists.
   */
  rename(oldName: string, newName: string): void {
    if (!oldName) {
      throw this.badArgument('oldName');
    }
    if (!newName) {
      throw this.badArgument('newName');
    }
    const oldKey = oldName.toLowerCase();
    const style = this.styles.get(oldKey);
    if (!style) {
      throw new Error(`The style named "${oldName}" was not found.`);
    }
    if (this.styles.has(newName)) {
      throw new Error(`A style named "${newName}" already exists.`);
    }
    style.stylename = newName;
    this.styles.set(newName.toLowerCase(), style);
    this.styles.delete(oldKey);
    this.keys = Array.from(this.styles.keys()).sort();
  }

  /**
   * Save cached values to disk.
   */
  private async save(): Promise<void> {
    try {
      const keys = this.keys;
      if (this.saved !== keys) {
        const styles = Array.from(this.styles.values());
        const json = JSON.stringify(styles, null, 2);
        await writeFile(this.filename, json);
        this.saved = keys;
      }
    } catch (err) {
      console.error(`Failed to write "${this.filename}".\n${err}`);
    }
  }

  /**
   * Adds or updates a style.
   *
   * @param style Style instance to add or update.
   * @throws Error on invalid argument.
   */
  set(style: Style): string {
    if (!style) {
      throw this.badArgument('style');
    }
    if (!style.stylename) {
      throw this.badProperty('style', 'stylename');
    }
    const key = style.stylename.toLowerCase();
    this.styles.set(key, style);
    this.keys = Array.from(this.styles.keys()).sort();
    return key;
  }
}
