document.addEventListener("DOMContentLoaded", () => {
    const overlay = document.createElement("div");
    overlay.className = "image-overlay";

    const enlarged = document.createElement("img");
    overlay.appendChild(enlarged);
    document.body.appendChild(overlay);

    document.querySelectorAll("img").forEach(img => {
        img.addEventListener("click", () => {
            enlarged.src = img.src;
            overlay.style.display = "flex";
        });
    });

    overlay.addEventListener("click", () => {
            overlay.style.display = "none";
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            overlay.style.display = "none";
        }
    });
});
