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
		<h3>Admin</h3>

		<button on:click={async () => await deleteAllCallls(db)}>Remove all Calls </button>
	</span>
</div>
