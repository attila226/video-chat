const getVideo = async (camera) => {
	try {
		const videoConstaints = camera ? { deviceId: { exact: camera.deviceId } } : true;
		return await navigator.mediaDevices.getUserMedia({ video: videoConstaints, audio: true });
	} catch (error) {
		throw new Error('Camera not available');
	}
};

const getCameraList = async () => {
	const devices = await navigator.mediaDevices?.enumerateDevices();
	const cameras = devices.filter((device) => device.kind === 'videoinput');

	return cameras;
};

const cameraUpdated = async (videoElement, camera) => {
	let isCameraWorking = true;

	try {
		videoElement.srcObject = await getVideo(camera);
	} catch (error) {
		console.log('cameraUpdated error', error);
		isCameraWorking = false;
	}

	return isCameraWorking;
};

export { cameraUpdated, getCameraList, getVideo };
