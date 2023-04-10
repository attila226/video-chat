<script>
	import { goto } from '$app/navigation';
	import { getVideo } from '$lib/camera';
	import { initDB, isValidCall } from '$lib/data';

	import { PUBLIC_FIREBASE_CONFIG } from '$env/static/public';

	const firebaseConfig = JSON.parse(PUBLIC_FIREBASE_CONFIG);

	// Initialize Firebase
	const db = initDB(firebaseConfig);

	let callId = '';
	let isInvalidId = false;
	let showModal = false;

	const startMeeting = async () => {
		await getVideo();
		goto('/call/start');
	};

	const toggleModal = () => {
		showModal = !showModal;
	};

	const joinMeeting = async () => {
		const route = `/call/${callId}`;
		await getVideo();
		const isValid = await isValidCall(db, callId);
		if (isValid) {
			isInvalidId = false;
			goto(route);
		} else {
			isInvalidId = true;
		}
	};
</script>

<div class="container">
	<div class="header">
		<p class="text-6xl text-gray-900 dark:text-white">skoom</p>
	</div>

	<div class="start">
		<button
			on:click={startMeeting}
			class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			>Start a Metting</button
		>
	</div>

	<div class="join">
		<!-- Main modal -->
		{#if showModal}
			<div
				tabindex="-1"
				aria-hidden="true"
				class="fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] md:h-full"
			>
				<div class="relative w-full h-full max-w-md md:h-auto">
					<!-- Modal content -->
					<div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
						<button
							on:click={toggleModal}
							type="button"
							class="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white"
						>
							<svg
								aria-hidden="true"
								class="w-5 h-5"
								fill="currentColor"
								viewBox="0 0 20 20"
								xmlns="http://www.w3.org/2000/svg"
								><path
									fill-rule="evenodd"
									d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
									clip-rule="evenodd"
								/></svg
							>
							<span class="sr-only">Close modal</span>
						</button>
						<div class="px-6 py-6 lg:px-8">
							<h3 class="mb-4 text-xl font-medium text-gray-900 dark:text-white">Join Meeting</h3>
							<form class="space-y-6" action="#">
								<div>
									<input
										type="text"
										bind:value={callId}
										class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white"
										placeholder="Meeting ID"
										required
									/>
								</div>
								{#if isInvalidId}
									<p id="filled_error_help" class="mt-2 text-xs text-red-600 dark:text-red-400">
										<span class="font-medium">Not a valid meeting ID</span>
									</p>
								{/if}
								<button
									on:click={joinMeeting}
									type="submit"
									class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
									>Join</button
								>
							</form>
						</div>
					</div>
				</div>
			</div>
		{/if}
		<div class="grid gap-6 mb-6 md:grid-cols-2">
			<div>
				<button
					on:click={toggleModal}
					class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
					>Join a Meeting</button
				>
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	.container {
		display: grid;
		grid-template-columns: 50% 50%;
		grid-auto-rows: minmax(100px, auto);
		grid-gap: 10px;
	}

	.header {
		grid-row: 1;
		grid-column: 1 / 3;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.start {
		grid-row: 2;
		grid-column: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.join {
		grid-row: 2;
		grid-column: 2;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
