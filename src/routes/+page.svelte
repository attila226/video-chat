<script>
	import { onMount, onDestroy } from 'svelte';
	import {
		initDB,
		addOfferCandidate,
		createCall,
		updateCallWithOffer,
		updateCallWithAnswer,
		getOffer,
		listenToCallChanges
	} from '../lib/data';
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

				localSource.srcObject.getTracks().forEach((track) => {
					console.log('Add local tracks to peerConnection', track);
					peerConnection.addTrack(track, localSource.srcObject);
				});
			}

			// Listen for the addition of offerCandidates
			if (call.answerCandidates?.length > 0) {
				const candidate = new RTCIceCandidate(call.answerCandidates[answerCandidatesCount]);
				console.log('Caller add ice candidate', candidate);
				peerConnection.addIceCandidate(candidate);
				answerCandidatesCount += 1;
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

		// Send the video and audio tracks to the peer connection
		remoteSource.srcObject.getTracks().forEach((track) => {
			console.log('Add remote tracks to peerConnection', track);
			peerConnection.addTrack(track, remoteSource.srcObject);
		});

		// Listen for changes to the call
		unsubAnswer = listenToCallChanges(db, callId, (call) => {
			// Listen for the addition of answerCandidates
			if (call.offerCandidates?.length > 0) {
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

		await cameraUpdated(localSource, value);

		remoteSource.srcObject = new MediaStream();
		remoteSource.srcObject = await getVideo(cameras[2]);
	});
</script>

<div class="container">
	<div class="header">
		<label for="cameras" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
			>Camera</label
		>
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

		<p class="text-lg text-gray-900 dark:text-white">Call {callId}</p>
	</div>

	<div class="video1">
		{#if !isCameraWorking}
			<img alt="Camera not working" src="/NoVideo.png" />
		{:else}
			<video bind:this={localSource} autoplay playsinline>
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
		<button
			class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			on:click={async () => {
				callId = await startCall(callId);
			}}>Start Call</button
		>

		<button
			class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			on:click={() => {
				answerCall(callId);
			}}>Answer Call</button
		>
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
