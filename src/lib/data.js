import { initializeApp } from 'firebase/app';

import {
	doc,
	getFirestore,
	getDoc,
	updateDoc,
	collection,
	addDoc,
	deleteDoc,
	onSnapshot,
	query,
	getDocs
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
	await updateDoc(callRef, { offer });

	const docSnap = await getDoc(callRef);
	const call = docSnap.data();

	return { ...call, id: callRef.id };
};

const updateCallWithAnswer = async (callDoc, answer) => {
	await updateDoc(callDoc, { answer });
};

const getCallDoc = (db, callId) => {
	return doc(db, 'calls', callId);
};

const isValidCall = async (db, callId) => {
	const callDoc = getCallDoc(db, callId);
	const call = await getDoc(callDoc);
	const data = call.data();

	return data !== undefined;
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

const deleteCollectionById = async (db, id) => {
	await deleteDoc(doc(db, 'calls', id));
};

// Caution, deletes all calls
const deleteAllCallls = async (db) => {
	const q = query(collection(db, 'calls'));

	const querySnapshot = await getDocs(q);
	querySnapshot.forEach(async (doc) => {
		await deleteCollectionById(db, doc.id);
	});
};

export {
	initDB,
	addOfferCandidate,
	createCall,
	updateCallWithOffer,
	updateCallWithAnswer,
	getOffer,
	isValidCall,
	getCallDoc,
	listenToCallChanges,
	deleteAllCallls
};
