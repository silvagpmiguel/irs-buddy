console.log("\n🔨 Building IRS Buddy...\n");
await Deno.mkdir("./dist", { recursive: true });
await Deno.mkdir("./dist/css", { recursive: true });

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

// Minify HTML & JS
console.log("📄 Minifying HTML...");
await new Deno.Command("deno", {
  args: ["bundle", "./src/index.html", "--outdir", "./dist"],
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
