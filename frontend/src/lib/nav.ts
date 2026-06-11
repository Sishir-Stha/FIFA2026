import { House, Volleyball, Network, Trophy } from '@lucide/svelte';
import type { Component } from 'svelte';

export interface NavItem {
	href: string;
	labelKey: 'home' | 'matchTips' | 'bracket' | 'leagues';
	icon: Component;
}

export const navItems: NavItem[] = [
	{ href: '/', labelKey: 'home', icon: House },
	{ href: '/tips', labelKey: 'matchTips', icon: Volleyball },
	{ href: '/tournament', labelKey: 'bracket', icon: Network },
	{ href: '/leagues', labelKey: 'leagues', icon: Trophy }
];

export function isActive(href: string, path: string): boolean {
	if (href === '/tips' && path.startsWith('/my-tips')) return true;
	return href === '/' ? path === '/' : path.startsWith(href);
}
