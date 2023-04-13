// https://webrtc.org/getting-started/peer-connections
function createPeerConnection() {
	const config = {
		iceServers: [
			{
				urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
			},
			{
				urls: 'turn:turn.google.com:19302',
				username: 'any-non-empty-string',
				credential: 'any-non-empty-string'
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

const createOffer = async (peerConnection) => {
	const offerOptions = { offerToReceiveAudio: true, offerToReceiveVideo: true };

	const offerDescription = await peerConnection.createOffer(offerOptions);
	await peerConnection.setLocalDescription(offerDescription);

	const offer = {
		sdp: offerDescription.sdp,
		type: offerDescription.type
	};

	return offer;
};

export { createPeerConnection, createOffer };
