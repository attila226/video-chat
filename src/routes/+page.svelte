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
	import { cameraUpdated, getCameraList, getVideo } from '../lib/camera';
	import { createPeerConnection, createOffer } from '../lib/webRTC';

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
		localSource.srcObject.getTracks().forEach((track) => {
			console.log('Add local tracks to peerConnection', track);
			peerConnection.addTrack(track, localSource.srcObject);
		});

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
		remoteSource.srcObject = await getVideo(cameras[1]);
	});
</script>

<div>
	<span>
		<h3>Local Stream</h3>
		<div>
			<select
				bind:value
				on:change={async () => (isCameraWorking = await cameraUpdated(localSource, value))}
			>
				{#each cameras as camera}
					<option value={camera}>
						{camera.label}
					</option>
				{/each}
			</select>
		</div>

		{#if !isCameraWorking}
			<img alt="Camera not working" src="/NoVideo.png" />
		{:else}
			<video bind:this={localSource} autoplay playsinline>
				<track kind="captions" />
			</video>
		{/if}

		<button
			on:click={async () => {
				callId = await startCall(callId);
			}}>Start Call</button
		>

		<input type="text" value={callId} />

		<button
			on:click={() => {
				answerCall(callId);
			}}>Answer Call</button
		>

		<h3>Remote Stream</h3>
		<video bind:this={remoteSource} autoplay playsinline>
			<track kind="captions" />
		</video>
	</span>
</div>
