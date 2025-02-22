let currentIndex = 0;

function moveSlide(step) {
    const slides = document.querySelectorAll('.carousel-item');
    slides[currentIndex].classList.remove('active');
    currentIndex = (currentIndex + step + slides.length) % slides.length;
    slides[currentIndex].classList.add('active');
}