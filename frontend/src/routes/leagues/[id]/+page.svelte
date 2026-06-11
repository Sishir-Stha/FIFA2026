<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { api, type LeaderboardRow } from '$lib/api';
	import { auth } from '$lib/auth.svelte';
	import { language } from '$lib/language.svelte';
	import Avatar from '$lib/components/Avatar.svelte';

	let id = $derived($page.params.id ?? '');
	let league = $state<{ id: string; name: string } | null>(null);
	let rows = $state<LeaderboardRow[]>([]);
	let loaded = $state(false);
	let error = $state('');

	$effect(() => {
		const leagueId = id;
		loaded = false;
		error = '';
		Promise.all([api.leaderboard(leagueId), api.myLeagues()])
			.then(([leaderboard, mine]) => {
				const membership = mine.leagues.find((item) => item.id === leagueId);
				if (!membership || membership.inviteCode !== 'GLOBAL') {
					void goto('/leagues', { replaceState: true });
					return;
				}
				league = leaderboard.league;
				rows = leaderboard.rows;
			})
			.catch(() => {
				error = language.text('Kunne ikke laste ligaen.', 'Kunne ikkje laste ligaen.', 'Could not load the global league.');
			})
			.finally(() => {
				loaded = true;
			});
	});

	let sorted = $derived(
		[...rows].sort(
			(a, b) =>
				b.tipsPoints - a.tipsPoints ||
				b.exactScores - a.exactScores ||
				b.correctWinners - a.correctWinners ||
				a.gdDeviation - b.gdDeviation
		)
	);
</script>

<a href="/leagues" class="muted back">← {language.text('Global liga', 'Global liga', 'Global league')}</a>

{#if error}
	<p class="error">{error}</p>
{:else if !loaded}
	<p class="muted">{language.text('Laster...', 'Lastar...', 'Loading...')}</p>
{:else if league}
	<p class="kicker">{language.text('Global konkurranse', 'Global konkurranse', 'Global competition')}</p>
	<h1>{league.name}</h1>

	<section class="card">
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>#</th>
						<th>{language.text('Spiller', 'Spelar', 'Player')}</th>
						<th class="desktop">{language.text('Tippet', 'Tippa', 'Tipped')}</th>
						<th class="desktop">{language.text('Eksakt', 'Eksakt', 'Exact')}</th>
						<th class="desktop">{language.text('Rett vinner', 'Rett vinnar', 'Correct winner')}</th>
						<th>{language.text('Poeng', 'Poeng', 'Points')}</th>
					</tr>
				</thead>
				<tbody>
					{#each sorted as row, index (row.userId)}
						<tr class:mine={row.userId === auth.user?.id}>
							<td class="rank">
								{#if index === 0}🥇
								{:else if index === 1}🥈
								{:else if index === 2}🥉
								{:else}{index + 1}{/if}
							</td>
							<td>
								<span class="player">
									<Avatar name={row.name} src={row.avatarUrl} size={30} />
									<b>{row.name}</b>
								</span>
							</td>
							<td class="desktop digits">{row.predicted}</td>
							<td class="desktop digits">{row.exactScores}</td>
							<td class="desktop digits">{row.correctWinners}</td>
							<td class="points digits">{row.tipsPoints}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="muted note">{language.text('Poengene oppdateres automatisk når kampresultatene kommer.', 'Poenga blir oppdaterte automatisk når kampresultata kjem.', 'Points update automatically as match results come in.')}</p>
	</section>
{/if}

<style>
	.back { display: inline-block; margin: 0.5rem 0 0.75rem; }
	h1 { margin: 0 0 1rem; }
	.table-wrap { overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; }
	th, td { padding: 0.7rem 0.45rem; border-bottom: 1px solid var(--border); text-align: right; }
	th { color: var(--muted); font-size: 0.76rem; }
	th:nth-child(2), td:nth-child(2) { text-align: left; }
	tr.mine td { background: color-mix(in srgb, var(--accent) 9%, transparent); }
	.rank { width: 3rem; text-align: center; }
	.player { display: inline-flex; align-items: center; gap: 0.55rem; min-width: 0; }
	.player b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.points { color: var(--accent); font-size: 1.05rem; font-weight: 850; }
	.note { margin: 0.85rem 0 0; font-size: 0.82rem; }
	@media (max-width: 620px) {
		.desktop { display: none; }
	}
</style>
