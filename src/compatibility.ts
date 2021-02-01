import { Router } from 'express';
import type { Styles } from './styles';
import bodyParser from 'body-parser';

// Maintains compatibility with licit 0.0.16 until requested changes are made.
export default function compatibiity(styles: Styles): Router {
  const route = Router();

  route.use(bodyParser.json());
  route.use(bodyParser.text());

  route.get('/getcustomstyles/', (req, res) => {
    res.json(styles.list());
  });

  route.post('/savecustomstyle/', (req, res) => {
    styles.set(req.body);
    res.json(styles.list());
  });

  route.post('/renamecustomstyle/', (req, res) => {
    const { styleName, newName } = req.body;
    styles.rename(styleName, newName);
    res.json(styles.list());
  });

  route.post('/removecustomstyle/', (req, res) => {
    styles.delete(req.body);
    res.json(styles.list());
  });

  // Helper method to return list into deprecated map format
  function map() {
    return styles.list().reduce((out, style) => {
      out[styles.key(style.styleName)] = style;
      return out;
    }, {});
  }

  route.get('/bulk-export', (req, res) => {
    res.json({ styles: map() });
  });

  route.post('/bulk-import', (req, res) => {
    if (Array.isArray(req.body.styles)) {
      styles.merge(req.body.styles, req.body.replace);
    } else {
      styles.merge(Object.values(req.body.styles), req.body.replace);
    }
    res.json({ styles: map() });
  });

  return route;
}
