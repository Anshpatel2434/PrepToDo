import { useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";

export function useExamNavigationGuard(
    shouldBlock: boolean
) {
    const blocker = useBlocker(shouldBlock);
    const handledRef = useRef(false);

    useEffect(() => {
        if (blocker.state !== "blocked") return;
        if (handledRef.current) {
            return;
        }

        handledRef.current = true;

        const confirmLeave = window.confirm(
            "You have unsaved progress, all you progress will be lost. Are you sure you want to leave?"
        );

        if (!confirmLeave) {
            handledRef.current = false;
            blocker.reset();
            return;
        }

        blocker.proceed();
    }, [blocker, shouldBlock]);
}
