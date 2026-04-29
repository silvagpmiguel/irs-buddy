# Your Friendly Irs Buddy Webapp 
Friendly IRS website designed to facilitate the life of Portuguese investors that rely on one or more brokers and are struggling to fill the Modelo3 from IRS. The purpose of this project is to be Free and Open Source so that people can contribute, copy, modify or do whatever they need, as long as it respects those.

## Contribute
Feel free to contribute with all kind of suggestions via issues, pull requests or to contact me for any other matters.

## Architecture
This project is implemented with plain HTML, CSS, Javascript. The source code is located inside the `src/` folder and its structure is organized by: UI components in the `components/` folder, the views of the webapp in the `views/` folder, the global css in the `css/` folder and the remaining javascript in the `js/` folder. Everything is loaded in the `index.html` that relies on the `app.js` to bootstrap the application. This project doesn't rely on modern libraries/frameworks in order to simplify the dependency management and thus the project's maintenance as well.

## Development
This project uses [Deno](https://deno.com/) to:
- serve the webapp on a specific port (defaults to `http://localhost:4200`)
- build a minified webapp into `dist/` folder.

Deno Tasks:
- Run development server: `deno task dev`
- Build webapp: `denot task build` 
- Format: `deno task fmt`
- Lint: `deno task lint`
