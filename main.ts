import { serveDir } from "@std/http-file-server";

const STATIC_FOLDER = Deno.env.get("STATIC_FOLDER") ?? "./src";
const PORT = Deno.env.get("PORT") ?? "4200";
Deno.serve({ port: parseInt(PORT) }, (req: Request) =>
  serveDir(req, {
    fsRoot: STATIC_FOLDER,
    quiet: true,
  }),
);
