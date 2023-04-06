import { initializeApp } from 'firebase/app';

import {
	doc,
	getFirestore,
	getDoc,
	updateDoc,
	collection,
	addDoc,
	onSnapshot
} from 'firebase/firestore';

function initDB(config) {
	const app = initializeApp(config);
	const db = getFirestore(app);

	return db;
}

const addOfferCandidate = async (callRef, candidate, isCaller = false) => {
	const docSnap = await getDoc(callRef);
	const call = docSnap.data();

	const candidates = isCaller ? call.offerCandidates : call.answerCandidates;

	candidates.push(candidate.toJSON());

	await updateDoc(callRef, call);
};

const insertCall = async (db, offer) => {
	console.log('Send offer', offer);

	const offerCandidates = [];
	const answerCandidates = [];

	const callRef = await addDoc(collection(db, 'calls'), {
		offer,
		offerCandidates,
		answerCandidates
	});
	const docSnap = await getDoc(callRef);

	const call = docSnap.data();

	return { ...call, id: callRef.id };
};

const updateCallDB = async (callDoc, answer) => {
	// Update the original record
	await updateDoc(callDoc, { answer });
};

const getCallDoc = (db, callId) => {
	return doc(db, 'calls', callId);
};

const getOffer = async (db, callId) => {
	const callDoc = getCallDoc(db, callId);
	const call = await getDoc(callDoc);
	const offer = call.data().offer;

	return { callDoc, offer };
};

const listenToCallChanges = (db, callId, callback) => {
	const unsubCaller = onSnapshot(getCallDoc(db, callId), async (doc) => {
		const call = doc.data();

		callback(call);
	});

	return unsubCaller;
};

export {
	initDB,
	addOfferCandidate,
	insertCall,
	updateCallDB,
	getOffer,
	getCallDoc,
	listenToCallChanges
};
