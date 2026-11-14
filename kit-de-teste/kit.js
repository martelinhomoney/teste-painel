/* Lógica de demonstração das páginas de teste (quiz e botão da VSL).
   Isto NÃO é o rastreamento: o rastreamento vem do tracker.js do seu painel. */
(function () {
    'use strict';
    function byId(id) { return document.getElementById(id); }

    var steps = Array.prototype.slice.call(document.querySelectorAll('.step'));
    var intro = byId('intro');
    var quiz = byId('quiz');
    var fim = byId('fim');
    var current = 0;

    function show(index) {
        current = index;
        steps.forEach(function (step, i) { step.classList.toggle('on', i === index); });
    }

    function finish() {
        if (quiz) quiz.hidden = true;
        if (fim) fim.hidden = false;
        // Avisa o painel que o quiz terminou (o quiz de verdade faz isto na tela de resultado).
        if (window.PainelLucro && typeof window.PainelLucro.track === 'function') {
            window.PainelLucro.track('QuizComplete', {});
        }
        if (window.__plAvisar) window.__plAvisar('env', 'Quiz terminou (a página chamou PainelLucro.track("QuizComplete")).');
    }

    var start = byId('start');
    if (start && quiz && intro) {
        start.addEventListener('click', function () {
            intro.hidden = true;
            quiz.hidden = false;
            show(0);
        });
    }

    steps.forEach(function (step, index) {
        Array.prototype.forEach.call(step.querySelectorAll('[data-pl-quiz-answer]'), function (button) {
            button.addEventListener('click', function () {
                window.setTimeout(function () {
                    if (index < steps.length - 1) show(index + 1);
                    else finish();
                }, 200);
            });
        });
    });

    // Botão de compra que só aparece depois de 20 segundos de vídeo (como numa VSL de verdade).
    var video = document.querySelector('video');
    var cta = byId('cta-video');
    if (video && cta) {
        video.addEventListener('timeupdate', function () {
            if (video.currentTime >= 20) cta.hidden = false;
        });
    }
})();
