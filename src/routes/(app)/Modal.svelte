<svelte:options runes={true} />

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { classes } from 'svelte-transition-classes';
	import * as Drawer from '$/lib/components/ui/drawer';
	import { writable } from 'svelte/store';

	const {
		isOpen,
		children,
		onclose: onClose,
	}: { isOpen: boolean; children: Snippet; onclose: (event: Event) => void } = $props();

	const open = writable(false);
	// const dragControls = useDragControls();
	// const animateControls = useAnimation();
	const md = window.matchMedia('(max-width:768px)');
	const mdState = $state({ isMobile: md.matches });

	// const overlayVariants: Variants = {
	// 	hidden: { opacity: 0, scale: 0.8, transition: { opacity: { duration: 0.2 }, scale: { duration: 1.5 } } },
	// 	visible: { opacity: 1, scale: 1 },
	// };

	// const panelVariants = $derived({
	// 	hidden: {
	// 		y: mdState.isMobile ? 1000 : 0,
	// 		transition: {
	// 			type: 'spring',
	// 			damping: 30,
	// 			stiffness: 300,
	// 			y: {
	// 				duration: 0.5,
	// 			},
	// 		},
	// 	},
	// 	visible: {
	// 		y: 0,
	// 		transition: {
	// 			type: 'spring',
	// 			damping: 30,
	// 			stiffness: 300,
	// 		},
	// 	},
	// });

	// onMount(async () => {
	// 	await animateControls.start('visible');
	// });

	// const startDrag = (event: MouseEvent | TouchEvent | PointerEvent) => {
	// 	dragControls.start(event);
	// };

	$effect(() => {
		const handler = (e: MediaQueryListEvent) => {
			mdState.isMobile = e.matches;
		};

		// @ts-expect-error
		'addEventListener' in md ? md.addEventListener('change', handler) : md.addListener(handler);

		// @ts-expect-error
		return () => ('removeEventListener' in md ? md.removeEventListener('change', handler) : md.removeListener(handler));
	});

	$effect(() => {
		open.set(isOpen && mdState.isMobile);
	});
</script>

<!-- <Motion.div
	initial="hidden"
	animate="visible"
	exit="hidden"
	variants={overlayVariants}
	class="[--bg-dark-modal:rgba(251,240,216,0.8) [--bg-modal:rgba(4,15,39,0.8)] max-md:fixed max-md:inset-0 max-md:z-10 max-md:bg-[--bg-modal] max-md:backdrop-blur-[0.4rem] max-md:dark:bg-[--bg-dark-modal] max-md:dark:backdrop-blur-[0.4rem]"
	onclick={(e) => {
		dispatch('close', e);
	}}
	onkeydown={(e) => dispatch('close', e)} />
<Motion.div
	initial="hidden"
	animate="visible"
	exit="hidden"
	variants={panelVariants}
	drag="y"
	dragConstraints={{ top: 0, bottom: 10 }}
	dragElastic={0.8}
	onDragEnd={(e, info) => {
		if (info.velocity.y > 10 || info.offset.y > 200) {
			dispatch('close', e);
		}
		animateControls.set({ y: 0 });
	}}
	{dragControls}
	class="z-20 h-full grow max-md:fixed max-md:inset-x-2 max-md:bottom-0 max-md:top-40 max-md:mx-auto max-md:max-w-sm max-md:rounded-t-2xl max-md:bg-white max-md:shadow-md max-md:dark:bg-gray-800 max-md:dark:shadow-neutral-309/20">
	<div
		aria-label="Handle"
		class="mx-auto mt-4 h-4 w-28 touch-none rounded-lg bg-black opacity-[.09] md:hidden dark:bg-white dark:opacity-5"
		onPointerDown={startDrag} />
	<div class="max-md:mx-auto max-md:h-[calc(100%-12rem)] max-md:w-64 md:h-full md:w-full">
		{@render children()}
	</div>
</Motion.div> -->
<!-- class="hidden max-md:block" -->
<Drawer.Root shouldScaleBackground bind:open={$open} onClose={() => onClose(new Event('close'))}>
	<Drawer.Content>
		{@render children()}
	</Drawer.Content>
</Drawer.Root>
<div
	in:classes={{
		duration: 250,
		base: 'md:transition md:duration-250',
		from: 'md:-translate-x-1/2 md:opacity-0',
		to: 'md:translate-x-0 md:opacity-100',
	}}
	out:classes={{
		duration: 150,
		base: 'md:transition md:duration-150',
		from: 'md:translate-x-0 md:opacity-100',
		to: 'md:-translate-x-1/2 md:opacity-0',
	}}
	class="hidden md:static md:inset-y-0 md:left-16 md:mx-0 md:block md:h-auto md:w-72 md:bg-inherit md:shadow-none md:dark:bg-inherit">
	{@render children()}
</div>
