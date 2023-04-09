<script>
	let callId = '';
</script>

<div class="container">
	<div class="header">
		<p class="text-6xl text-gray-900 dark:text-white">Welcome</p>
	</div>

	<div class="start">
		<a href="/call/start">
			<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
				>Start Call</button
			>
		</a>
	</div>

	<div class="join">
		<form>
			<div class="grid gap-6 mb-6 md:grid-cols-2">
				<div>
					<input
						type="text"
						class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						value={callId}
						placeholder="callId"
						required
					/>
					<a href="/call/{callId}">
						<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
							>Join Call</button
						></a
					>
				</div>
			</div>
		</form>
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
