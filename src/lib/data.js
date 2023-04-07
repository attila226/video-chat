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

const createCall = async (db) => {
	const offerCandidates = [];
	const answerCandidates = [];

	const callRef = await addDoc(collection(db, 'calls'), {
		offerCandidates,
		answerCandidates
	});

	return callRef;
};

const addOfferCandidate = async (callRef, candidate, isCaller = false) => {
	const docSnap = await getDoc(callRef);
	const call = docSnap.data();

	const candidates = isCaller ? call.offerCandidates : call.answerCandidates;

	candidates.push(candidate.toJSON());

	await updateDoc(callRef, call);
};

const updateCallWithOffer = async (callRef, offer) => {
	console.log('Update call with offer', offer);

	await updateDoc(callRef, { offer });

	const docSnap = await getDoc(callRef);
	const call = docSnap.data();

	return { ...call, id: callRef.id };
};

const updateCallWithAnswer = async (callDoc, answer) => {
	console.log('Update call with answer', answer);

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
	createCall,
	updateCallWithOffer,
	updateCallWithAnswer,
	getOffer,
	getCallDoc,
	listenToCallChanges
};
