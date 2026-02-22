## Dev guide

### Exports

For exporting functionality from individual folders, we follow these rules:

1. If a folder is not a logical module, for example /helpers, where files are not related by business logic, we do not add an index.ts file to the folder.
2. If a folder is a logical module, for example /users, where functions are related to user functionality, we add an index.ts file to the folder and export all necessary functionality only through index.ts.

The following patterns are not allowed:

```
export * from "..."
export default from "..."
export deafult Something = ...
```

### Add new router

To add a new router, follow these steps:
1. Create a new folder in the routers directory with a name corresponding to the route.
2. Inside this folder, create a router.ts file where all route handlers for this path are added.
Example using health:

```
import { Router, Request, Response } from "express";

export const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.send("Server is alive");
});
```

3. In the same folder, create an index.ts file where you export all necessary functionality (the router itself, types, and anything else that might be needed).

example with health

```
export { router as healthRouter } from "./router";
```

4. In app.ts, import and register the new router.

```
import { healthRouter } from "./routers/health";
...
app.use("/health", healthRouter);
```
