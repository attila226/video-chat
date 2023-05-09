<script>
	import { initDB, getAllCalls, deleteAllCallls } from '../../lib/data';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Spinner
	} from 'flowbite-svelte';

	// Your web app's Firebase configuration
	import { PUBLIC_FIREBASE_CONFIG } from '$env/static/public';

	const firebaseConfig = JSON.parse(PUBLIC_FIREBASE_CONFIG);

	// Initialize Firebase
	const db = initDB(firebaseConfig);

	const callsPromise = getAllCalls(db);

	const outputData = (data) => {
		const rawData = data.docs.map((doc) => doc.data());
		console.log(rawData);
		return rawData;
	};

	const formatObject = (object) => {
		return JSON.stringify(object).substring(1).replaceAll('\\r\\n', '<br>');
	};
</script>

<header class="header">
	<a href="/">Home</a>
	<a href="/admin">Admin</a>
</header>
<main>
	<span class="content">
		{#await callsPromise}
			<Spinner />
		{:then calls}
			<Table shadow>
				<TableHead>
					<TableHeadCell>Offer SDP</TableHeadCell>
					<TableHeadCell>Answer SDP</TableHeadCell>
					<TableHeadCell>
						<span class="sr-only"> Edit </span>
					</TableHeadCell>
				</TableHead>

				<TableBody class="divide-y">
					{#each outputData(calls) as call}
						<TableBodyRow>
							<TableBodyCell
								><div class="h-40 overflow-y-scroll w-60">
									{@html formatObject(call.offer.sdp)}
								</div></TableBodyCell
							>
							<TableBodyCell
								><div class="h-40 overflow-y-scroll w-60">
									{@html formatObject(call.answer.sdp)}
								</div></TableBodyCell
							>
							<TableBodyCell>
								<a
									href="/tables"
									class="font-medium text-blue-600 hover:underline dark:text-blue-500"
								>
									Edit
								</a>
							</TableBodyCell>
						</TableBodyRow>
					{/each}
				</TableBody>
			</Table>
		{/await}
	</span>
	<button
		class="text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
		on:click={async () => await deleteAllCallls(db)}
		>Remove all Calls
	</button>
</main>

<style>
	.header {
		display: flex;
		justify-content: center;
		align-items: center;
	}
	a {
		padding: 1rem;
		font-size: 1rem;
	}
	.content {
		display: flex;
		justify-content: center;
	}
</style>
