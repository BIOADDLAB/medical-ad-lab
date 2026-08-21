'use client';

import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

export const firebaseReady = Boolean(config.apiKey && config.projectId && config.storageBucket);

let cached: { app: FirebaseApp; auth: Auth; db: Firestore; storage: FirebaseStorage } | null = null;

/** 환경변수가 없으면 null. 관리자 화면은 이때 POC 모드로 동작한다. */
export function getFirebase() {
    if (!firebaseReady) return null;
    if (!cached) {
        const app = getApps()[0] ?? initializeApp(config);
        cached = { app, auth: getAuth(app), db: getFirestore(app), storage: getStorage(app) };
    }
    return cached;
}
