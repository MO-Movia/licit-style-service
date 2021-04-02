import { Request, Response, Router, json } from 'express';
import type { Styles } from './styles';
import type { Style } from './style';

export default function api(styles: Styles): Router {
  const route = Router();

  // Methods below require json body
  route.use(json());

  // POST /styles
  // REQUEST BODY = (Style instance)
  // {
  //   "styleName": "my-style",
  //   ...
  // }
  //
  // Creates or Replaces a style on the server.
  //
  // STATUS CODE: 201 Accepted
  // HEADERS:
  //    Location: /styles/my-style
  route.post('/', (req: Request<Style>, res: Response) => {
    const key = styles.set(req.body);
    const location = `${req.baseUrl}/${key}`;
    return res.location(location).status(201).json({
      statusCode: 201,
      message: 'Created',
      location,
    });
  });

  // GET /styles
  // REQUEST BODY = none
  //
  // Gets all available styles from the server..
  //
  // STATUS CODE: 200 OK
  // RESPONSE BODY: (array of zero or more Style instances)
  // [
  //    {
  //       "styleName": "my style",
  ///      ...
  ///   },
  //    ...
  // ]
  route.get('/', (req: Request, res: Response<Style[]>) => {
    res.json(styles.list());
  });

  // GET /styles/:styleName
  // REQUEST BODY = none
  //
  // Gets individual style from the server.
  //
  // STATUS CODE: 200 OK
  // RESPONSE BODY = (Style instance)
  // {
  //    "styleName": "styleName",
  //    ...
  // }
  //
  // STATUS CODE: 404 NOT FOUND
  // RESPONSE BODY = none
  route.get('/:styleName', (req, res: Response<Style>, next) => {
    const style = styles.get(req.params.styleName);
    if (style) {
      return res.json(style);
    }
    next();
  });

  // DELETE /styles/:styleName
  // REQUEST BODY = none
  //
  // Deletes an existing style instance from the server.
  //
  // STATUS CODE: 204 No Content
  // RESPONSE BODY = none
  route.delete('/:styleName', (req, res: Response) => {
    // Intentionally not failing if style does not exist.
    // Not Found here is not a failure.
    styles.delete(req.params.styleName);
    return res.sendStatus(204);
  });

  // PATCH /styles/rename
  // REQUEST BODY =
  // {
  //    "oldName": "my style name",
  //    "newName": "my new style name"
  // }
  //
  // STATUS CODE 204 No Content
  // RESPONSE BODY = none
  //
  // STATUS CODE 400 Bad Request
  //   If oldName does not exist.
  //   If newName already exists.
  route.patch(
    '/rename',
    (req: Request<{ oldName: string; newName: string }>, res: Response) => {
      const { oldName, newName } = req.body;
      styles.rename(oldName, newName);
      return res.sendStatus(204);
    }
  );

  // PATCH /styles/import
  // REQUEST BODY =
  // {
  //   "styles": [{ "styleName": "styleName", ...}, ... ],
  //   "replace": true
  // }
  //
  // Imports an array of styles to the server.  Optionally replacing all existing
  // styles.
  //
  // STATUS CODE 204 No Content
  // RESPONSE BODY = none
  //
  // STATUS CODE 400 Bad Request
  //   If styles is null|undefined|falsy, but not an empty []
  //   If any style in styles is null|undefined|falsy
  //   If any style.styleName is null|undefined|falsy
  route.patch(
    '/import',
    (req: Request<{ styles: Style[]; replace?: boolean }>, res: Response) => {
      styles.merge(req.body.styles, req.body.replace);
      return res.sendStatus(204);
    }
  );

  // PATCH /styles/clear
  // REQUEST BODY = none
  //
  // Clears the collection of styles
  //
  // STATUS CODE 204 No Content
  // RESPONSE BODY = none
  route.patch('/clear', (req, res) => {
    styles.clear();
    return res.sendStatus(204);
  });

  // Anything else on this route
  // STATUS CODE 404 Not Fou8nd
  // RESPONSE BODY { statusCode, message }
  route.use((req, res) => {
    res.status(404).json({
      statusCode: 404,
      message: 'Not Found',
    });
  });

  // Any other errors should be reported via JSON.
  // 4 parameters required for express error handler.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  route.use((err, req, res, next) => {
    const statusCode = err.statusCode || 400;
    res.status(statusCode).json({ statusCode, message: err.message });
  });

  return route;
}
