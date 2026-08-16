// Domain types for Priompt UI

export interface Namespace {
	id: string;
	name: string;
	org: string;
	visibility: 'public' | 'private';
	promptCount: number;
	updatedAt: string;
	defaultBranch: string;
	servingBranch: string;
	description?: string;
	avatarUrl?: string;
}

export interface PromptFile {
	name: string;
	path: string;
	type: 'file' | 'folder';
	promptCount?: number;
	lastCommit: CommitSummary;
	updatedAt: string;
}

export interface CommitSummary {
	hash: string;
	message: string;
	author: string;
	authorAvatar?: string;
	date: string;
}

export interface Commit extends CommitSummary {
	diff?: string;
	semanticVerdict?: string;
	files: string[];
}

export interface Branch {
	name: string;
	isDefault: boolean;
	isServing: boolean;
	lastCommit: CommitSummary;
}

export interface PromptContent {
	path: string;
	branch: string;
	content: string;
	slots: string[];
	lastCommit: CommitSummary;
}

export interface ChangelogEntry {
	id: string;
	title: string;
	date: string;
	relativeTime: string;
	url?: string;
}

export interface RecentItem {
	org: string;
	name: string;
	path: string;
	icon?: string;
}
