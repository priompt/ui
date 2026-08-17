# priompt ui

Web front-end for a [priompt](../priompt/) server. SvelteKit, powered by
[`sv`](https://github.com/sveltejs/cli).

## Connecting to a server

Browsers can't speak gRPC, so the SvelteKit server is the bridge: every live
page loads through `+page.server.ts`, which calls the priompt server over
`@grpc/grpc-js` (`src/lib/server/priompt.ts`). Nothing gRPC ships to the client.

```sh
pnpm install
pnpm sync-proto                    # copy the contract from ../proto

# in ../priompt: go build -o priompt.exe ./cmd/priompt && ./priompt.exe serve -db dev.db
echo "PRIOMPT_ADDR=localhost:8443" > .env
pnpm dev
```

`PRIOMPT_ADDR` defaults to `localhost:8443`; set `PRIOMPT_TOKEN` to send a
bearer token when the server runs with auth on.

Seed a dev server with prompts and history: `sh ../priompt/seed-dev.sh`. Use
`publish`, not `put` — `put` writes content without a commit, so the history and
diff views have nothing to show.

### Wired to the server

`/` · `/[namespace]` · `tree` · `blob` · `commits` · `commit/[hash]` · `edit`
(saving publishes for real, and the commit view shows the server's semantic
verdict).

### Still on mock data

`branches`, `compare`, `search`, `new`, and namespace `settings`. Branches and
history are **per prompt** on the server — every RPC takes a single `uri` — and
there is no `ListBranches` RPC, so the repo-wide branch UI has nothing behind it
yet. `listBranches()` reports `main` only.

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
pnpm dlx sv@0.17.0 create --template minimal --types ts --add tailwindcss="plugins:typography,forms" --install pnpm ui
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
