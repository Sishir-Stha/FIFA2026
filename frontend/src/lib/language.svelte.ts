import { browser } from '$app/environment';

export type LanguageCode = 'nb' | 'nn' | 'en';

const STORAGE_KEY = 'language';
const DEFAULT_LANGUAGE: LanguageCode = 'en';

export function isLanguageCode(value: unknown): value is LanguageCode {
	return value === 'nb' || value === 'nn' || value === 'en';
}

function readStoredLanguage(): LanguageCode {
	if (!browser) return DEFAULT_LANGUAGE;
	localStorage.setItem(STORAGE_KEY, DEFAULT_LANGUAGE);
	return DEFAULT_LANGUAGE;
}

class LanguageStore {
	code = $state<LanguageCode>(readStoredLanguage());

	get resolved() {
		return this.code;
	}

	get locale() {
		// `nn-NO` falls back inconsistently in some browsers; `no-NO`
		// keeps Norwegian date/time formatting stable while UI copy chooses nb/nn.
		return this.code === 'en' ? 'en-US' : 'no-NO';
	}

	get isEnglish() {
		return this.code === 'en';
	}

	get isBokmal() {
		return this.code === 'nb';
	}

	get isNynorsk() {
		return this.code === 'nn';
	}

	text<T>(nb: T, nn: T, en: T): T {
		if (this.code === 'en') return en;
		if (this.code === 'nn') return nn;
		return nb;
	}

	set(_next: LanguageCode) {
		this.code = DEFAULT_LANGUAGE;
		if (browser) localStorage.setItem(STORAGE_KEY, DEFAULT_LANGUAGE);
	}

	toggle() {
		this.set(DEFAULT_LANGUAGE);
	}
}

export const language = new LanguageStore();
