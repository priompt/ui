import { isLive } from '$lib/server/client';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => ({ live: isLive() });
