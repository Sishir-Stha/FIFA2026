<script lang="ts">
	import { api, type LeagueSummary } from '$lib/api';
	import { language } from '$lib/language.svelte';
	import { ArrowRight, Globe2, Users } from '@lucide/svelte';

	let leagues = $state<LeagueSummary[]>([]);
	let loaded = $state(false);

	$effect(() => {
		api
			.myLeagues()
			.then((result) => {
				leagues = result.leagues.filter((league) => league.inviteCode === 'GLOBAL');
			})
			.catch(() => {
				leagues = [];
			})
			.finally(() => {
				loaded = true;
			});
	});
</script>

<header class="league-hero">
	<p class="kicker">{language.text('Global konkurranse', 'Global konkurranse', 'Global competition')}</p>
	<h1>{language.text('Global liga', 'Global liga', 'Global league')}</h1>
	<p class="muted">{language.text('Se hvordan kamptipsene dine ligger an mot alle spillerne.', 'Sjå korleis kamptipsa dine ligg an mot alle spelarane.', 'See how your match tips rank against every player.')}</p>
</header>

<section>
	{#if !loaded}
		<div class="league-tile skeleton"></div>
	{:else if leagues.length === 0}
		<div class="empty-state">
			<strong>{language.text('Global liga er ikke tilgjengelig.', 'Global liga er ikkje tilgjengeleg.', 'The global league is not available.')}</strong>
		</div>
	{:else}
		<div class="league-grid">
			{#each leagues as league (league.id)}
				<a class="league-tile" href={`/leagues/${league.id}`}>
					<span class="league-icon"><Globe2 size={22} /></span>
					<span class="league-main">
						<b>{league.name}</b>
						<span><Users size={14} /> {league.members} {language.text(league.members === 1 ? 'spiller' : 'spillere', league.members === 1 ? 'spelar' : 'spelarar', league.members === 1 ? 'player' : 'players')}</span>
					</span>
					<span class="go"><ArrowRight size={18} /></span>
				</a>
			{/each}
		</div>
	{/if}
</section>

<style>
	.league-hero { display: grid; gap: 0.35rem; margin: 0.2rem 0 1rem; }
	.league-hero h1, .league-hero p { margin: 0; }
	.league-grid { display: grid; gap: 0.75rem; }
	.league-tile {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.85rem;
		min-height: 104px;
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: color-mix(in srgb, var(--accent) 6%, var(--surface));
		color: var(--text);
		box-shadow: var(--shadow-tile);
	}
	.league-tile:hover { border-color: var(--accent); transform: translateY(-2px); }
	.league-icon, .go {
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: color-mix(in srgb, var(--accent) 14%, var(--surface-2));
		color: var(--accent);
	}
	.league-icon { width: 46px; height: 46px; }
	.go { width: 34px; height: 34px; }
	.league-main { display: grid; gap: 0.4rem; }
	.league-main b { font-size: 1.08rem; }
	.league-main span { display: flex; align-items: center; gap: 0.35rem; color: var(--muted); font-size: 0.85rem; }
	.empty-state { padding: 1rem; border: 1px dashed var(--border); border-radius: var(--radius); }
	.skeleton {
		background: linear-gradient(90deg, var(--surface), var(--surface-2), var(--surface));
		background-size: 200% 100%;
		animation: pulse 1.4s ease-in-out infinite;
	}
	@keyframes pulse {
		from { background-position: 200% 0; }
		to { background-position: -200% 0; }
	}
</style>
