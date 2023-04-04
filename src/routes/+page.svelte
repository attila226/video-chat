<script>
    import { onMount } from 'svelte';
    // Import the functions you need from the SDKs you need
    import { initializeApp } from "firebase/app";
    import { getFirestore, collection, addDoc, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';

    import { PUBLIC_FIREBASE_CONFIG } from '$env/static/public'

    // Your web app's Firebase configuration
    const firebaseConfig = JSON.parse(PUBLIC_FIREBASE_CONFIG);

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    let localSource = null;
    let remoteSource = null;
    let cameras = [];
    let value = null;
    let isCameraWorking = true;
    let callId = '';

    const getVideo = async (camera) =>{
        try{
            const videoConstaints = camera ? { deviceId: { exact: camera.deviceId } }: true;
            return await navigator.mediaDevices.getUserMedia({video: videoConstaints, audio: false });
        }
        catch(error){
            console.log(error);
            throw new Error('Camera not available');
        }
    }

    const camerUpdated = async () => {
        isCameraWorking = true;

        try {
            localSource.srcObject = await getVideo(value);
        }
        catch(error){
            console.log('camerUpdated error', error);
            isCameraWorking = false;
        }
        
    }

    // https://webrtc.org/getting-started/peer-connections
    function createPeerConnection(){
        const config = {
            iceServers: [
                {
                urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
                },
            ],
            iceCandidatePoolSize: 10,
            configuration: {
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            },
        };

        return new RTCPeerConnection(config);
    }

    const createOffer = async () => {
        const offerOptions = { offerToReceiveAudio: true, offerToReceiveVideo: true};
        const peerConnection = createPeerConnection();

        const offer = await peerConnection.createOffer(offerOptions);
        await peerConnection.setLocalDescription(offer);

        const roomWithOffer = {
            sdp: offer.sdp,
            type: offer.type,
        };

        return { roomWithOffer, peerConnection };
    }

    const addOfferCandidate = async (callRef, candidate, isCaller) => {
        const docSnap = await getDoc(callRef);
        const call = docSnap.data();

        const candidates = isCaller ? call.offerCandidates : call.answerCandidates;

        candidates.push(candidate.toJSON() );
        const updatedCandidates = isCaller ? { offerCandidates: candidates } : { answerCandidates: candidates };

        await updateDoc(callRef, call);
    }

    const createCall = async (offer) => {
        console.log('Send offer', offer);

        const offerCandidates = []; 
        const answerCandidates = []

        const callRef = await addDoc(collection(db, "calls"), { offer, offerCandidates, answerCandidates });
        const docSnap = await getDoc(callRef);

        const call = docSnap.data();

        return { ...call, id: callRef.id };
    }

    const startCall = async () => {
        let answerCandidatesCount = 0;
        let answerInitiated = false;
        // Create the WebRTC offer and peer connection
        const { roomWithOffer: offer, peerConnection } = await createOffer();

        // Add the call to the DB
        let call = await createCall(offer);
        callId = call.id;

        // Send the video and audio tracks to the peer connection
        localSource.srcObject.getTracks().forEach(track => {
            console.log('Add local tracks to peerConnection', track);
            peerConnection.addTrack(track, localSource.srcObject);
        });

        // Listen for remote tracks
        peerConnection.ontrack = event => {
            console.log('get remote track', event);
            event.streams[0].getTracks().forEach(track => {
                remoteSource.srcObject.addTrack(track);
            })
        }

        // Listen for remote ICE candidates
        peerConnection.onicecandidate = (event) => {
            console.log('caller onicecandidate', event);
            // If there are ice candidates, share them with the peer, so the peer can add them
            if(event.candidate){
                console.log(event.candidate.toJSON());

                addOfferCandidate(call, event.candidate, true);
            }
        };

        // Listen for changes to the call
        const unsub = onSnapshot(doc(db, "calls", callId), async (doc) => {
            const call = doc.data();

            console.log('Listening to call changes', call);
            // Listen for the addition of offerCandidates
            if(call.offerCandidates.length > 0){
                console.log('Caller Recieved offer canidates');
                answerCandidatesCount += 1;
                peerConnection.addIceCandidate(call.offerCandidates[answerCandidatesCount]);
            }
        });

    }

    // TODO: Consider just passing the ID, and then calling based on the ID, so we don't have to mess with this.
    const updateCallDB = async (callDoc, answer) => {
        console.log('Update DB with call answer', answer);

        // Update the original record
        await updateDoc(callDoc, { answer });
    }

    const getOffer = async (callId) => {
        const callsCollection = collection(db, 'calls');
        // const callsSnaptshot = await getDocs(callsCollection);
        const callDoc = doc(db, 'calls', callId);

        const call = await getDoc(callDoc);

        const offer = call.data().offer;

        console.log('getOffer', offer);

        return { callDoc, offer } ;
    }

    const answerCall = async () => {
        const peerConnection = createPeerConnection();
        let answerCandidatesCount = 1;

        const { callDoc, offer: offerDescription } = await getOffer(callId);

        // Get candidates for caller, save to db
        peerConnection.onicecandidate = (event) => {
            // If there are ice candidates, share them with the peer, so the peer can add them
            if(event.candidate){
                console.log('answer peerConnection.onicecandidate', event.candidate.toJSON());
                addOfferCandidate(callDoc, event.candidate, false);
            }
        };

        const remoteDescription = new RTCSessionDescription(offerDescription)
        peerConnection.setRemoteDescription(remoteDescription);

        const answerDescription = await peerConnection.createAnswer({ offerToReceiveAudio: true, offerToReceiveVideo: true});
        await peerConnection.setLocalDescription(answerDescription);

        const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
        };

        await updateCallDB(callDoc, answer);
        
        // Listen for changes to the call
        const unsub = onSnapshot(doc(db, "calls", callId), async (doc) => {
            const call = doc.data();

            console.log('Listening to call changes', call);

            // Listen for the addition of answerCandidates
            // TODO: Check answerCandidatesCount so that we only run this on answerCandidates changes
            if(call.answerCandidates){ // && answerCandidates.count != answerCandidatesCount
                console.log('Responded recieved ice candidate');
                peerConnection.addIceCandidate(call.answerCandidates[answerCandidatesCount]);
                answerCandidatesCount++;
            }
        });

        console.log('Answer finished');
    }

    onMount(async () => {
        const devices = await navigator.mediaDevices?.enumerateDevices();
        cameras = devices.filter(device => device.kind === 'videoinput');

        value = cameras[1];

        try{
            localSource.srcObject = await getVideo(value);
        }
        catch(err){
            console.log(err);
            isCameraWorking = false;
        }
        
        // TODO: Remove this once we have the video coming from the peer connection
        remoteSource.srcObject = new MediaStream();
        // remoteSource.srcObject = await getVideo(cameras[2]);
    });

</script>
<div>
    <span>
        <h3>Local Stream</h3>
        <div>
            <select bind:value on:change="{() => camerUpdated()}" >
                {#each cameras as camera}
                    <option value={camera}>
                        {camera.label}
                    </option>
                {/each}
            </select>
        </div>

        {#if !isCameraWorking}
            <img alt="Camera not working" src="/NoVideo.png">
        {/if}

        <video bind:this={localSource} autoplay playsinline>
            <track kind="captions">
        </video>

        <button on:click={startCall}>Start Call</button>

        <input type="text" value={callId} />

        <button on:click={answerCall}>Answer Call</button>

        <h3>Remote Stream</h3>
        <video bind:this={remoteSource} autoplay playsinline>
            <track kind="captions">
        </video>
    </span>
</div>