import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';
import { unlink } from 'node:fs/promises';

import { Styles } from './styles';
import { Style } from './style';
import { logger } from './logger';

// Mocking the logger module to suppress console output during testing.
jest.mock('./logger');

/**
 * Test harness for Styles
 */
class TestStyles extends Styles {
  // make public for testing save failures.
  public fileName: string;
  // make public for testing save failures.
  public save(): Promise<void> {
    return super.save();
  }
}

describe('Styles', () => {
  const styleName = 'oldName';
  const newName = 'newName';
  let styles: TestStyles;
  let style: Style;

  beforeEach(() => {});

  beforeEach(async () => {
    // Create a new style instance and add a single item
    style = { styleName };
    styles = new TestStyles(tmpdir());
    styles.set(style);
  });

  it('should construct', () => {
    expect(styles).toBeTruthy();
  });

  describe('clear', () => {
    describe('when styles exist', () => {
      it('should erase existing styles', () => {
        styles.clear();

        expect(styles.list()).toEqual([]);
      });
    });

    describe('when no styles exist', () => {
      it('should not error', () => {
        expect(() => new Styles(tmpdir()).clear()).not.toThrow();
      });
    });
  });

  describe('delete', () => {
    describe('when style exists', () => {
      it('should delete the style', () => {
        const out = styles.delete(styleName);

        expect(out).toBeTruthy();
      });
    });

    describe('when style does not exist', () => {
      it('should return falsy', () => {
        const out = styles.delete(newName);

        expect(out).toBeFalsy();
      });
    });
  });

  describe('flush', () => {
    beforeEach(() => {
      jest.spyOn(logger, 'error');
      jest.spyOn(styles, 'save');
    });

    describe('when save succeeds', () => {
      it('should create the file', async () => {
        await styles.flush();

        expect(styles.save).toHaveBeenCalled();
        expect(existsSync(styles.fileName)).toBeTruthy();
        expect(logger.error).not.toHaveBeenCalled();
      });
    });

    describe('if save fails', () => {
      // Testing the underlying behavior o
      it('should log the failure', async () => {
        // hack the style into an invalid state
        styles.fileName = null;

        await styles.flush();

        expect(styles.save).toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalled();
      });
    });
  });

  describe('get', () => {
    describe('when called with a falsy value', () => {
      it('should throw an error', () => {
        expect(() => styles.get(null)).toThrow(/styleName/);
      });
    });

    describe('when called with a style that does not exist', () => {
      it('should return undefined', () => {
        expect(styles.get(newName)).toBeUndefined();
      });
    });

    describe('when called with a style that exists', () => {
      it('should return that style', () => {
        expect(styles.get(styleName)).toBe(style);
      });
    });
  });

  describe('init', () => {
    // Make sure that timeout started by init is stopped.
    afterEach(async () => await styles.flush());

    describe('when file does not exist', () => {
      it('should init styles to empty list', async () => {
        // Make sure file does not exist.
        await unlink(styles.fileName).catch(() => 1);

        await styles.init(0);

        expect(styles.list()).toEqual([]);
      });
    });

    describe('when file exists', () => {
      it('should load contents', async () => {
        // Flush will write the current style to disk
        const before = styles.list();
        await styles.flush();
        styles.clear();

        await styles.init(60);

        const after = styles.list();

        // Arrays should have same elements in same order.
        // But not have same instances, since reading file would
        // generate new objects.
        expect(after).toEqual(before);
        expect(after[0]).not.toEqual(before[1]);
      });
    });
  });

  describe('list', () => {
    it('should return sorted list of styles', () => {
      // Append two styles with distinct sort characteristics.
      const z = { styleName: 'z' };
      const a = { styleName: 'a' };
      styles.merge([z, a], true);

      const out = styles.list();

      expect(out).toEqual([a, z]);
    });
  });

  describe('merge', () => {
    const z = { styleName: 'z' };

    describe('when styles is falsy', () => {
      it('should throw an error', () => {
        expect(() => styles.merge(null, true)).toThrow(/styles/i);
        // Also verify that collection was not cleared prematurely.
        expect(styles.list()).toEqual([style]);
      });
    });

    describe('when styles contains invalid values', () => {
      it('should throw an error', () => {
        expect(() => styles.merge([null], true)).toThrow(/styles/i);
        expect(() => styles.merge([{ styleName: null }], false)).toThrow(
          /invalid/i,
        );
        // Also verify that collection was not cleared prematurely
        expect(styles.list()).toEqual([style]);
      });
    });

    describe('when replace is truthy', () => {
      it('should overwrite existing styles', () => {
        styles.merge([z], true);

        expect(styles.list()).toEqual([z]);
      });
    });

    describe('when replace is falsy', () => {
      it('should retain existing styles', () => {
        styles.merge([z], false);

        expect(styles.list()).toEqual([style, z]);
      });
    });
  });

  describe('rename', () => {
    const styleName = 'oldName';
    const newName = 'newName';
    let style: Style;

    beforeEach(() => {
      // Make sure there's something to rename
      style = { styleName };
      styles.set(style);
    });

    describe('when called with invalid oldName', () => {
      it('should throw error', () => {
        expect(() => styles.rename(null, newName)).toThrow(/oldName/);
      });
    });

    describe('when called with an invalid newName', () => {
      it('should throw error', () => {
        expect(() => styles.rename(styleName, null)).toThrow(/newName/);
        // Verify that current name was not changed.
        expect(style.styleName).toBe(styleName);
      });
    });

    describe('when called with same names', () => {
      it('should return undefined', () => {
        expect(styles.rename(styleName, styleName)).toBeUndefined();
      });
    });

    describe('when called with an oldStyle that does not exist', () => {
      it('should throw error', () => {
        expect(() => styles.rename(newName, 'otherName')).toThrow(/not found/i);
      });
    });

    describe('when called with a newStyle that exists', () => {
      it('should throw error', () => {
        styles.set({ styleName: newName });
        expect(() => styles.rename(styleName, newName)).toThrow(
          /already exists/i,
        );
        // verify that name was not changed
        expect(style.styleName).toBe(styleName);
      });
    });

    describe('when called with valid parameters', () => {
      it('should rename the style', () => {
        const out = styles.rename(styleName, newName);

        expect(out).toBeTruthy();
        expect(style.styleName).toBe(newName);
        // Verify that style cannot be retrieved using the old name.
        expect(styles.get(styleName)).toBeUndefined();
      });
    });
  });

  describe('set', () => {
    describe('when called with a falsy value', () => {
      it('should throw an error', () => {
        expect(() => styles.set(null)).toThrow(/style/i);
      });
    });

    describe('when called with an invalid style', () => {
      it('should throw an error', () => {
        expect(() => styles.set({ styleName: null })).toThrow(/styleName/i);
      });
    });

    describe('when called with a valid style', () => {
      it('should store the style', () => {
        expect(styles.get(styleName)).toBe(style);
      });
    });
  });

  describe('size', () => {
    it('should return number of elements in map', () => {
      expect(styles.size).toBe(1);
    });
  });
});
