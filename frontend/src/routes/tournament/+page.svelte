<script lang="ts">
	import { tipsStore, type Match } from '$lib/tips.svelte';
	import { api, type GoldenBootLeagueTable } from '$lib/api';
	import { collapseOnScroll } from '$lib/actions';
	import { language } from '$lib/language.svelte';
	import { teamDisplayName } from '$lib/teamNames';
	import Flag from '$lib/components/Flag.svelte';

	let view = $state<'groups' | 'topscorer'>('groups');
	let goldenBoot = $state<GoldenBootLeagueTable | null>(null);

	$effect(() => {
		if (!tipsStore.loaded) tipsStore.load().catch(() => {});
		api
			.myLeagues()
			.then(async (result) => {
				const global = result.leagues.find((league) => league.inviteCode === 'GLOBAL');
				if (!global) return;
				goldenBoot = (await api.leaderboard(global.id)).goldenBoot ?? null;
			})
			.catch(() => {
				goldenBoot = null;
			});
	});

	function played(match: Match) {
		return match.status === 'finished' || !!match.finalizedAt;
	}

	interface Standing {
		id: string;
		p: number;
		w: number;
		d: number;
		l: number;
		gf: number;
		ga: number;
		pts: number;
	}

	let groups = $derived.by(() => {
		const blank = (id: string): Standing => ({
			id,
			p: 0,
			w: 0,
			d: 0,
			l: 0,
			gf: 0,
			ga: 0,
			pts: 0
		});
		const byGroup: Record<string, Record<string, Standing>> = {};

		for (const [letter, ids] of Object.entries(tipsStore.tournamentGroups)) {
			byGroup[letter] = {};
			for (const id of ids) byGroup[letter][id] = blank(id);
		}

		for (const match of tipsStore.matches) {
			if (match.stage !== 'group' || !played(match)) continue;
			const group = match.groupLetter;
			byGroup[group] ||= {};
			for (const id of [match.homeTeam, match.awayTeam]) {
				byGroup[group][id] ||= blank(id);
			}
			const home = byGroup[group][match.homeTeam];
			const away = byGroup[group][match.awayTeam];
			home.p++;
			away.p++;
			home.gf += match.ftHome;
			home.ga += match.ftAway;
			away.gf += match.ftAway;
			away.ga += match.ftHome;
			if (match.ftHome > match.ftAway) {
				home.w++;
				away.l++;
				home.pts += 3;
			} else if (match.ftHome < match.ftAway) {
				away.w++;
				home.l++;
				away.pts += 3;
			} else {
				home.d++;
				away.d++;
				home.pts++;
				away.pts++;
			}
		}

		return Object.entries(byGroup)
			.map(([letter, table]) => ({
				letter,
				rows: Object.values(table).sort(
					(a, b) => b.pts - a.pts || b.gf - b.ga - (a.gf - a.ga) || b.gf - a.gf
				)
			}))
			.sort((a, b) => a.letter.localeCompare(b.letter));
	});

	function team(id: string) {
		return tipsStore.team(id);
	}

	function teamName(id: string) {
		return teamDisplayName(team(id), '?');
	}

	function initials(name: string) {
		return name
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? '')
			.join('');
	}

	function updatedAt(iso?: string) {
		if (!iso) return language.text('Ikke synket ennå', 'Ikkje synka enno', 'Not synced yet');
		const date = new Date(iso);
		if (!Number.isFinite(date.getTime())) return '';
		return new Intl.DateTimeFormat(language.locale, {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}
</script>

<div class="stickyhead" use:collapseOnScroll>
	<p class="kicker">World Cup 2026</p>
	<div class="sh-expand"><div class="sh-inner"><h1>{language.text('Turnering', 'Turnering', 'Tournament')}</h1></div></div>
	<div class="seg">
		<button class:on={view === 'groups'} onclick={() => (view = 'groups')}>
			{language.text('Gruppetabeller', 'Gruppetabellar', 'Group tables')}
		</button>
		<button class:on={view === 'topscorer'} onclick={() => (view = 'topscorer')}>
			{language.text('Toppscorere', 'Toppscorarar', 'Top scorers')}
		</button>
	</div>
</div>

{#if !tipsStore.loaded}
	<p class="muted">{language.text('Laster...', 'Lastar...', 'Loading...')}</p>
{:else if view === 'groups'}
	<div class="group-grid">
		{#each groups as group (group.letter)}
			<section class="card group-card">
				<div class="group-head"><span>{group.letter}</span> {language.text('Gruppe', 'Gruppe', 'Group')} {group.letter}</div>
				<table>
					<thead>
						<tr>
							<th></th>
							<th>{language.text('Lag', 'Lag', 'Team')}</th>
							<th>{language.text('K', 'K', 'P')}</th>
							<th>{language.text('MF', 'MF', 'GD')}</th>
							<th>{language.text('P', 'P', 'Pts')}</th>
						</tr>
					</thead>
					<tbody>
						{#each group.rows as row, index (row.id)}
							<tr class:advancing={index < 2}>
								<td class="rank">{index + 1}</td>
								<td class="team">
									<Flag iso2={team(row.id)?.iso2 ?? ''} code={team(row.id)?.fifaCode ?? ''} />
									<span>{teamName(row.id)}</span>
								</td>
								<td class="digits">{row.p}</td>
								<td class="digits">{row.gf - row.ga > 0 ? '+' : ''}{row.gf - row.ga}</td>
								<td class="digits points">{row.pts}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
		{/each}
	</div>
{:else}
	<section class="card scorer-card">
		<div class="scorer-head">
			<p class="muted">{language.text('Den offisielle toppscorertabellen.', 'Den offisielle toppscorartabellen.', 'The official top-scorer standings.')}</p>
			{#if goldenBoot?.updatedAt}
				<p class="muted updated">{language.text('Oppdatert', 'Oppdatert', 'Updated')} {updatedAt(goldenBoot.updatedAt)}</p>
			{/if}
		</div>
		<table>
			<thead>
				<tr>
					<th>#</th>
					<th>{language.text('Spiller', 'Spelar', 'Player')}</th>
					<th>{language.text('Lag', 'Lag', 'Team')}</th>
					<th>{language.text('Mål', 'Mål', 'Goals')}</th>
				</tr>
			</thead>
			<tbody>
				{#if !goldenBoot || goldenBoot.players.length === 0}
					<tr><td colspan="4" class="empty">{language.text('Ingen mål registrert ennå.', 'Ingen mål registrert enno.', 'No goals registered yet.')}</td></tr>
				{/if}
				{#each goldenBoot?.players ?? [] as player (player.id)}
					<tr>
						<td>{player.rank || '-'}</td>
						<td>
							<span class="player">
								{#if player.photoUrl}
									<img src={player.photoUrl} alt="" loading="lazy" />
								{:else}
									<i>{initials(player.name)}</i>
								{/if}
								<b>{player.name}</b>
							</span>
						</td>
						<td>
							<span class="team">
								<Flag iso2={team(player.teamId)?.iso2 ?? ''} code={team(player.teamId)?.fifaCode ?? ''} />
								{player.teamName}
							</span>
						</td>
						<td class="digits points">{player.goals}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
{/if}

<style>
	.stickyhead {
		position: sticky;
		top: var(--topbar-h);
		z-index: 20;
		margin: 0 -1rem;
		padding: 0.6rem 1rem 0.75rem;
		background: var(--bg);
		border-bottom: 1px solid var(--border);
	}
	.stickyhead h1 { margin: 0.1rem 0 0.7rem; }
	.group-grid { display: grid; gap: 0.85rem; }
	.group-head {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.6rem;
		font-weight: 800;
	}
	.group-head span {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--surface-2);
	}
	table { width: 100%; border-collapse: collapse; }
	th, td { padding: 0.55rem 0.4rem; border-bottom: 1px solid var(--border); text-align: right; }
	th { color: var(--muted); font-size: 0.75rem; }
	th:nth-child(2), td:nth-child(2) { text-align: left; }
	.team, .player { display: inline-flex; align-items: center; gap: 0.5rem; }
	.rank { color: var(--muted); text-align: center; }
	.points, .advancing .rank { color: var(--accent); font-weight: 800; }
	.advancing td { background: color-mix(in srgb, var(--accent) 6%, transparent); }
	.scorer-head { display: flex; justify-content: space-between; gap: 1rem; }
	.scorer-head p { margin: 0 0 0.8rem; }
	.updated { white-space: nowrap; }
	.player img, .player i {
		display: grid;
		place-items: center;
		width: 30px;
		height: 30px;
		border: 1px solid var(--border);
		border-radius: 50%;
		background: var(--surface-2);
		object-fit: cover;
		font-size: 0.65rem;
		font-style: normal;
	}
	.empty { padding: 1.5rem; text-align: center; color: var(--muted); }
	@media (min-width: 760px) {
		.group-grid { grid-template-columns: 1fr 1fr; }
	}
	@media (min-width: 900px) {
		.stickyhead { top: 0; margin: 0 -2rem; padding: 0.75rem 2rem 0.85rem; }
	}
</style>
