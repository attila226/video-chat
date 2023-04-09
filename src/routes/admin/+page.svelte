<script>
	import { initDB, deleteAllCallls } from '../../lib/data';

	// Your web app's Firebase configuration
	import { PUBLIC_FIREBASE_CONFIG } from '$env/static/public';

	const firebaseConfig = JSON.parse(PUBLIC_FIREBASE_CONFIG);

	// Initialize Firebase
	const db = initDB(firebaseConfig);
</script>

<div>
	<span>
		<button
			class="text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900"
			on:click={async () => await deleteAllCallls(db)}
			>Remove all Calls
		</button>
	</span>
</div>
