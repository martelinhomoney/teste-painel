/* ============================================================
   KIT DE TESTE DO PAINEL DE LUCRO
   Edite SOMENTE as 2 linhas abaixo e salve o arquivo.
   ============================================================ */
var PAINEL_URL = 'https://painel-lucro-ten.vercel.app';         // endereço do seu painel, sem "/" no final
var ID_DA_INSTALACAO = 'c914e010-7791-40ee-bd8a-2d584587eaf5';       // o ID que o painel mostra na instalação de TESTE
/* ============================================================
   Daqui para baixo não precisa mexer.
   ============================================================ */
(function () {
    'use strict';

    var CONSENTIMENTO_AUTOMATICO = true; // no teste, liga sozinho. No seu site real, use o aviso de cookies.
    var queue = [];
    var ultimos = {};
    var box = null;
    var list = null;

    function ready(fn) {
        if (document.body) fn();
        else document.addEventListener('DOMContentLoaded', fn, { once: true });
    }

    function buildBox() {
        if (box) return;
        box = document.createElement('div');
        box.id = 'pl-caixa';
        box.innerHTML =
            '<div class="pl-caixa-topo"><strong>Caixa de teste</strong>' +
            '<span><button type="button" id="pl-reiniciar" title="Apaga a identificação deste navegador e começa um teste novo">Novo teste</button>' +
            '<button type="button" id="pl-recolher">–</button></span></div>' +
            '<div class="pl-caixa-lista" id="pl-lista"></div>';
        document.body.appendChild(box);
        list = document.getElementById('pl-lista');
        document.getElementById('pl-recolher').addEventListener('click', function () {
            box.classList.toggle('pl-recolhida');
        });
        document.getElementById('pl-reiniciar').addEventListener('click', function () {
            try {
                [window.localStorage, window.sessionStorage].forEach(function (store) {
                    Object.keys(store).forEach(function (key) {
                        if (key.indexOf('painel-lucro:') === 0) store.removeItem(key);
                    });
                });
            } catch (error) { /* sem acesso ao armazenamento */ }
            location.reload();
        });
        queue.forEach(function (item) { render(item.kind, item.text); });
        queue = [];
    }

    function render(kind, text) {
        var line = document.createElement('div');
        line.className = 'pl-linha pl-' + kind;
        var hora = new Date().toLocaleTimeString('pt-BR');
        line.textContent = hora + '  ' + text;
        list.appendChild(line);
        list.scrollTop = list.scrollHeight;
    }

    function add(kind, text) {
        if (list) render(kind, text);
        else {
            queue.push({ kind: kind, text: text });
            ready(buildBox);
        }
    }
    window.__plAvisar = add;

    function detail(payload) {
        if (!payload) return '';
        if (payload.answer) return ' (resposta: ' + payload.answer + ')';
        if (payload.eventName === 'VideoProgress' && payload.percent != null) return ' ' + payload.percent + '%';
        if (payload.section) return ' (' + payload.section + ')';
        if (payload.percent != null) return ' ' + payload.percent + '%';
        return '';
    }

    function interceptar(original) {
        return function () {
            try {
                var first = arguments[0];
                if (typeof first === 'string' && first.indexOf('[PainelLucro]') === 0) {
                    var match;
                    if ((match = first.match(/resposta (\d+) para (\w+)/))) {
                        var data = arguments[1] || {};
                        if (Number(match[1]) === 200 && data.accepted) {
                            add('ok', 'Servidor gravou ' + match[2] + (ultimos[match[2]] || '') + (data.duplicate ? ' (repetido, ignorado)' : ''));
                        } else {
                            add('erro', 'ERRO ' + match[1] + ' em ' + match[2] + ': ' + (data.error || 'sem detalhe'));
                        }
                    } else if ((match = first.match(/evento (\w+)/))) {
                        ultimos[match[1]] = detail(arguments[1]);
                        add('env', 'Enviou ' + match[1] + ultimos[match[1]]);
                    } else if (first.indexOf('não foi possível ler') > -1) {
                        add('erro', 'Sem resposta do servidor. Confira o endereço do painel em config.js e se os 3 arquivos novos foram publicados.');
                    }
                }
            } catch (error) { /* nunca atrapalhar a página */ }
            return original.apply(console, arguments);
        };
    }
    console.log = interceptar(console.log);
    console.warn = interceptar(console.warn);

    var uuid = /^[0-9a-f-]{36}$/i;
    if (/SEU-PAINEL/.test(PAINEL_URL) || !/^https?:\/\//i.test(PAINEL_URL)) {
        add('erro', 'Falta colocar o endereço do painel na linha PAINEL_URL do arquivo config.js.');
        return;
    }
    if (!uuid.test(ID_DA_INSTALACAO)) {
        add('erro', 'Falta colocar o ID da instalação na linha ID_DA_INSTALACAO do arquivo config.js.');
        return;
    }

    var script = document.createElement('script');
    script.async = true;
    script.src = PAINEL_URL.replace(/\/+$/, '') + '/tracker.js';
    script.setAttribute('data-pixel-id', ID_DA_INSTALACAO);
    script.setAttribute('data-pl-debug', '');
    if (CONSENTIMENTO_AUTOMATICO) script.setAttribute('data-pl-consent', 'auto');
    script.onload = function () {
        var api = window.PainelLucro;
        if (!api) {
            add('erro', 'O script carregou, mas não ligou. O ID da instalação está certo?');
        } else if (typeof api.track !== 'function') {
            add('erro', 'O painel está com o tracker.js ANTIGO. Publique o tracker.js novo e tente de novo.');
        } else {
            add('ok', 'Script do rastreamento carregado.');
        }
    };
    script.onerror = function () {
        add('erro', 'Não consegui carregar ' + script.src + '. Confira o endereço do painel.');
    };
    document.head.appendChild(script);
})();