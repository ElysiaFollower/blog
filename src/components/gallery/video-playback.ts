/** Environmental pauses must not overwrite choices made through native controls. */
export function manageVideoPlayback(video: HTMLVideoElement, canPlay: () => boolean, reduceMotion: () => boolean) {
    let intent: "auto" | "play" | "pause" = "auto";
    let pendingPauses = 0;
    const pendingPlays = new Set<symbol>();
    let resumeAt: number | undefined;

    function pause() {
        if (!video.paused) {
            pendingPauses++;
            video.pause();
        }
    }
    function update() {
        if (!canPlay() || !video.hasAttribute("src")) {
            pause();
            return;
        }
        if (resumeAt !== undefined && video.readyState < 1) {
            // Restore the paused frame too; preload=none would otherwise wait for play().
            if (video.paused && video.preload === "none") {
                video.preload = "metadata";
                video.load();
            }
            return;
        }
        if (intent === "pause" || (intent === "auto" && reduceMotion())) {
            pause();
            return;
        }
        if (!video.paused || pendingPlays.size) return;
        const request = Symbol();
        pendingPlays.add(request);
        void video.play().catch(() => {
            // Rejected autoplay has no play event; a later user action stays distinguishable.
            pendingPlays.delete(request);
        });
    }
    video.addEventListener("play", () => {
        const request = pendingPlays.values().next().value;
        if (request) pendingPlays.delete(request);
        else intent = "play";
    });
    video.addEventListener("pause", () => {
        if (pendingPauses) pendingPauses--;
        else intent = "pause";
    });
    video.addEventListener("loadedmetadata", () => {
        if (resumeAt !== undefined) {
            const position = Number.isFinite(video.duration) ? Math.min(resumeAt, video.duration) : resumeAt;
            resumeAt = undefined;
            try { video.currentTime = position; }
            catch { /* Non-seekable streams still retain their native playback controls. */ }
        }
        update();
    });
    return {
        update,
        pause,
        release() {
            if (!video.hasAttribute("src")) return;
            if (resumeAt === undefined) resumeAt = video.currentTime;
            pause();
            video.removeAttribute("src");
            video.load();
        },
    };
}
