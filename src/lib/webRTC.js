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

const modifySdpBitrate = (sdp, bitrate = 1200) => {
	let arr = sdp.split('\r\n');

	arr.forEach((str, i) => {
		if (/^a=fmtp:\d*/.test(str)) {
			arr[i] =
				str +
				`;x-google-max-bitrate=${bitrate};x-google-min-bitrate=0;x-google-start-bitrate=${bitrate}`;
		} else if (/^a=mid:(1|video)/.test(str)) {
			arr[i] += `\r\nb=AS:${bitrate}`;
		}
	});

	return arr.join('\r\n');
};

export { createPeerConnection, createOffer };
