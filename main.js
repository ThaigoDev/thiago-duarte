document.addEventListener('DOMContentLoaded', () => {

    // Lógica para o menu hamburger
    const menuToggle = document.getElementById('menu-toggle');
    const navbar = document.querySelector('.navbar');

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navbar.classList.toggle('active');
    });

    // Fechar o menu ao clicar em um link da navbar
    const navLinks = document.querySelectorAll('.navbar a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navbar.classList.contains('active')) {
                menuToggle.classList.remove('active');
                navbar.classList.remove('active');
            }
        });
    });

    // Adicionar sombra ao header ao rolar
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
        } else {
            header.style.boxShadow = 'none';
        }
    });

});
