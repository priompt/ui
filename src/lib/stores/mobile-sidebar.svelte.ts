/**
 * Shared reactive state for sidebar visibility.
 * Controls both mobile overlay and desktop inset sidebar.
 */
export const sidebar = $state({
	mobileOpen: false,
	desktopOpen: true
});

export function toggleSidebar() {
	// On mobile (<768px), toggle overlay
	// On desktop, toggle inset
	if (typeof window !== 'undefined' && window.innerWidth < 768) {
		sidebar.mobileOpen = !sidebar.mobileOpen;
	} else {
		sidebar.desktopOpen = !sidebar.desktopOpen;
	}
}

export function closeMobileSidebar() {
	sidebar.mobileOpen = false;
}
