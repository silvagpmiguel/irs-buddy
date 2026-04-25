console.log("\n🔨 Building IRS Buddy...\n");
await Deno.mkdir("./dist", { recursive: true });
await Deno.mkdir("./dist/css", { recursive: true });

// Copy index.html first
console.log("\n📄 Copying index.html...");
await Deno.copyFile("./src/index.html", "./dist/index.html");

// Copy all component and view files (HTML & CSS) that are loaded at runtime
console.log("\n📁 Copying component and view files...");
await copyDirRecursive("./src/components", "./dist/components");
await copyDirRecursive("./src/views", "./dist/views");

// Minify CSS
console.log("\n🎨 Minifying CSS...");
for await (const entry of Deno.readDir("./src/css")) {
  if (entry.isFile && entry.name.endsWith(".css")) {
    await new Deno.Command("deno", {
      args: [
        "bundle",
        "--minify",
        "--platform",
        "browser",
        `./src/css/${entry.name}`,
        "--outdir",
        "./dist/css",
      ],
      stdout: "inherit",
      stderr: "inherit",
    }).output();
  }
}

// Helper function to copy directories recursively
async function copyDirRecursive(src: string, dest: string) {
  await Deno.mkdir(dest, { recursive: true });
  for await (const entry of Deno.readDir(src)) {
    const srcPath = `${src}/${entry.name}`;
    const destPath = `${dest}/${entry.name}`;
    if (entry.isDirectory) {
      await copyDirRecursive(srcPath, destPath);
    } else if (
      entry.isFile &&
      (entry.name.endsWith(".html") || entry.name.endsWith(".css"))
    ) {
      await Deno.copyFile(srcPath, destPath);
    }
  }
}

// Minify HTML & JS
console.log("📄 Minifying HTML...");
// Bundle only the local app.js, not index.html (to keep external CDN scripts)
await new Deno.Command("deno", {
  args: [
    "bundle",
    "--minify",
    "--platform",
    "browser",
    "./src/app.js",
    "--outdir",
    "./dist",
  ],
  stdout: "inherit",
  stderr: "inherit",
}).output();

// Remove the module type since app.js is minified
console.log("📦 Adapting index.html to minified app.js...");
let html = await Deno.readTextFile("./dist/index.html");
html = html
  .replace(/type="module"\s+/, "")
  .replace("crossorigin", "")
  .trim();
await Deno.writeTextFile("./dist/index.html", html);
