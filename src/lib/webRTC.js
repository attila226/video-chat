// https://webrtc.org/getting-started/peer-connections
function createPeerConnection() {
	const config = {
		iceServers: [
			{
				urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
			}
		],
		iceCandidatePoolSize: 10,
		configuration: {
			offerToReceiveAudio: true,
			offerToReceiveVideo: true
		}
	};

	return new RTCPeerConnection(config);
}

const createOffer = async () => {
	const offerOptions = { offerToReceiveAudio: true, offerToReceiveVideo: true };
	const peerConnection = createPeerConnection();

	const offer = await peerConnection.createOffer(offerOptions);
	await peerConnection.setLocalDescription(offer);

	const roomWithOffer = {
		sdp: offer.sdp,
		type: offer.type
	};

	return { roomWithOffer, peerConnection };
};

export { createPeerConnection, createOffer };
