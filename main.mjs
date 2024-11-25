import Game from './game.mjs';

const SETTINGS_FORM = document.getElementById('settings');
const GAME_FIELD = document.getElementById('game-field');
const MAX_MINES_PERCENT = 30;
const MIN_MINES_PERCENT = 10;

const GAME_SETTINGS_LIMITS = {
    max: {
        width: 50,
        height: 50,
        mines: 6399
    },
    min: {
        width: 2,
        height: 2,
        mines: 1
    }
}

SETTINGS_FORM.addEventListener('reset', e => {
    e.preventDefault();
    e.stopImmediatePropagation();

    const _MINES_PERCENT = Math.floor((Math.random() * (MAX_MINES_PERCENT - MIN_MINES_PERCENT) + MIN_MINES_PERCENT)) / 100;
    const _WIDTH = Math.floor(Math.random() * (GAME_SETTINGS_LIMITS.max.width - GAME_SETTINGS_LIMITS.min.width) + GAME_SETTINGS_LIMITS.min.width);
    const _HEIGHT = Math.floor(Math.random() * (GAME_SETTINGS_LIMITS.max.height - GAME_SETTINGS_LIMITS.min.height) + GAME_SETTINGS_LIMITS.min.height);

    const GENERATION = {
        width: _WIDTH,
        height: _HEIGHT,
        mines: Math.floor(_WIDTH * _HEIGHT * _MINES_PERCENT)
    }

    // console.log([GENERATION.width * GENERATION.height, MINES_PERCENT])

    SETTINGS_FORM.querySelector('input[name="width"]').value = GENERATION.width;
    SETTINGS_FORM.querySelector('input[name="height"]').value = GENERATION.height;
    SETTINGS_FORM.querySelector('input[name="mines"]').value = GENERATION.mines;

    e.currentTarget.querySelector('button[type="submit"]').click();

    return false;
})

SETTINGS_FORM.addEventListener('submit', e => {
    if (window._game) window._game.endGame(false, true);
    GAME_FIELD.innerHTML = '';

    e.preventDefault();
    e.stopImmediatePropagation();

    const FD = new FormData(e.currentTarget);

    window._game = new Game(FD.get('width'), FD.get('height'), FD.get('mines'), (new URLSearchParams(window.location.search)).has('debug'));

    console.log(window._game);

    return false;
})