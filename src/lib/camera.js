const getVideo = async (camera) => {
	try {
		const videoConstaints = camera ? { deviceId: { exact: camera.deviceId } } : true;
		return await navigator.mediaDevices.getUserMedia({ video: videoConstaints, audio: false });
	} catch (error) {
		throw new Error('Camera not available');
	}
};

export { getVideo };
