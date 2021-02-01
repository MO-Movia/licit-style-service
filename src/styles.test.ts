import { tmpdir } from 'os';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';

import { expect } from 'chai';
import { SinonSpy, SinonStub, spy, stub } from 'sinon';

import { Styles } from './styles';
import { Style } from './style';
import { logger } from './logger';

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

  beforeEach(async () => {
    // Create a new style instance and add a single item
    style = { styleName };
    styles = new TestStyles(tmpdir());
    styles.set(style);
  });

  it('should construct', () => {
    expect(styles).to.exist;
  });

  describe('clear', () => {
    describe('when styles exist', () => {
      it('should erase existing styles', () => {
        styles.clear();

        expect(styles.list()).to.eql([]);
      });
    });

    describe('when no styles exist', () => {
      it('should not error', () => {
        expect(() => new Styles(tmpdir()).clear()).not.to.throw();
      });
    });
  });

  describe('delete', () => {
    describe('when style exists', () => {
      it('should delete the style', () => {
        const out = styles.delete(styleName);

        expect(out).to.be.true;
      });
    });

    describe('when style does not exist', () => {
      it('should return falsy', () => {
        const out = styles.delete(newName);

        expect(out).to.be.false;
      });
    });
  });

  describe('flush', () => {
    let error: SinonStub;
    let save: SinonSpy;

    beforeEach(() => {
      error = stub(logger, 'error');
      save = spy(styles, 'save');
    });

    afterEach(() => {
      error.restore();
      save.restore();
    });

    describe('when save succeeds', () => {
      it('should create the file', async () => {
        await styles.flush();

        expect(save.called).to.be.true;
        expect(existsSync(styles.fileName)).to.be.true;
        expect(error.called).to.be.false;
      });
    });

    describe('if save fails', () => {
      // Testing the underlying behavior o
      it('should log the failure', async () => {
        // hack the style into an invalid state
        styles.fileName = null;

        await styles.flush();

        expect(save.called).to.be.true;
        expect(error.called).to.be.true;
      });
    });
  });

  describe('get', () => {
    describe('when called with a falsy value', () => {
      it('should throw an error', () => {
        expect(() => styles.get(null)).to.throw(/styleName/);
      });
    });

    describe('when called with a style that does not exist', () => {
      it('should return undefined', () => {
        expect(styles.get(newName)).to.be.undefined;
      });
    });

    describe('when called with a style that exists', () => {
      it('should return that style', () => {
        expect(styles.get(styleName)).to.equal(style);
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

        expect(styles.list()).to.eql([]);
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
        // But not have same instances, since readinf file would
        // generate new objects.
        expect(after).to.eql(before);
        expect(after[0]).to.not.equal(before[1]);
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

      expect(out).to.eql([a, z]);
    });
  });

  describe('merge', () => {
    const z = { styleName: 'z' };

    describe('when styles is falsy', () => {
      it('should throw an error', () => {
        expect(() => styles.merge(null, true)).to.throw(/styles/i);
        // Also verify that collection was not cleared prematurely.
        expect(styles.list()).to.eql([style]);
      });
    });

    describe('when styles contains invalid values', () => {
      it('should throw an error', () => {
        expect(() => styles.merge([null], true)).to.throw(/styles/i);
        expect(() => styles.merge([{ styleName: null }], false)).to.throw(
          /invalid/i
        );
        // Also verify that collection was not cleared prematurely
        expect(styles.list()).to.eql([style]);
      });
    });

    describe('when replace is truthy', () => {
      it('should overwrite existing styles', () => {
        styles.merge([z], true);

        expect(styles.list()).to.eq;
        [z];
      });
    });

    describe('when replace is falsy', () => {
      it('should retain existing styles', () => {
        styles.merge([z], false);

        expect(styles.list()).to.eql([style, z]);
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
        expect(() => styles.rename(null, newName)).to.throw(/oldName/);
      });
    });

    describe('when called with an invalid newName', () => {
      it('should throw error', () => {
        expect(() => styles.rename(styleName, null)).to.throw(/newName/);
        // Verify that current name was not changed.
        expect(style.styleName).to.equal(styleName);
      });
    });

    describe('when called with same names', () => {
      it('should return undefined', () => {
        expect(styles.rename(styleName, styleName)).to.be.undefined;
      });
    });

    describe('when called with an oldStyle that does not exist', () => {
      it('should throw error', () => {
        expect(() => styles.rename(newName, 'otherName')).to.throw(
          /not found/i
        );
      });
    });

    describe('when called with a newStyle that exists', () => {
      it('should throw error', () => {
        styles.set({ styleName: newName });
        expect(() => styles.rename(styleName, newName)).to.throw(
          /already exists/i
        );
        // verify that name was not changed
        expect(style.styleName).to.equal(styleName);
      });
    });

    describe('when called with valid parameters', () => {
      it('should rename the style', () => {
        const out = styles.rename(styleName, newName);

        expect(out).to.exist;
        expect(style.styleName).to.equal(newName);
        // Verify that style cannot be retrieved using the old name.
        expect(styles.get(styleName)).to.be.undefined;
      });
    });
  });

  describe('set', () => {
    describe('when called with a falsy value', () => {
      it('should throw an error', () => {
        expect(() => styles.set(null)).to.throw(/style/i);
      });
    });

    describe('when called with an invalid style', () => {
      it('should throw an error', () => {
        expect(() => styles.set({ styleName: null })).to.throw(/styleName/i);
      });
    });

    describe('when called with a valid style', () => {
      it('should store the style', () => {
        expect(styles.get(styleName)).to.equal(style);
      });
    });
  });
});
