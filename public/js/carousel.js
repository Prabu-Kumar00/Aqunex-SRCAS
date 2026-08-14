// =============================================
// R-TECH Carousel - INSTANT LOAD FIX
// =============================================

let slideIndex = 1;
let autoSlideTimer;

// ✅ FIX: Wait for DOM to be ready before initializing
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing carousel...');
  showSlides(slideIndex);
  startAutoSlide();
  console.log('✅ Carousel ready!');
});

// Auto-slide every 5 seconds
function startAutoSlide() {
  autoSlideTimer = setInterval(() => {
    changeSlide(1);
  }, 4000);
}

// Reset auto-slide timer when user interacts
function resetAutoSlide() {
  clearInterval(autoSlideTimer);
  startAutoSlide();
}

// Navigate to next/previous slide
function changeSlide(n) {
  showSlides(slideIndex += n);
  resetAutoSlide();
}

// Navigate to specific slide (for dot navigation)
function currentSlide(n) {
  showSlides(slideIndex = n);
  resetAutoSlide();
}

// Show slides function
function showSlides(n) {
  const slides = document.getElementsByClassName("hero-slide");
  const dots = document.getElementsByClassName("dot");
  
  if (!slides.length || !dots.length) {
    console.error('❌ Carousel elements not found!');
    return;
  }
  
  // Loop back to first/last slide
  if (n > slides.length) { slideIndex = 1; }
  if (n < 1) { slideIndex = slides.length; }
  
  // Hide all slides
  for (let i = 0; i < slides.length; i++) {
    slides[i].classList.remove("active");
    slides[i].style.display = "none";
  }
  
  // Remove active from all dots
  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.remove("active");
  }
  
  // Show current slide with smooth transition
  slides[slideIndex - 1].style.display = "block";
  // Force reflow to ensure animation triggers
  slides[slideIndex - 1].offsetHeight;
  slides[slideIndex - 1].classList.add("active");
  dots[slideIndex - 1].classList.add("active");
}

// Pause carousel on hover
const carousel = document.querySelector('.hero-carousel');
if (carousel) {
  carousel.addEventListener('mouseenter', () => {
    clearInterval(autoSlideTimer);
  });
  
  carousel.addEventListener('mouseleave', () => {
    startAutoSlide();
  });
}

// Mobile swipe support
let touchStartX = 0;
let touchEndX = 0;

if (carousel) {
  carousel.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });

  carousel.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });
}

function handleSwipe() {
  if (touchEndX < touchStartX - 50) {
    changeSlide(1); // Swipe left - next slide
  }
  if (touchEndX > touchStartX + 50) {
    changeSlide(-1); // Swipe right - previous slide
  }
}
