<script lang="ts">
	import { auth } from '$lib/auth.svelte';
	import { api, type LeaderboardRow, type LeagueSummary } from '$lib/api';
	import { language } from '$lib/language.svelte';
	import { serverClock } from '$lib/serverclock.svelte';
	import { tipsStore, type Match, isLocked, teamsResolved } from '$lib/tips.svelte';
	import { teamDisplayName } from '$lib/teamNames';
	import Avatar from '$lib/components/Avatar.svelte';
	import Flag from '$lib/components/Flag.svelte';
	import PublicLanding from '$lib/components/PublicLanding.svelte';
	import {
		ArrowRight,
		CheckCircle2,
		Clock,
		ListChecks,
		Trophy,
		Volleyball
	} from '@lucide/svelte';

	let globalLeague = $state<LeagueSummary | null>(null);
	let leaderboard = $state<LeaderboardRow[]>([]);
	let leagueLoaded = $state(false);

	$effect(() => {
		if (!auth.isAuthed) return;
		if (!tipsStore.loaded) tipsStore.load().catch(() => {});
		api
			.myLeagues()
			.then(async (result) => {
				globalLeague = result.leagues.find((league) => league.inviteCode === 'GLOBAL') ?? null;
				if (globalLeague) {
					leaderboard = (await api.leaderboard(globalLeague.id)).rows;
				}
			})
			.catch(() => {
				globalLeague = null;
				leaderboard = [];
			})
			.finally(() => {
				leagueLoaded = true;
			});
	});

	let now = $derived(serverClock.now());
	let upcoming = $derived(
		tipsStore.matches
			.filter((match) => new Date(match.kickoff).getTime() > now)
			.sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
	);
	let missing = $derived(
		upcoming.filter(
			(match) => teamsResolved(match) && !isLocked(match) && !tipsStore.tips[match.id]
		)
	);
	let recent = $derived(
		[...tipsStore.matches]
			.filter((match) => match.status === 'finished' || !!match.finalizedAt)
			.sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime())
			.slice(0, 4)
	);
	let upcomingPreview = $derived(upcoming.slice(0, 4));
	let sortedLeaderboard = $derived(
		[...leaderboard].sort(
			(a, b) =>
				b.tipsPoints - a.tipsPoints ||
				b.exactScores - a.exactScores ||
				b.correctWinners - a.correctWinners ||
				a.gdDeviation - b.gdDeviation
		)
	);
	let myRow = $derived(
		sortedLeaderboard.find((row) => row.userId === auth.user?.id) ?? null
	);
	let myRank = $derived(
		myRow ? sortedLeaderboard.findIndex((row) => row.userId === myRow.userId) + 1 : 0
	);
	let topPlayers = $derived(sortedLeaderboard.slice(0, 5));

	function firstName(name: string) {
		return name.trim().split(/\s+/)[0] ?? '';
	}

	function greeting() {
		const hour = new Date().getHours();
		if (hour < 11) return language.text('God morgen', 'God morgon', 'Good morning');
		if (hour < 18) return language.text('Hei', 'Hei', 'Hi');
		return language.text('God kveld', 'God kveld', 'Good evening');
	}

	function team(id: string) {
		return tipsStore.team(id);
	}

	function teamName(match: Match, side: 'home' | 'away') {
		const id = side === 'home' ? match.homeTeam : match.awayTeam;
		const fallback = side === 'home' ? match.homeLabel : match.awayLabel;
		return teamDisplayName(team(id), fallback);
	}

	function kickoffLabel(iso: string) {
		return new Intl.DateTimeFormat(language.locale, {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(iso));
	}

	function resultScore(match: Match) {
		return `${match.ftHome}-${match.ftAway}`;
	}
</script>

{#if !auth.isAuthed}
	<PublicLanding />
{:else}
	<header class="home-hero">
		<p class="kicker">{language.text('Yeti Airlines FIFA 2026', 'Yeti Airlines FIFA 2026', 'Yeti Airlines FIFA 2026')}</p>
		<h1>{greeting()}, {firstName(auth.user?.name ?? '')}</h1>
		<p class="muted">{language.text('Legg inn kamptips og følg plasseringen din i den globale ligaen.', 'Legg inn kamptips og følg plasseringa di i den globale ligaen.', 'Submit match tips and track your global-league position.')}</p>
	</header>

	<div class="dashboard">
		<section class="card action-card">
			<span class="card-icon"><Volleyball size={22} /></span>
			<div>
				<p class="kicker">{language.text('Neste steg', 'Neste steg', 'Next action')}</p>
				<h2>
					{#if !tipsStore.loaded}
						{language.text('Laster kamper...', 'Lastar kampar...', 'Loading matches...')}
					{:else if missing.length > 0}
						{language.text(`${missing.length} kamptips mangler`, `${missing.length} kamptips manglar`, `${missing.length} match tip${missing.length === 1 ? '' : 's'} missing`)}
					{:else}
						{language.text('Alle åpne kamper er tippet', 'Alle opne kampar er tippa', 'All open matches are tipped')}
					{/if}
				</h2>
				<p class="muted">
					{#if missing[0]}
						{language.text('Neste frist', 'Neste frist', 'Next deadline')}: {kickoffLabel(missing[0].kickoff)}
					{:else}
						{language.text('Du kan se og redigere tips før kampstart.', 'Du kan sjå og redigere tips før kampstart.', 'You can view and edit tips before kickoff.')}
					{/if}
				</p>
			</div>
			<a class="primary-link" href={missing.length > 0 ? '/tips?tab=missing' : '/tips'}>
				{language.text('Åpne kamptips', 'Opne kamptips', 'Open match tips')} <ArrowRight size={17} />
			</a>
		</section>

		<section class="card my-tips-card">
			<div class="section-head">
				<div>
					<p class="kicker">{language.text('Din historikk', 'Din historikk', 'Your history')}</p>
					<h2>{language.text('Mine tips', 'Mine tips', 'My Tips')}</h2>
				</div>
				<ListChecks size={24} />
			</div>
			<p class="muted">{language.text('Se åpne, pågående og ferdige tips. Rediger når kampen ikke har startet.', 'Sjå opne, pågåande og ferdige tips. Rediger når kampen ikkje har starta.', 'View open, live, and completed tips. Edit any match that has not started.')}</p>
			<a class="text-link" href="/my-tips">{language.text('Se mine tips', 'Sjå mine tips', 'View my tips')} <ArrowRight size={16} /></a>
		</section>

		<section class="card standing-card">
			<div class="section-head">
				<div>
					<p class="kicker">{language.text('Global liga', 'Global liga', 'Global league')}</p>
					<h2>{language.text('Din plassering', 'Di plassering', 'Your standing')}</h2>
				</div>
				<Trophy size={24} />
			</div>
			{#if !leagueLoaded}
				<p class="muted">{language.text('Laster tabellen...', 'Lastar tabellen...', 'Loading standings...')}</p>
			{:else if myRow}
				<div class="rank-summary">
					<strong>#{myRank}</strong>
					<span><b>{myRow.tipsPoints}</b> {language.text('poeng', 'poeng', 'points')}</span>
				</div>
			{:else}
				<p class="muted">{language.text('Ingen poeng registrert ennå.', 'Ingen poeng registrert enno.', 'No points recorded yet.')}</p>
			{/if}
			{#if globalLeague}
				<a class="text-link" href={`/leagues/${globalLeague.id}`}>{language.text('Se hele tabellen', 'Sjå heile tabellen', 'View full table')} <ArrowRight size={16} /></a>
			{/if}
		</section>

		<section class="card leaderboard-card">
			<div class="section-head">
				<h2>{language.text('Topp 5 globalt', 'Topp 5 globalt', 'Global top 5')}</h2>
				<CheckCircle2 size={22} />
			</div>
			{#if topPlayers.length === 0}
				<p class="muted">{language.text('Tabellen fylles når kampene gir poeng.', 'Tabellen blir fylt når kampane gir poeng.', 'The table will fill as matches award points.')}</p>
			{:else}
				<div class="leader-list">
					{#each topPlayers as row, index (row.userId)}
						<div class:mine={row.userId === auth.user?.id}>
							<span class="position">{index + 1}</span>
							<Avatar name={row.name} src={row.avatarUrl} size={30} />
							<b>{row.name}</b>
							<strong>{row.tipsPoints}</strong>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<section class="card matches-card">
			<div class="section-head">
				<h2><Clock size={19} /> {language.text('Kommende kamper', 'Komande kampar', 'Upcoming matches')}</h2>
				<a href="/tips">{language.text('Alle', 'Alle', 'All')}</a>
			</div>
			<div class="match-list">
				{#each upcomingPreview as match (match.id)}
					<a href={`/tips?match=${encodeURIComponent(match.id)}`}>
						<span class="match-time">{kickoffLabel(match.kickoff)}</span>
						<span class="teams">
							<span><Flag iso2={team(match.homeTeam)?.iso2 ?? ''} code={team(match.homeTeam)?.fifaCode ?? ''} size={17} /> {teamName(match, 'home')}</span>
							<i>vs</i>
							<span>{teamName(match, 'away')} <Flag iso2={team(match.awayTeam)?.iso2 ?? ''} code={team(match.awayTeam)?.fifaCode ?? ''} size={17} /></span>
						</span>
						<em class:missing={!tipsStore.tips[match.id]}>
							{tipsStore.tips[match.id]
								? language.text('Levert', 'Levert', 'Submitted')
								: language.text('Mangler', 'Manglar', 'Missing')}
						</em>
					</a>
				{/each}
			</div>
		</section>

		<section class="card results-card">
			<div class="section-head">
				<h2>{language.text('Siste resultater', 'Siste resultat', 'Latest results')}</h2>
				<a href="/my-tips">{language.text('Historikk', 'Historikk', 'History')}</a>
			</div>
			{#if recent.length === 0}
				<p class="muted">{language.text('Ingen ferdige kamper ennå.', 'Ingen ferdige kampar enno.', 'No completed matches yet.')}</p>
			{:else}
				<div class="result-list">
					{#each recent as match (match.id)}
						{@const tip = tipsStore.tips[match.id]}
						<div>
							<span>{teamName(match, 'home')} <b>{resultScore(match)}</b> {teamName(match, 'away')}</span>
							<em>{tip ? `${language.text('Ditt tips', 'Ditt tips', 'Your tip')} ${tip.ftHome}-${tip.ftAway}` : language.text('Ikke tippet', 'Ikkje tippa', 'Not tipped')}</em>
							<strong>{tipsStore.scores[match.id] ?? 0} {language.text('p', 'p', 'pts')}</strong>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	</div>
{/if}

<style>
	.home-hero { display: grid; gap: 0.35rem; margin: 0.3rem 0 1rem; }
	.home-hero h1, .home-hero p { margin: 0; }
	.home-hero h1 { font-size: clamp(2rem, 5vw, 3.1rem); }
	.dashboard { display: grid; gap: 0.85rem; }
	.card { margin: 0; }
	.action-card { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 1rem; }
	.action-card h2, .action-card p { margin: 0; }
	.card-icon {
		display: grid;
		place-items: center;
		width: 48px;
		height: 48px;
		border-radius: 16px;
		background: color-mix(in srgb, var(--accent) 14%, var(--surface-2));
		color: var(--accent);
	}
	.primary-link, .text-link { display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 800; }
	.primary-link {
		padding: 0.75rem 1rem;
		border-radius: var(--radius-pill);
		background: var(--accent);
		color: var(--bg);
		white-space: nowrap;
	}
	.section-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
	.section-head h2, .section-head p { margin: 0; }
	.section-head h2 { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 1.1rem; }
	.my-tips-card, .standing-card, .leaderboard-card, .matches-card, .results-card { display: grid; gap: 0.85rem; }
	.rank-summary { display: flex; align-items: baseline; gap: 0.75rem; }
	.rank-summary > strong { color: var(--accent); font: 900 2.6rem var(--font-display); }
	.rank-summary span b { font-size: 1.25rem; }
	.leader-list, .match-list, .result-list { display: grid; }
	.leader-list > div {
		display: grid;
		grid-template-columns: 2rem auto minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.55rem;
		padding: 0.55rem 0;
		border-bottom: 1px solid var(--border);
	}
	.leader-list > div.mine { color: var(--accent); }
	.position { color: var(--muted); font-family: var(--font-mono); }
	.match-list > a {
		display: grid;
		grid-template-columns: 9rem minmax(0, 1fr) auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--border);
		color: var(--text);
	}
	.match-time, .result-list em { color: var(--muted); font-size: 0.8rem; }
	.teams { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 0.45rem; }
	.teams > span { display: inline-flex; align-items: center; gap: 0.4rem; min-width: 0; }
	.teams > span:last-child { justify-content: flex-end; text-align: right; }
	.teams i { color: var(--muted); font-style: normal; }
	.match-list em { color: var(--accent); font-size: 0.75rem; font-style: normal; font-weight: 800; }
	.match-list em.missing { color: var(--warning); }
	.result-list > div {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto;
		gap: 0.75rem;
		padding: 0.7rem 0;
		border-bottom: 1px solid var(--border);
	}
	.result-list em { font-style: normal; }
	.result-list strong { color: var(--accent); }
	@media (min-width: 760px) {
		.dashboard { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		.action-card, .matches-card, .results-card { grid-column: 1 / -1; }
	}
	@media (max-width: 640px) {
		.action-card { grid-template-columns: auto minmax(0, 1fr); }
		.action-card .primary-link { grid-column: 1 / -1; justify-content: center; }
		.match-list > a { grid-template-columns: 1fr auto; }
		.match-time { grid-column: 1 / -1; }
		.result-list > div { grid-template-columns: 1fr auto; }
		.result-list em { grid-column: 1 / -1; }
	}
</style>
