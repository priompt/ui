import type { Namespace, PromptFile, Branch, ChangelogEntry, RecentItem } from '$lib/types';

export const mockNamespaces: Namespace[] = [
	{
		id: '1',
		name: 'uval.ai',
		org: 'starthackHQ',
		visibility: 'private',
		promptCount: 24,
		updatedAt: '12 minutes ago',
		defaultBranch: 'main',
		servingBranch: 'main',
		avatarUrl: undefined
	},
	{
		id: '2',
		name: 'Evalyn',
		org: 'starthackHQ',
		visibility: 'private',
		promptCount: 12,
		updatedAt: '2 hours ago',
		defaultBranch: 'main',
		servingBranch: 'main',
		avatarUrl: undefined
	},
	{
		id: '3',
		name: 'core',
		org: 'starthackHQ',
		visibility: 'private',
		promptCount: 8,
		updatedAt: 'yesterday',
		defaultBranch: 'main',
		servingBranch: 'main',
		avatarUrl: undefined
	},
	{
		id: '4',
		name: 'Contextinator',
		org: 'starthackHQ',
		visibility: 'private',
		promptCount: 5,
		updatedAt: '3 days ago',
		defaultBranch: 'main',
		servingBranch: 'main',
		avatarUrl: undefined
	},
	{
		id: '5',
		name: 'qwendean-training',
		org: 'iamDyeus',
		visibility: 'public',
		promptCount: 16,
		updatedAt: '1 week ago',
		defaultBranch: 'main',
		servingBranch: 'main',
		avatarUrl: undefined
	},
	{
		id: '6',
		name: 'dolshyne-shopify',
		org: 'iamDyeus',
		visibility: 'public',
		promptCount: 4,
		updatedAt: '2 weeks ago',
		defaultBranch: 'main',
		servingBranch: 'main',
		avatarUrl: undefined
	},
	{
		id: '7',
		name: 'qwendean',
		org: 'iamDyeus',
		visibility: 'public',
		promptCount: 9,
		updatedAt: '3 weeks ago',
		defaultBranch: 'main',
		servingBranch: 'main',
		avatarUrl: undefined
	}
];

export const mockRecentItems: RecentItem[] = [
	{ org: 'starthackHQ', name: 'uval.ai', path: '/starthackHQ/uval.ai' },
	{ org: 'starthackHQ', name: 'Evalyn', path: '/starthackHQ/Evalyn' },
	{ org: 'starthackHQ', name: 'core', path: '/starthackHQ/core' },
	{ org: 'starthackHQ', name: 'Contextinator', path: '/starthackHQ/Contextinator' },
	{ org: 'iamDyeus', name: 'qwendean-training', path: '/iamDyeus/qwendean-training' },
	{ org: 'iamDyeus', name: 'dolshyne-shopify', path: '/iamDyeus/dolshyne-shopify' },
	{ org: 'iamDyeus', name: 'qwendean', path: '/iamDyeus/qwendean' }
];

export const mockChangelog: ChangelogEntry[] = [
	{
		id: '1',
		title: 'Multiple redirect URIs and token refresh for OAuth apps',
		date: '2026-08-15',
		relativeTime: '19 hours ago'
	},
	{
		id: '2',
		title: 'Grok 4.6 is now available in GitHub Copilot',
		date: '2026-08-14',
		relativeTime: 'Yesterday'
	},
	{
		id: '3',
		title: 'GitHub Copilot weekly releases — August 10',
		date: '2026-08-13',
		relativeTime: '2 days ago'
	},
	{
		id: '4',
		title: 'License data quality improvements',
		date: '2026-08-13',
		relativeTime: '2 days ago'
	}
];

export const mockAcmeFiles: PromptFile[] = [
	{
		name: 'onboarding',
		path: 'onboarding',
		type: 'folder',
		promptCount: 3,
		lastCommit: {
			hash: '8c21f4a',
			message: 'add followup re-engagement prompt',
			author: 'Arsh',
			date: '2026-08-16T00:00:00Z'
		},
		updatedAt: '2 hours ago'
	},
	{
		name: 'support',
		path: 'support',
		type: 'folder',
		promptCount: 5,
		lastCommit: {
			hash: '8c21f4a',
			message: 'tighten refund handling',
			author: 'Arsh',
			date: '2026-08-16T01:30:00Z'
		},
		updatedAt: '12 minutes ago'
	},
	{
		name: 'sales',
		path: 'sales',
		type: 'folder',
		promptCount: 2,
		lastCommit: {
			hash: 'a91b2e7',
			message: 'update qualification criteria',
			author: 'Arsh',
			date: '2026-08-15T20:00:00Z'
		},
		updatedAt: '5 hours ago'
	},
	{
		name: 'product',
		path: 'product',
		type: 'folder',
		promptCount: 1,
		lastCommit: {
			hash: 'f7d3a91',
			message: 'improve product summary',
			author: 'Arsh',
			date: '2026-08-15T00:00:00Z'
		},
		updatedAt: 'yesterday'
	},
	{
		name: 'shared',
		path: 'shared',
		type: 'folder',
		promptCount: 4,
		lastCommit: {
			hash: '3b7d9c2',
			message: 'add tone guidelines',
			author: 'Arsh',
			date: '2026-08-14T00:00:00Z'
		},
		updatedAt: '2 days ago'
	},
	{
		name: 'README.md',
		path: 'README.md',
		type: 'file',
		lastCommit: {
			hash: '1a2b3c4',
			message: 'initial commit',
			author: 'Arsh',
			date: '2026-08-09T00:00:00Z'
		},
		updatedAt: '1 week ago'
	}
];

export const mockBranches: Branch[] = [
	{
		name: 'main',
		isDefault: true,
		isServing: true,
		lastCommit: {
			hash: '8c21f4a',
			message: 'tighten refund handling',
			author: 'Arsh',
			date: '2026-08-16T01:30:00Z'
		}
	},
	{
		name: 'dev',
		isDefault: false,
		isServing: false,
		lastCommit: {
			hash: 'e4f5a6b',
			message: 'experiment with new tone',
			author: 'Arsh',
			date: '2026-08-15T18:00:00Z'
		}
	},
	{
		name: 'staging',
		isDefault: false,
		isServing: false,
		lastCommit: {
			hash: 'c7d8e9f',
			message: 'prepare release candidate',
			author: 'Arsh',
			date: '2026-08-14T12:00:00Z'
		}
	}
];
