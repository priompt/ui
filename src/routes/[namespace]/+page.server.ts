import type { PageServerLoad } from './$types';
import { mockAcmeFiles, mockBranches } from '$lib/mocks/data';
import { listTree } from '$lib/server/api';
import { isLive, PriomptError } from '$lib/server/client';

export const load: PageServerLoad = async ({ params }) => {
	if (!isLive()) {
		return {
			namespace: params.namespace,
			files: mockAcmeFiles,
			branches: mockBranches,
			branch: 'main',
			latestCommit: mockAcmeFiles[1].lastCommit,
			live: false,
			error: null
		};
	}
	try {
		return {
			namespace: params.namespace,
			files: await listTree(params.namespace, ''),
			branches: [
				{ name: 'main', isDefault: true, isServing: true,
				  lastCommit: { hash: '', message: '', author: '', date: '' } }
			],
			branch: 'main',
			latestCommit: { hash: '', message: '', author: '', date: '' },
			live: true,
			error: null
		};
	} catch (e) {
		const err = e as PriomptError;
		return {
			namespace: params.namespace, files: [], branches: [], branch: 'main',
			latestCommit: { hash: '', message: '', author: '', date: '' },
			live: true, error: `${err.code}: ${err.message}`
		};
	}
};
