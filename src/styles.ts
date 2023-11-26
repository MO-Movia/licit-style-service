import { resolve, join } from 'path';
import { readFile, writeFile } from 'fs/promises';
import type { Style } from './style';
import { logger } from './logger';

/**
 * Name of save file
 */
export const FILENAME = 'styles.json';

/**
 * A case-insensitive store for styles
 */
export class Styles {
  /**
   * Fully qualified path to file where styles are saved to disk.
   * Exposed for testing purposes.
   */
  protected fileName: string;

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
   * Returns number of elements currently available.
   */
  get size(): number {
    return this.styles.size;
  }

  /**
   * Construct the instance.
   * @param dataRoot Root for saving data
   */
  constructor(readonly dataRoot: string) {
    this.fileName = resolve(join(dataRoot, FILENAME));
    this.keys = [];
    this.saved = this.keys;
    this.saver = null;
    this.styles = new Map();
  }

  /**
   * Create error for bad argument.
   *
   * @param name Name of invalid argument.
   * @returns error ready to throw.
   */
  private badArgument(name: string): Error {
    return new Error(`The "${name}" argument is required.`);
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
   * @param styleName Style to remove.
   * @returns true if removed, otherwise false.
   * @throws Error on invalid argument.
   */
  delete(styleName: string): boolean {
    const key = this.key(styleName);
    if (this.styles.delete(key)) {
      this.keys = Array.from(this.styles.keys()).sort(this.sorter);
      return true;
    }
    return false;
  }

  /**
   * Flush contents to disk, if necessary.
   */
  async flush(): Promise<void> {
    clearInterval(this.saver);
    this.saver = null;

    await this.save();
  }

  /**
   * Get existing style by name
   *
   * @param styleName Name of style to get.
   * @returns style instance if found, otherwise undefined.
   * @throws Error if styleName is falsy.
   */
  get(styleName: string): Style | undefined {
    return this.styles.get(this.key(styleName));
  }

  /**
   * Loads saved style entries from disk.
   * Starts change listener.
   * @param dirtyTimer Number of seconds between saves
   */
  async init(dirtyTimer: number): Promise<void> {
    // Start with an empty list
    this.styles.clear();
    try {
      logger.debug(`Reading ${this.fileName}`);
      const json = await readFile(this.fileName, 'utf-8');
      // No need to clear list a second time.
      this.merge(JSON.parse(json), false);
      logger.debug(`Read ${this.styles.size} styles from disk.`);
    } catch (err) {
      logger.warn(`Failed to read "${this.fileName}".\n${err}`);
    } finally {
      this.keys = Array.from(this.styles.keys()).sort(this.sorter);
      // No need to save file that was just read
      this.saved = this.keys;
    }

    // Start save timer
    dirtyTimer = dirtyTimer * 1000;
    if (dirtyTimer) {
      logger.debug(`Setting dirty timer for ${dirtyTimer} ms.`);
      this.saver = setInterval(this.save.bind(this), dirtyTimer);
    } else {
      logger.debug(`Not setting dirty timer.`);
    }
  }

  /**
   *  Convert human readable name into a case insensitive key
   * @param styleName
   * @returns transformed value
   * @throws error if styleName is falsy
   */
  key(styleName: string, argName = 'styleName'): string {
    if (!styleName) {
      throw this.badArgument(argName);
    }
    return styleName.toLowerCase();
  }

  /**
   * Get sorted list of available styles.
   */
  list(): Style[] {
    // Sort styles by key prior to returning
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
    if (!styles.every((style) => style && style.styleName)) {
      throw new Error('One or more styles are invalid.');
    }
    if (replace) {
      this.styles.clear();
    }
    for (const style of styles) {
      const key = this.key(style.styleName);
      this.styles.set(key, style);
    }
    this.keys = Array.from(this.styles.keys()).sort(this.sorter);
  }

  /**
   * Rename existing style.
   *
   * @throws Error on invalid argument.
   * @throws Error if old style does not exist.
   * @throws Error if new style already exists.
   */
  rename(oldName: string, newName: string): string | undefined {
    // Make sure change is real
    // Yea this applies if user calls with null | null or undefined | undefined
    // but I'm willing to let that edge case slide as a noop.
    if (oldName === newName) {
      return;
    }
    const oldKey = this.key(oldName, 'oldName');
    const style = this.styles.get(oldKey);
    if (!style) {
      throw new Error(`The style named "${oldName}" was not found.`);
    }
    const newKey = this.key(newName, 'newName');
    if (this.styles.has(newKey)) {
      throw new Error(`A style named "${newName}" already exists.`);
    }
    // Do the rename
    style.styleName = newName;
    this.styles.set(newKey, style);
    this.styles.delete(oldKey);
    this.keys = Array.from(this.styles.keys()).sort(this.sorter);
    // Return the key for the new name
    return newKey;
  }

  /**
   * Save cached values to disk.
   *
   * @returns Promise resolved on completion.
   */
  protected async save(): Promise<void> {
    const keys = this.keys;
    if (this.saved !== keys) {
      const styles = Array.from(this.styles.values());
      const json = JSON.stringify(styles, null, 2);
      try {
        await writeFile(this.fileName, json, 'utf-8');
        logger.debug(`Wrote ${styles.length} styles to disk.`);
      } catch (err) {
        logger.error(`Failed to write "${this.fileName}".\n${err}`);
      } finally {
        // While not the best approach, assume that current write will never
        // succeed.  Rather than filling the log with error after error, every
        // 30 seconds, Only try again if the collection is changed again.
        this.saved = keys;
      }
    }
  }

  /**
   * Adds or updates a style.
   *
   * @param style Style instance to add or update.
   * @returns key for new (or existing) style.
   * @throws Error on invalid argument.
   */
  set(style: Style): string {
    if (!style) {
      throw this.badArgument('style');
    }
    const key = this.key(style.styleName);
    this.styles.set(key, style);
    this.keys = Array.from(this.styles.keys()).sort(this.sorter);
    return key;
  }

  /**
   * Helper method for sorting style keys
   *
   * @param a First name to sort
   * @param b Second name to sort
   */
  private sorter(a: string, b: string) {
    return a.localeCompare(b);
  }
}
