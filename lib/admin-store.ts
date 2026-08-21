'use client';

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    setDoc,
    updateDoc,
} from 'firebase/firestore';
import { getFirebase } from '@/lib/firebase';

export type SiteSettings = { gaId: string; pixelId: string; contactEmail: string };
export type AdminTask = { id: string; label: string; done: boolean };

const EMPTY: SiteSettings = { gaId: '', pixelId: '', contactEmail: '' };

export async function loadSettings(): Promise<SiteSettings> {
    const firebase = getFirebase();
    if (!firebase) return EMPTY;
    const snapshot = await getDoc(doc(firebase.db, 'settings', 'site'));
    return { ...EMPTY, ...(snapshot.data() as Partial<SiteSettings> | undefined) };
}

export async function saveSettings(settings: SiteSettings) {
    const firebase = getFirebase();
    if (!firebase) throw new Error('Firebase 환경변수가 없습니다.');
    await setDoc(doc(firebase.db, 'settings', 'site'), settings, { merge: true });
}

export async function loadTasks(): Promise<AdminTask[]> {
    const firebase = getFirebase();
    if (!firebase) return [];
    const snapshot = await getDocs(query(collection(firebase.db, 'tasks'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<AdminTask, 'id'>) }));
}

export async function addTask(label: string) {
    const firebase = getFirebase();
    if (!firebase) throw new Error('Firebase 환경변수가 없습니다.');
    await addDoc(collection(firebase.db, 'tasks'), { label, done: false, createdAt: new Date().toISOString() });
}

export async function toggleTask(id: string, done: boolean) {
    const firebase = getFirebase();
    if (!firebase) return;
    await updateDoc(doc(firebase.db, 'tasks', id), { done });
}

export async function removeTask(id: string) {
    const firebase = getFirebase();
    if (!firebase) return;
    await deleteDoc(doc(firebase.db, 'tasks', id));
}
