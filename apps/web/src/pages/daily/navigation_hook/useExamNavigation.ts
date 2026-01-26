import { useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";

export function useExamNavigationGuard(
    shouldBlock: boolean
) {
    const blocker = useBlocker(shouldBlock);
    const handledRef = useRef(false);

    useEffect(() => {
        console.group("[ExamGuard]");
        console.log("shouldBlock:", shouldBlock);
        console.log("blocker.state:", blocker.state);
        console.log("handledRef:", handledRef.current);
        console.groupEnd();

        if (blocker.state !== "blocked") return;
        if (handledRef.current) {
            console.warn("[ExamGuard] Already handled this block");
            return;
        }

        handledRef.current = true;

        const confirmLeave = window.confirm(
            "You have unsaved progress, all you progress will be lost. Are you sure you want to leave?"
        );

        console.log("[ExamGuard] confirmLeave:", confirmLeave);

        if (!confirmLeave) {
            console.log("[ExamGuard] User cancelled navigation");
            handledRef.current = false;
            blocker.reset();
            return;
        }

        blocker.proceed();
    }, [blocker, shouldBlock]);
}
