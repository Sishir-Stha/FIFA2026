<script lang="ts">
	import TipCard from '$lib/components/TipCard.svelte';
	import {
		isLocked,
		teamsResolved,
		tipsStore,
		type Match
	} from '$lib/tips.svelte';
	import { language } from '$lib/language.svelte';
	import { ArrowLeft, CheckCircle2, Clock3, Eye, Pencil, Trophy, XCircle } from '@lucide/svelte';

	type Filter = 'all' | 'editable' | 'live' | 'history';
	type TipSection = {
		id: string;
		label: string;
		matches: Match[];
	};

	let filter = $state<Filter>('all');

	$effect(() => {
		if (!tipsStore.loaded) tipsStore.load().catch(() => {});
	});

	let submitted = $derived(
		tipsStore.matches.filter((match) => !!tipsStore.tips[match.id])
	);
	let editable = $derived(
		submitted.filter((match) => teamsResolved(match) && !isLocked(match))
	);
	let live = $derived(submitted.filter((match) => match.status === 'live'));
	let finished = $derived(
		submitted.filter((match) => match.status === 'finished' || !!match.finalizedAt)
	);
	let scored = $derived(
		finished.filter((match) => tipsStore.scores[match.id] !== undefined)
	);
	let correct = $derived(
		finished.filter((match) => outcomeFor(match) === 'won')
	);
	let lost = $derived(
		finished.filter((match) => outcomeFor(match) === 'lost')
	);
	let exact = $derived(
		scored.filter((match) => tipsStore.scores[match.id] === 6)
	);
	let totalPoints = $derived(
		scored.reduce((sum, match) => sum + (tipsStore.scores[match.id] ?? 0), 0)
	);

	function matchTime(match: Match): number {
		return new Date(match.kickoff).getTime();
	}

	function stateRank(match: Match): number {
		if (teamsResolved(match) && !isLocked(match)) return 0;
		if (match.status === 'live') return 1;
		if (match.status === 'finished' || !!match.finalizedAt) return 3;
		return 2;
	}

	let visibleMatches = $derived.by(() => {
		let matches = submitted;
		if (filter === 'editable') matches = editable;
		if (filter === 'live') matches = live;
		if (filter === 'history') matches = finished;

		return [...matches].sort((left, right) => {
			const leftRank = stateRank(left);
			const rightRank = stateRank(right);
			if (leftRank !== rightRank) return leftRank - rightRank;
			if (leftRank === 3) return matchTime(right) - matchTime(left);
			return matchTime(left) - matchTime(right);
		});
	});

	function sectionFor(match: Match): { id: string; label: string } {
		if (teamsResolved(match) && !isLocked(match)) {
			return {
				id: 'editable',
				label: language.text('Kan endres', 'Kan endrast', 'Editable before kickoff')
			};
		}
		if (match.status === 'live') {
			return {
				id: 'live',
				label: language.text('Live na', 'Live no', 'Live now')
			};
		}
		if (match.status === 'finished' || !!match.finalizedAt) {
			return {
				id: 'history',
				label: language.text('Resultathistorikk', 'Resultathistorikk', 'Win and loss history')
			};
		}
		return {
			id: 'waiting',
			label: language.text('Venter pa resultat', 'Ventar pa resultat', 'Locked - waiting for result')
		};
	}

	let sections = $derived.by<TipSection[]>(() => {
		const result: TipSection[] = [];
		for (const match of visibleMatches) {
			const section = sectionFor(match);
			let existing = result.find((item) => item.id === section.id);
			if (!existing) {
				existing = { ...section, matches: [] };
				result.push(existing);
			}
			existing.matches.push(match);
		}
		return result;
	});

	function deadlineLabel(match: Match): string {
		return new Date(match.kickoff).toLocaleString(language.locale, {
			weekday: 'short',
			day: 'numeric',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function sign(value: number): number {
		if (value > 0) return 1;
		if (value < 0) return -1;
		return 0;
	}

	function outcomeFor(match: Match): 'won' | 'lost' | 'pending' {
		const tip = tipsStore.tips[match.id];
		if (!tip || (match.status !== 'finished' && !match.finalizedAt)) return 'pending';
		if (match.stage === 'group') {
			return sign(tip.ftHome - tip.ftAway) === sign(match.ftHome - match.ftAway)
				? 'won'
				: 'lost';
		}
		if (!match.advancer || !tip.advancer) return 'pending';
		return tip.advancer === match.advancer ? 'won' : 'lost';
	}

	function resultLabel(match: Match): string {
		const points = tipsStore.scores[match.id];
		const outcome = outcomeFor(match);
		if (outcome === 'pending') {
			return language.text('Resultat venter', 'Resultat ventar', 'Result pending');
		}
		if (outcome === 'won' && points === 6) {
			return language.text('Vunnet - eksakt resultat', 'Vunne - eksakt resultat', 'Won - exact score');
		}
		if (outcome === 'won') {
			return language.text('Vunnet - riktig tips', 'Vunne - rett tips', 'Won - correct tip');
		}
		return language.text('Tapt tips', 'Tapt tips', 'Lost');
	}
</script>

<header class="page-head">
	<a class="back-link" href="/tips">
		<ArrowLeft size={16} />
		{language.text('Alle kamper', 'Alle kampar', 'All matches')}
	</a>
	<p class="kicker">{language.text('Min historikk', 'Min historikk', 'My history')}</p>
	<h1>{language.text('Mine tips', 'Mine tips', 'My tips')}</h1>
	<p class="muted intro">
		{language.text(
			'Se alle tipsene dine. Du kan endre dem fram til avspark og alltid se dem etterpa.',
			'Sja alle tipsa dine. Du kan endre dei fram til avspark og alltid sja dei etterpa.',
			'View every tip you submitted. You can edit before kickoff and keep viewing it during or after the match.'
		)}
	</p>
</header>

{#if !tipsStore.loaded}
	<div class="card empty">
		<p class="muted">{language.text('Laster tipsene dine...', 'Lastar tipsa dine...', 'Loading your tips...')}</p>
	</div>
{:else}
	<section class="summary-grid" aria-label={language.text('Tipsoversikt', 'Tipsoversikt', 'Tip summary')}>
		<div class="card metric">
			<Eye size={19} />
			<span>{language.text('Levert', 'Levert', 'Submitted')}</span>
			<strong>{submitted.length}</strong>
		</div>
		<div class="card metric editable">
			<Pencil size={19} />
			<span>{language.text('Kan endres', 'Kan endrast', 'Editable')}</span>
			<strong>{editable.length}</strong>
		</div>
		<div class="card metric won">
			<CheckCircle2 size={19} />
			<span>{language.text('Vunnet', 'Vunne', 'Won')}</span>
			<strong>{correct.length}</strong>
		</div>
		<div class="card metric lost">
			<XCircle size={19} />
			<span>{language.text('Tapt', 'Tapt', 'Lost')}</span>
			<strong>{lost.length}</strong>
		</div>
		<div class="card metric points">
			<Trophy size={19} />
			<span>{language.text('Poeng', 'Poeng', 'Points')}</span>
			<strong>{totalPoints}</strong>
			<small>{exact.length} {language.text('eksakte', 'eksakte', 'exact')}</small>
		</div>
	</section>

	<div class="tabs history-tabs" aria-label={language.text('Filtrer tips', 'Filtrer tips', 'Filter tips')}>
		<button class:active={filter === 'all'} onclick={() => (filter = 'all')}>
			{language.text('Alle', 'Alle', 'All')} ({submitted.length})
		</button>
		<button class:active={filter === 'editable'} onclick={() => (filter = 'editable')}>
			{language.text('Kan endres', 'Kan endrast', 'Editable')} ({editable.length})
		</button>
		<button class:active={filter === 'live'} onclick={() => (filter = 'live')}>
			{language.text('Live', 'Live', 'Live')} ({live.length})
		</button>
		<button class:active={filter === 'history'} onclick={() => (filter = 'history')}>
			{language.text('Historikk', 'Historikk', 'History')} ({finished.length})
		</button>
	</div>

	{#if visibleMatches.length === 0}
		<div class="card empty">
			<Clock3 size={32} />
			<h2>
				{filter === 'all'
					? language.text('Ingen tips levert enna', 'Ingen tips leverte enno', 'No tips submitted yet')
					: language.text('Ingen tips i dette filteret', 'Ingen tips i dette filteret', 'No tips in this filter')}
			</h2>
			<p class="muted">
				{filter === 'all'
					? language.text('Velg en kamp og lever ditt forste tips.', 'Vel ein kamp og lever ditt fyrste tips.', 'Choose a match and submit your first tip.')
					: language.text('Prov et annet filter.', 'Prov eit anna filter.', 'Try another filter.')}
			</p>
			<a class="btn" href="/tips">{language.text('Se kamper', 'Sja kampar', 'View matches')}</a>
		</div>
	{:else}
		<div class="tip-sections">
			{#each sections as section (section.id)}
				<section class="tip-section">
					<h2>{section.label}</h2>
					{#each section.matches as match (match.id)}
						<article class="tip-entry">
							<div class="entry-state">
								{#if teamsResolved(match) && !isLocked(match)}
									<span class="state editable">
										<Pencil size={14} />
										{language.text('Redigerbar til', 'Kan endrast til', 'Editable until')} {deadlineLabel(match)}
									</span>
								{:else if match.status === 'live'}
									<span class="state live">
										<span class="live-dot"></span>
										{language.text('Live - kun visning', 'Live - berre visning', 'Live - view only')}
									</span>
								{:else if match.status === 'finished' || !!match.finalizedAt}
									{@const points = tipsStore.scores[match.id]}
									{@const outcome = outcomeFor(match)}
									<span
										class="state result"
										class:won={outcome === 'won'}
										class:lost={outcome === 'lost'}
									>
										{#if outcome === 'won'}
											<CheckCircle2 size={14} />
										{:else if outcome === 'lost'}
											<XCircle size={14} />
										{:else}
											<Clock3 size={14} />
										{/if}
										{resultLabel(match)}
										{#if points !== undefined} - {points} {language.text('poeng', 'poeng', 'points')}{/if}
									</span>
								{:else}
									<span class="state waiting">
										<Clock3 size={14} />
										{language.text('Last - venter pa resultat', 'Last - ventar pa resultat', 'Locked - waiting for result')}
									</span>
								{/if}
							</div>
							<TipCard {match} />
						</article>
					{/each}
				</section>
			{/each}
		</div>
	{/if}
{/if}

<style>
	.page-head {
		max-width: 760px;
		margin-bottom: 1.25rem;
	}
	.page-head h1 {
		margin: 0.15rem 0 0.4rem;
	}
	.intro {
		max-width: 62ch;
		margin: 0;
		line-height: 1.55;
	}
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin-bottom: 1.2rem;
		color: var(--accent);
		font-size: 0.85rem;
		font-weight: 700;
	}
	.summary-grid {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 0.7rem;
		margin-bottom: 1rem;
	}
	.metric {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: center;
		gap: 0.2rem 0.45rem;
		min-height: 104px;
		padding: 1rem;
	}
	.metric:hover {
		transform: none;
	}
	.metric :global(svg) {
		color: var(--muted);
	}
	.metric span {
		color: var(--muted);
		font-size: 0.76rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.metric strong {
		grid-column: 1 / -1;
		font-family: var(--font-mono);
		font-size: 1.7rem;
	}
	.metric small {
		grid-column: 1 / -1;
		color: var(--muted);
	}
	.metric.editable :global(svg),
	.metric.won :global(svg) {
		color: var(--success);
	}
	.metric.lost :global(svg) {
		color: var(--danger);
	}
	.metric.points :global(svg) {
		color: var(--gold);
	}
	.history-tabs {
		margin: 0 0 1.3rem;
	}
	.tip-sections {
		display: grid;
		gap: 1.5rem;
	}
	.tip-section {
		display: grid;
		gap: 0.55rem;
	}
	.tip-section h2 {
		margin: 0.15rem 0;
		font-size: 1rem;
		color: var(--muted);
	}
	.tip-entry {
		display: grid;
		gap: 0.35rem;
	}
	.entry-state {
		display: flex;
		justify-content: flex-end;
		padding-inline: 0.25rem;
	}
	.state {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.25rem 0.55rem;
		border-radius: var(--radius-pill);
		background: var(--surface-2);
		color: var(--muted);
		font-size: 0.73rem;
		font-weight: 700;
	}
	.state.editable,
	.state.result.won {
		background: color-mix(in srgb, var(--success) 12%, transparent);
		color: var(--success);
	}
	.state.result.lost {
		background: color-mix(in srgb, var(--danger) 10%, transparent);
		color: var(--danger);
	}
	.state.live {
		background: color-mix(in srgb, var(--live) 12%, transparent);
		color: var(--live);
	}
	.live-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: currentColor;
		box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 14%, transparent);
	}
	.empty {
		display: grid;
		justify-items: center;
		gap: 0.65rem;
		padding: 2.5rem 1rem;
		text-align: center;
	}
	.empty h2,
	.empty p {
		margin: 0;
	}
	.empty .btn {
		width: auto;
		margin-top: 0.5rem;
	}
	@media (max-width: 820px) {
		.summary-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	@media (max-width: 520px) {
		.summary-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.metric.points {
			grid-column: 1 / -1;
		}
		.entry-state {
			justify-content: flex-start;
		}
		.state {
			max-width: 100%;
		}
	}
</style>
