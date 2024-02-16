import { writable } from 'svelte/store';
import type { Session } from '@auth/sveltekit';
import { browser } from '$app/environment';

const initialValue = browser ? Boolean(JSON.parse(window.localStorage.getItem('useBauhaus') ?? 'null')) : null;

const useBauhaus = writable(initialValue ?? false);

class UserSettings {

	useBauhaus = $state(initialValue);

	// eslint-disable-next-line class-methods-use-this
	genertateImage = (user: Session['user'] | undefined) => user?.image || `https://source.boringavatars.com/${(useBauhaus && 'bauhaus') || 'beam'}/120/${encodeURIComponent(
			user?.name ?? ''
		)}?colors=000000,ff3e00,CDCDCD,4075a6,${
		Math.floor(Math.random() * 0xffffff * 1000000)
			.toString(16)
			.slice(0, 6)
		}`;
}

export const userSettings = new UserSettings();

useBauhaus.subscribe((val) => {
	if (browser) {
		window.localStorage.setItem('useBauhaus', String(val));
	}

	userSettings.useBauhaus = val;
})