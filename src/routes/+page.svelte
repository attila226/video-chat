<script>
    import { onMount } from 'svelte';
    let localSource = null;
    let remoteSource = null;
    let cameras = [];
    let value = null;
    let isCameraWorking = true;

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

    const sendOffer = (offer) => {
        console.log('Send offer', offer)

        // Just save locally for now. 
        localStorage.setItem("offer", JSON.stringify(offer));
    }


    const startCall = async () => {
        // Share the offer with the peer, via Firebase, etc
        const { roomWithOffer: offer, peerConnection } = await createOffer();

        // Share the offer information
        sendOffer(offer);

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
            // If there are ice candidates, share them with the peer, so the peer can add them
            // peerConnection.addIceCandidate(e.candidate)
            if(event.candidate){
                console.log(event.candidate.toJSON());
            }
        };

        // Listen for remote answer (For now we are cheating by getting a hardcoded answer)
        setTimeout(async () => {
            try{
                console.log('Caller peerConnection.setRemoteDescription');
                const answer = new RTCSessionDescription(getOffer());
                await peerConnection.setRemoteDescription(answer);
            }
            catch(e){
                console.error(e);
            }
            
        }, 5000);
    }

    const sendReponse = (answer) => {
        console.log('Send answer', answer)

        // Just save locally for now. 
        localStorage.setItem("offerResponse", JSON.stringify(answer));
    }

    const getOffer = () => {
        return JSON.parse(localStorage.getItem("offer"));
    }

    const answerCall = async () => {
        const peerConnection = createPeerConnection();

        // Get candidates for caller, save to db
        peerConnection.onicecandidate = (event) => {
            // If there are ice candidates, share them with the peer, so the peer can add them
            // peerConnection.addIceCandidate(e.candidate)
            if(event.candidate){
                console.log(event.candidate.toJSON());
                peerConnection.addIceCandidate(event.candidate.toJSON());
            }
        };

        const offerDescription = getOffer();

        const remoteDescription = new RTCSessionDescription(offerDescription)
        peerConnection.setRemoteDescription(remoteDescription);

        const answerDescription = await peerConnection.createAnswer({ offerToReceiveAudio: true, offerToReceiveVideo: true});
        await peerConnection.setLocalDescription(answerDescription);

        const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
        };

        sendReponse(answer);

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

        <button on:click={answerCall}>Answer Call</button>

        <h3>Remote Stream</h3>
        <video bind:this={remoteSource} autoplay playsinline>
            <track kind="captions">
        </video>
    </span>
</div>