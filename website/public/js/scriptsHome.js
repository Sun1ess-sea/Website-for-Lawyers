document.addEventListener("DOMContentLoaded", function () {
    const header = document.getElementById("main-header");
    const isHomePage = window.location.pathname === "/" || window.location.pathname === "/index.html";

    if (isHomePage) {
        // Только на главной странице анимация прокрутки для header
        window.addEventListener("scroll", function () {
            if (window.scrollY > window.innerHeight * 0.8) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }
        });
    } else {
        // На всех других страницах сразу применяем класс scrolled
        header.classList.add("scrolled");
    }

    // Функция для анимации чисел
    function animateCountUp(el, target) {
        let start = 0;
        let duration = target < 100 ? 1800 : 800; // Маленькие числа: 1.8 сек, большие числа: 0.8 сек
        let steps = target < 100 ? 90 : 40; // Маленькие числа: 90 шагов, большие: 40 шагов
        let step = Math.max(1, Math.ceil(target / steps)); 
        let interval = duration / steps;
    
        let animation = setInterval(() => {
            start += step;
            if (start >= target) {
                el.textContent = target;
                clearInterval(animation);
            } else {
                el.textContent = start;
            }
        }, interval);
    }
    

    function startCounting() {
        document.querySelectorAll(".info-block h1").forEach(el => {
            let target = parseInt(el.dataset.target); // Используем data-атрибут
            if (!isNaN(target)) {
                animateCountUp(el, target);
            }
        });
    }


    let infoBlock = document.querySelector(".info-block");
    let observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startCounting();
                observer.disconnect(); // Запускаем анимацию только 1 раз
            }
        });
    }, { threshold: 0.5 });

    if (infoBlock) {
        observer.observe(infoBlock);
    }
    
    $(document).ready(function() {
        var owl = $(".owl-carousel");
      
        owl.owlCarousel({
          loop: true,         
          margin: 0,
          dots: false,
          responsive: {
            0: {
              items: 1,
              dots: true,    
            },
            600: {
              items: 2,
              dots: true,     
            },
            1000: {
              items: 4,
              dots: false      
            }
          }
        });
      
        $(".carousel-prev").click(function() {
          owl.trigger("prev.owl.carousel");
        });
      
        $(".carousel-next").click(function() {
          owl.trigger("next.owl.carousel");
        });
    });

    const form = document.querySelector('form[action="/submit"][method="post"]');

    if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const urlEncodedData = new URLSearchParams(formData);

        try {
        const response = await fetch('/submit', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            },
            body: urlEncodedData.toString(),
        });

        const result = await response.json();

        if (result.status === 'success') {
            Swal.fire({
            icon: 'success',
            title: 'Благодарим за вопрос',
            text: result.message,
            confirmButtonText: 'ОК'
            });
            form.reset();
        } else {
            Swal.fire({
            icon: 'error',
            title: 'Ошибка!',
            text: result.message,
            confirmButtonText: 'ОК'
            });
        }
        } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Ошибка!',
            text: 'Произошла ошибка при отправке. Попробуйте позже.',
            confirmButtonText: 'ОК'
        });
        }
    });
    }



});
