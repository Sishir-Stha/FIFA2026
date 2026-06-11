<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { language } from '$lib/language.svelte';
	import {
		ArrowLeft,
		CheckCircle2,
		Clock,
		Info,
		ListChecks,
		Medal,
		Trophy,
		Volleyball,
		X
	} from '@lucide/svelte';

	let flow = $derived.by(() => [
		{
			icon: Volleyball,
			title: language.text('Tipp hver kamp', 'Tipp kvar kamp', 'Tip every match'),
			text: language.text(
				'Legg inn resultatet før avspark.',
				'Legg inn resultatet før avspark.',
				'Enter your score prediction before kickoff.'
			)
		},
		{
			icon: Clock,
			title: language.text('Rediger før start', 'Rediger før start', 'Edit before kickoff'),
			text: language.text(
				'Du kan endre tipset helt fram til kampen starter.',
				'Du kan endre tipset heilt fram til kampen startar.',
				'You can change a tip until the match begins.'
			)
		},
		{
			icon: ListChecks,
			title: language.text('Følg historikken', 'Følg historikken', 'Track your history'),
			text: language.text(
				'Mine tips viser åpne, pågående og ferdige kamper på ett sted.',
				'Mine tips viser opne, pågåande og ferdige kampar på éin stad.',
				'My Tips shows open, live, and completed matches in one place.'
			)
		},
		{
			icon: Trophy,
			title: language.text('Konkurrer globalt', 'Konkurrer globalt', 'Compete globally'),
			text: language.text(
				'Kamppoengene dine bestemmer plasseringen i den globale ligaen.',
				'Kamppoenga dine avgjer plasseringa i den globale ligaen.',
				'Your match points determine your global-league position.'
			)
		}
	]);

	let matchPoints = $derived.by(() => [
		{ label: language.text('Rett utfall', 'Rett utfall', 'Correct outcome'), value: '3' },
		{ label: language.text('Eksakt resultat', 'Eksakt resultat', 'Exact score'), value: '+1' },
		{ label: language.text('Rett totalt antall mål', 'Rett totalt tal mål', 'Correct total goals'), value: '+1' },
		{ label: language.text('Rett målforskjell', 'Rett målforskjell', 'Correct goal difference'), value: '+1' }
	]);

	function closeInfo() {
		if (browser && history.length > 1) {
			history.back();
			return;
		}
		void goto('/');
	}
</script>

<svelte:head>
	<title>{language.text('Info om spillet', 'Info om spelet', 'About the game')} · Yeti Airlines</title>
</svelte:head>

<div class="info-page">
	<button class="close" type="button" onclick={closeInfo}>
		<X size={18} />
		<span>{language.text('Lukk', 'Lukk', 'Close')}</span>
	</button>

	<section class="hero">
		<p class="kicker">Info</p>
		<h1>{language.text('Slik fungerer Yeti Airlines', 'Slik fungerer Yeti Airlines', 'How Yeti Airlines works')}</h1>
		<p class="lead">
			{language.text(
				'Tipp kampresultater, rediger før avspark og følg poeng og plassering i den globale ligaen.',
				'Tipp kampresultat, rediger før avspark og følg poeng og plassering i den globale ligaen.',
				'Predict match scores, edit before kickoff, and follow your points and global ranking.'
			)}
		</p>
		<div class="scoreboard">
			<div><strong>104</strong><span>{language.text('kamper', 'kampar', 'matches')}</span></div>
			<div><strong>6</strong><span>{language.text('maks per kamp', 'maks per kamp', 'max per match')}</span></div>
			<div><strong>1</strong><span>{language.text('global liga', 'global liga', 'global league')}</span></div>
		</div>
	</section>

	<section class="section">
		<div class="section-title">
			<Info size={18} />
			<h2>{language.text('Slik fungerer det', 'Slik fungerer det', 'How it works')}</h2>
		</div>
		<div class="flow-grid">
			{#each flow as step, index}
				{@const Icon = step.icon}
				<article class="card flow-card">
					<span class="step">{index + 1}</span>
					<Icon size={22} />
					<h3>{step.title}</h3>
					<p>{step.text}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="section">
		<div class="section-title">
			<Medal size={18} />
			<h2>{language.text('Poengsystem', 'Poengsystem', 'Scoring')}</h2>
		</div>
		<article class="card scoring-card">
			<div class="panel-title">
				<Volleyball size={20} />
				<h3>{language.text('Kamptips', 'Kamptips', 'Match tips')}</h3>
			</div>
			<p>{language.text('Du kan få opptil 6 poeng per kamp.', 'Du kan få opptil 6 poeng per kamp.', 'You can earn up to 6 points per match.')}</p>
			<div class="point-list">
				{#each matchPoints as point}
					<div><strong>{point.value}</strong><span>{point.label}</span><CheckCircle2 size={17} /></div>
				{/each}
			</div>
		</article>
	</section>

	<button class="back" type="button" onclick={closeInfo}>
		<ArrowLeft size={18} />
		{language.text('Tilbake', 'Tilbake', 'Back')}
	</button>
</div>

<style>
	.info-page { max-width: 960px; margin: 0 auto; padding-bottom: 2rem; }
	.close, .back {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-pill);
		background: var(--surface);
		color: var(--text);
		padding: 0.65rem 0.9rem;
		cursor: pointer;
	}
	.close { float: right; }
	.hero { clear: both; padding: 2rem 0 1rem; }
	.hero h1 { margin: 0.3rem 0 0.7rem; font-size: clamp(2rem, 5vw, 3.5rem); }
	.lead { max-width: 680px; color: var(--muted); font-size: 1.05rem; line-height: 1.6; }
	.scoreboard { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-top: 1.25rem; }
	.scoreboard div { display: grid; gap: 0.2rem; padding: 1rem; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
	.scoreboard strong { color: var(--accent); font-size: 1.6rem; }
	.scoreboard span { color: var(--muted); font-size: 0.82rem; }
	.section { margin-top: 2rem; }
	.section-title, .panel-title { display: flex; align-items: center; gap: 0.5rem; }
	.section-title h2, .panel-title h3 { margin: 0; }
	.flow-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.8rem; margin-top: 0.8rem; }
	.flow-card { position: relative; display: grid; gap: 0.6rem; }
	.flow-card h3, .flow-card p { margin: 0; }
	.flow-card p, .scoring-card > p { color: var(--muted); line-height: 1.5; }
	.step { position: absolute; top: 0.8rem; right: 0.9rem; color: var(--muted); font-family: var(--font-mono); }
	.scoring-card { margin-top: 0.8rem; }
	.point-list { display: grid; gap: 0.55rem; margin-top: 1rem; }
	.point-list div { display: grid; grid-template-columns: 3rem 1fr auto; align-items: center; gap: 0.6rem; padding: 0.7rem; border-radius: var(--radius-sm); background: var(--surface-2); }
	.point-list strong { color: var(--accent); font-family: var(--font-mono); }
	.back { margin-top: 2rem; }
	@media (max-width: 640px) {
		.scoreboard, .flow-grid { grid-template-columns: 1fr; }
	}
</style>
