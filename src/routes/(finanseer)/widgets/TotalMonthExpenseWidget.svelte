<script lang="ts">
	import { filter, switchMap, reduce, of } from 'rxjs';
	import { format, isSameMonth, startOfMonth, subMonths } from 'date-fns';
	import { api } from '$lib/api';
	import { dateFormat } from '$lib/utils';
	import ScoreCard from './ScoreCard.svelte';

	export let processedDay: Date;
	export let searchFilter: string;

	$: prevMonth = subMonths(processedDay, 1);
	$: transactions = api.buxfer.transactions.infiniteQuery(
		{
			startDate: startOfMonth(prevMonth),
			endDate: processedDay,
		},
		{
			getNextPageParam: (lastPage, allPages) => {
				if (
					lastPage &&
					typeof lastPage === 'object' &&
					'totalTransactionsCount' in lastPage &&
					typeof lastPage.totalTransactionsCount === 'number' &&
					allPages.length < Math.ceil(lastPage.totalTransactionsCount / 100)
				) {
					return allPages.length + 1;
				}
				return undefined;
			},
			onSuccess(infiniteData) {
				if (infiniteData.pageParams.splice(-1)) {
					$transactions.fetchNextPage();
				}
			},
		}
	);

	$: expenses$ = of($transactions.data).pipe(
		switchMap((data) => data?.pages.flatMap((page) => page.transactions) ?? []),
		filter(({ type, tags, description }) =>
			searchFilter
				? type.match(new RegExp(`${searchFilter}\\b`, 'i')) !== null ||
				  tags.match(new RegExp(`${searchFilter}\\b`, 'i')) !== null ||
				  description.match(new RegExp(`${searchFilter}\\b`, 'i')) !== null
				: true
		),
		filter(({ type }) => type === 'expense'),
		reduce(
			({ currMonthSpent, prevMonthSpent }, { date, amount }) => ({
				currMonthSpent: currMonthSpent + (isSameMonth(date, processedDay) ? amount : 0),
				prevMonthSpent: prevMonthSpent + (isSameMonth(date, prevMonth) ? amount : 0),
			}),
			{ currMonthSpent: 0, prevMonthSpent: 0 }
		)
	);

	$: processedDate = format(processedDay, dateFormat);
</script>

<ScoreCard label="Spent" score={$expenses$.currMonthSpent} swap comparison={{ score: $expenses$.prevMonthSpent }}>
	<form
		action="/transactions"
		method="get"
		slot="additional"
		on:formdata={(e) => {
			Array.from(e.formData.entries()).forEach(([k, v]) => !v && e.formData.delete(k));
		}}>
		<input type="hidden" name="processedDate" bind:value={processedDate} />
		<input type="hidden" name="search" bind:value={searchFilter} />
		<button>view transactions</button>
	</form>
</ScoreCard>
