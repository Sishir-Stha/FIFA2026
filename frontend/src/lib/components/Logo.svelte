<script lang="ts">
	import { language } from '$lib/language.svelte';
	import { strings } from '$lib/strings';

	let {
		compact = false,
		variant = 'default',
		tagline = ''
	}: { compact?: boolean; variant?: 'default' | 'hero'; tagline?: string } =
		$props();
	const t = $derived(strings[language.resolved]);
</script>

<a class="logo" class:compact class:hero={variant === 'hero'} href="/" aria-label={`Yeti Airlines — ${t.nav.home.toLowerCase()}`}>
	<span class="brand-plate">
		<span class="brand-crop">
			<img
				class="brand-image"
				src="/logos/yeti-airlines-wide.png"
				alt=""
			/>
		</span>
	</span>
	{#if variant === 'hero' && tagline}<span class="tagline">{tagline}</span>{/if}
</a>

<style>
	.logo {
		display: inline-grid;
		gap: 0.55rem;
		color: var(--text);
		width: fit-content;
	}
	.brand-plate {
		display: grid;
		place-items: center;
		width: 190px;
		padding: 0.3rem 0.55rem;
		border: 1px solid rgba(0, 166, 81, 0.16);
		border-radius: 14px;
		background: #fff;
		box-shadow: 0 10px 28px -20px rgba(0, 86, 44, 0.55);
	}
	.brand-crop {
		display: block;
		width: 100%;
	}
	.brand-image {
		width: 100%;
		height: auto;
		display: block;
	}
	.tagline {
		font-size: 0.82rem;
		font-weight: 650;
		color: var(--muted);
		line-height: 1.25;
		max-width: 32ch;
	}
	.logo.hero {
		gap: 0.75rem;
	}
	.logo.hero .brand-plate {
		width: min(310px, 82vw);
		padding: 0.5rem 0.8rem;
		border-radius: 18px;
		box-shadow: 0 20px 46px -28px rgba(0, 86, 44, 0.72);
	}
	.logo.hero .tagline {
		font-size: 0.95rem;
	}
	.logo.compact {
		display: inline-flex;
	}
	.logo.compact .brand-plate {
		width: 42px;
		height: 42px;
		padding: 0.1rem;
		border-radius: 13px;
	}
	.logo.compact .brand-crop {
		position: relative;
		width: 38px;
		height: 34px;
		overflow: hidden;
	}
	.logo.compact .brand-image {
		position: absolute;
		inset: 0 auto 0 0;
		width: auto;
		max-width: none;
		height: 100%;
	}
</style>
