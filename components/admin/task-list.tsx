'use client';

import { FormEvent, useEffect, useState } from 'react';
import { addTask, loadTasks, removeTask, toggleTask, type AdminTask } from '@/lib/admin-store';
import { firebaseReady } from '@/lib/firebase';

export function TaskList({ onCount }: { onCount?: (left: number) => void }) {
    const [tasks, setTasks] = useState<AdminTask[]>([]);
    const [ready, setReady] = useState(false);

    const refresh = async () => {
        const next = await loadTasks();
        setTasks(next);
        setReady(true);
        onCount?.(next.filter((task) => !task.done).length);
    };

    useEffect(() => {
        if (!firebaseReady) return;
        let alive = true;
        loadTasks()
            .catch(() => [] as AdminTask[])
            .then((next) => {
                if (!alive) return;
                setTasks(next);
                setReady(true);
                onCount?.(next.filter((task) => !task.done).length);
            });
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!firebaseReady)
        return (
            <p className="m-0 rounded-lg bg-soft p-3 text-[11px] leading-relaxed text-muted">
                Firebase 환경변수를 넣으면 할 일을 저장할 수 있습니다.
            </p>
        );

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const input = event.currentTarget.elements.namedItem('label') as HTMLInputElement;
        const label = input.value.trim();
        if (!label) return;
        input.value = '';
        await addTask(label);
        await refresh();
    };

    return (
        <>
            <form onSubmit={submit} className="mt-4 flex gap-2">
                <input
                    name="label"
                    placeholder="할 일 추가"
                    className="h-10 flex-1 rounded-[9px] border border-line-strong px-3 text-xs outline-none focus:border-brand"
                />
                <button type="submit" className="h-10 rounded-[9px] bg-brand px-4 text-xs font-bold text-white">
                    추가
                </button>
            </form>
            {ready && !tasks.length && <p className="mt-4 text-xs text-muted">등록된 할 일이 없습니다.</p>}
            <ul className="mt-4 grid list-none gap-3 p-0 text-xs text-slate">
                {tasks.map((task) => (
                    <li className="flex items-center gap-2.5 border-b border-line pb-3" key={task.id}>
                        <button
                            type="button"
                            aria-label={task.done ? '완료 취소' : '완료 표시'}
                            onClick={async () => {
                                await toggleTask(task.id, !task.done);
                                await refresh();
                            }}
                            className={`h-4 w-4 shrink-0 rounded ${task.done ? 'bg-brand' : 'border border-line-strong'}`}
                        />
                        <span className={`flex-1 ${task.done ? 'line-through opacity-50' : ''}`}>{task.label}</span>
                        <button
                            type="button"
                            aria-label="삭제"
                            onClick={async () => {
                                await removeTask(task.id);
                                await refresh();
                            }}
                            className="text-muted"
                        >
                            ×
                        </button>
                    </li>
                ))}
            </ul>
        </>
    );
}
