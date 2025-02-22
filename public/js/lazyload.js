// ✅ Toggle Tax Information
let taxSwitch = document.getElementById("toggle");
taxSwitch.addEventListener("click", () => {
    let taxinfo = document.getElementsByClassName("tax-info");
    for (let info of taxinfo) {
        info.style.display = (info.style.display !== "inline") ? "inline" : "none";
    }
});

// ✅ Lazy Loading Effect for Elements
document.addEventListener("DOMContentLoaded", () => {
    const elements = document.querySelectorAll(".fade-in");
    const images = document.querySelectorAll(".lazy-load");

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    elements.forEach(el => observer.observe(el));

    // ✅ Lazy Load Images
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.src = entry.target.dataset.src;
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    images.forEach(img => {
        img.dataset.src = img.src;
        img.src = "";
        imageObserver.observe(img);
    });
});

// ✅ Smooth Scrolling for Navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
            window.scrollTo({ top: target.offsetTop, behavior: "smooth" });
        }
    });
});