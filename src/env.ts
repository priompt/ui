/**
 * Environment variables the UI reads, declared for SvelteKit 3.
 *
 * SvelteKit 3 only exposes variables declared here (through `$app/env/private`).
 * All of these are optional: with none set the UI runs on sample data and says
 * so in a banner. Every one is server-only and read when the app starts, so the
 * token never reaches the browser. See .env.example for what each one means.
 */
import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value;

export const variables = defineEnvVars({
	PRIOMPT_URL: { schema: optional },
	PRIOMPT_HOST: { schema: optional },
	PRIOMPT_TOKEN: { schema: optional },
	PRIOMPT_TLS: { schema: optional },
	PRIOMPT_ORG: { schema: optional },
	PRIOMPT_NATS_URL: { schema: optional }
});
