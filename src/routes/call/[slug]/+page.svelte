<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import {
		initDB,
		addOfferCandidate,
		createCall,
		updateCallWithOffer,
		updateCallWithAnswer,
		getOffer,
		listenToCallChanges
	} from '$lib/data';
	import { cameraUpdated, getCameraList, getVideo } from '$lib/camera';
	import { createPeerConnection, createOffer } from '$lib/webRTC';

	// Your web app's Firebase configuration
	import { PUBLIC_FIREBASE_CONFIG } from '$env/static/public';

	const firebaseConfig = JSON.parse(PUBLIC_FIREBASE_CONFIG);

	// Initialize Firebase
	const db = initDB(firebaseConfig);

	let localSource = null;
	let remoteSource = null;
	let cameras = [];
	let value = null;
	let isCameraWorking = true;
	let callId = '';

	let unsubCaller = () => {},
		unsubAnswer = () => {};

	// Clear Firebase references when leaving page
	onDestroy(() => {
		unsubCaller();
		unsubAnswer();
	});

	const startCall = async (callId) => {
		let callRef = await createCall(db);
		callId = callRef.id;
		let answerCandidatesCount = 0;
		let answerReceived = false;

		// Create the WebRTC offer and peer connection
		const peerConnection = createPeerConnection();
		const offer = await createOffer(peerConnection);

		// Listen for remote ICE candidates
		peerConnection.onicecandidate = (event) => {
			// If there are ice candidates, share them with the peer, so the peer can add them
			if (event.candidate) {
				addOfferCandidate(callRef, event.candidate, true);
			}
		};

		localSource.srcObject.getTracks().forEach((track) => {
			console.log('Add caller tracks to peerConnection', track);
			peerConnection.addTrack(track, localSource.srcObject);
		});

		// Listen for remote tracks
		peerConnection.ontrack = (event) => {
			console.log('Caller peerConnection.ontrack', event);
			event.streams[0].getTracks().forEach((track) => {
				remoteSource.srcObject.addTrack(track);
			});
		};

		// Add the call to the DB
		await updateCallWithOffer(callRef, offer);

		// Send the video and audio tracks to the peer connection

		// Listen for changes to the call
		unsubCaller = listenToCallChanges(db, callId, (call) => {
			// Listen for remote answer
			if (call.answer && !answerReceived) {
				answerReceived = true;
				// onicecandidate is not firing, indicating an issue with the peer connection
				const answerDescription = new RTCSessionDescription(call.answer);
				peerConnection.setRemoteDescription(answerDescription);
			}

			// Listen for the addition of offerCandidates
			if (call.answerCandidates?.length > answerCandidatesCount) {
				const candidate = new RTCIceCandidate(call.answerCandidates[answerCandidatesCount]);
				console.log('Caller add ice candidate', candidate);
				peerConnection.addIceCandidate(candidate);
				answerCandidatesCount++;
			}
		});

		return callId;
	};

	const answerCall = async (callId) => {
		const { callDoc, offer: offerDescription } = await getOffer(db, callId);

		const peerConnection = createPeerConnection();
		let offerCandidatesCount = 0;

		// Get candidates for caller, save to db
		peerConnection.onicecandidate = (event) => {
			// If there are ice candidates, share them with the peer, so the peer can add them
			if (event.candidate) {
				addOfferCandidate(callDoc, event.candidate, false);
			}
		};

		// Send the video and audio tracks to the peer connection
		localSource.srcObject.getTracks().forEach((track) => {
			console.log('Add answerer tracks to peerConnection', track);
			peerConnection.addTrack(track, localSource.srcObject);
		});

		// Pull tracks from remote stream, add to video stream
		peerConnection.ontrack = (event) => {
			console.log('Answerer peerConnection.ontrack', event);
			event.streams[0].getTracks().forEach((track) => {
				remoteSource.srcObject.addTrack(track);
			});
		};

		const remoteDescription = new RTCSessionDescription(offerDescription);
		peerConnection.setRemoteDescription(remoteDescription);

		const answerDescription = await peerConnection.createAnswer({
			offerToReceiveAudio: true,
			offerToReceiveVideo: true
		});
		await peerConnection.setLocalDescription(answerDescription);

		const answer = {
			type: answerDescription.type,
			sdp: answerDescription.sdp
		};

		await updateCallWithAnswer(callDoc, answer);

		// Listen for changes to the call
		unsubAnswer = listenToCallChanges(db, callId, (call) => {
			// Listen for the addition of answerCandidates
			if (call.offerCandidates?.length > offerCandidatesCount) {
				const candidate = new RTCIceCandidate(call.offerCandidates[offerCandidatesCount]);
				console.log('Answerer add ice candidate', candidate);
				peerConnection.addIceCandidate(candidate);
				offerCandidatesCount++;
			}
		});
	};

	onMount(async () => {
		cameras = await getCameraList();

		value = cameras[0];
		console.log('camera[0', value);

		await cameraUpdated(localSource, value);

		remoteSource.srcObject = new MediaStream();

		callId = $page.params.slug;

		if (callId === 'start') {
			callId = await startCall(callId);
		} else {
			answerCall(callId);
		}
	});
</script>

<div class="container">
	<div class="header">
		<label for="cameras" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
			>Camera</label
		>
		{#if cameras?.length > 1}
			<select
				id="cameras"
				class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
				bind:value
				on:change={async () => (isCameraWorking = await cameraUpdated(localSource, value))}
			>
				{#each cameras as camera}
					<option value={camera}>
						{camera.label}
					</option>
				{/each}
			</select>
		{:else if cameras?.length === 1}
			{cameras[0].label}
		{:else}
			No camera found
		{/if}
	</div>

	<div class="video1">
		{#if !isCameraWorking}
			<img alt="Camera not working" src="/NoVideo.png" />
		{:else}
			<video bind:this={localSource} autoplay muted playsinline>
				<track kind="captions" />
			</video>
		{/if}
	</div>

	<div class="video2">
		<video bind:this={remoteSource} autoplay playsinline>
			<track kind="captions" />
		</video>
	</div>

	<div class="controls">
		<p class="px-6 text-lg">
			<span class="font-medium">Meeting ID:</span>
			{callId === 'start' ? '_'.repeat(21) : callId}
		</p>
		<button
			on:click={() => {
				navigator.clipboard.writeText(callId);
			}}
			type="button"
			class="w-[56px] h-[56px] text-gray-500 bg-white rounded-full border border-gray-200 dark:border-gray-600 hover:text-gray-900 shadow-sm dark:hover:text-white dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 focus:ring-4 focus:ring-gray-300 focus:outline-none dark:focus:ring-gray-400"
		>
			<svg
				aria-hidden="true"
				class="w-6 h-6 mx-auto mt-px"
				fill="currentColor"
				viewBox="0 0 20 20"
				xmlns="http://www.w3.org/2000/svg"
				><path
					d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"
				/></svg
			>
			<span class="block mb-px text-xs font-medium">Share</span>
		</button>
	</div>
</div>

<style>
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
	}

	.video1 {
		grid-row: 2;
		grid-column: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.video2 {
		grid-row: 2;
		grid-column: 2;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.controls {
		grid-row: 3;
		grid-column: 1 / 3;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
