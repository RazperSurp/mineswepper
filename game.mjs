export default class Game {
    _CLICKS = 0;
    _SHOW_MINES = false;

    _WIDTH;
    _HEIGHT;
    _SQUARE;

    _MINES_COUNT;
    _MINES_POS;

    _EPOCH;
    _EPOCH_INTERVAL;

    _SIGNED_POS;

    _CLOSED_CELLS_LEFT;
    _UNSIGNED_MINES_LEFT;

    GAME_STATUS_CONTAINER = document.getElementById('game-status');
    STOPWATCH_CONTAINER = document.getElementById('stopwatch');
    CLOSED_CELLS_LEFT_CONTAINER = document.getElementById('closed-cells-left');
    UNSIGNED_MINES_LEFT_CONTAINER = document.getElementById('unsigned-mines-left');

    GAME_FIELD = document.getElementById('game-field');

    constructor (width, height, minesCount, isDebug = false) {
        this._SHOW_MINES = isDebug;

        this._resetGameField();

        this._WIDTH = Number(width);
        this._HEIGHT = Number(height);
        this._MINES_COUNT = Number(minesCount);

        this.renderField();

        this._CLOSED_CELLS_LEFT = this._SQUARE - this._MINES_COUNT;
        this._UNSIGNED_MINES_LEFT = this._MINES_COUNT;

    }

    triggerStopwatch(doStop = false) {
        if (doStop) return this._stopStopwatch();
        else return this._startStopwatch();
    }

    _startStopwatch() {
        this.STOPWATCH_CONTAINER.innerHTML = '00 мин. 00 сек.'
        this._EPOCH = 0;
        this._EPOCH_INTERVAL = setInterval(() => {
            this._EPOCH++;
            this.STOPWATCH_CONTAINER.innerHTML = this.EPOCH;
        }, 1000)
    }

    _stopStopwatch() {
        clearInterval(this._EPOCH_INTERVAL);
    }

    _showMines(doWin = false) {
        if (doWin) this.GAME_FIELD.querySelectorAll('td').forEach(cell => {
            if (!this._MINES_POS.find(pos => pos.x !== cell.dataset.addr && pos.y !== cell.parentNode.dataset.addr)) this.openCell(cell);
        }); else this._MINES_POS.forEach(pos => { this.findCell(pos.x, pos.y).classList.add('mine') })
    }

    _parseStopwatch() {        
        let daysPassed = String(Math.floor(this._EPOCH / 86400));
        let hoursPassed = String(Math.floor((this._EPOCH - (daysPassed * 86400)) / 3600));
        let minutesPassed = String(Math.floor((this._EPOCH - ((daysPassed * 86400) + (hoursPassed * 3600))) / 60));
        let secondsPassed = String(this._EPOCH - ((daysPassed * 86400) + (hoursPassed * 3600) + (minutesPassed * 60)));

        const TIME_PARSED = {
            days: daysPassed != 0 ? daysPassed.length > 1 ? `${daysPassed} дн. ` : `0${daysPassed} дн. ` : '',
            hours: hoursPassed != 0 ? hoursPassed.length > 1 ? `${hoursPassed} ч. ` : `0${hoursPassed} ч. ` : '',
            minutes: minutesPassed != 0 ? minutesPassed.length > 1 ? `${minutesPassed} мин. ` : `0${minutesPassed} мин. ` : '00 мин. ',
            seconds: secondsPassed != 0 ? secondsPassed.length > 1 ? `${secondsPassed} сек.` : `0${secondsPassed} сек.` : '00 сек.',
        }

        return `${TIME_PARSED.days}${TIME_PARSED.hours}${TIME_PARSED.minutes}${TIME_PARSED.seconds}`;
    }

    get EPOCH() {
        return this._parseStopwatch();
    }

    _resetGameField() {
        if (this.GAME_STATUS_CONTAINER.classList.contains('win')) this.GAME_STATUS_CONTAINER.classList.remove('win');
        if (this.GAME_STATUS_CONTAINER.classList.contains('lose')) this.GAME_STATUS_CONTAINER.classList.remove('lose');

        if (this.GAME_FIELD.classList.contains('win')) this.GAME_FIELD.classList.remove('win');
        if (this.GAME_FIELD.classList.contains('lose')) this.GAME_FIELD.classList.remove('lose');

        if (this.GAME_FIELD.classList.contains('end')) this.GAME_FIELD.classList.remove('end');
        
        this.GAME_STATUS_CONTAINER.innerHTML = '';

        this.GAME_FIELD.oncontextmenu = e => {
            e.preventDefault();
            e.stopImmediatePropagation();

            return false;
        }
    }

    renderField() {
        for (let i = 0; i < this._HEIGHT; i++) {
            let row = document.createElement('tr');
            row.setAttribute('data-addr', i);
        
            let j = 0;
            let intervalId = setInterval(() => {
                if (j < this._WIDTH) {
                    let cell = document.createElement('td');
                    cell.setAttribute('data-addr', j);
                    
                    cell.onclick = (ce) => { this.openCell(ce.currentTarget) };

                    cell.oncontextmenu = (ce) => {
                        ce.preventDefault();
                        ce.stopImmediatePropagation();

                        this.markCell({ POS: {X: cell.dataset.addr, Y: cell.parentNode.dataset.addr }, EL: cell }, (cell.classList.contains('flag')))

                        return false;
                    }
                    
                    row.appendChild(cell);
                    j++;
                } else clearInterval(intervalId);
            }, 25)

            this.GAME_FIELD.appendChild(row);
        }
    }

    generateMines(cell = null) {
        this._SQUARE = this._WIDTH * this._HEIGHT;

        let CELL_INDEX, CELL_POS_Y, CELL_POS_X;
        
        this._MINES_POS = this._MINES_POS ?? [];
        this._MINES_COUNT = this._SQUARE <= this._MINES_COUNT ? this._SQUARE - 1 : this._MINES_COUNT;

        for (let i = 0; i < this._MINES_COUNT; i++) {
            let j = 0;
            do {
                CELL_INDEX = Math.floor(Math.random() * this._SQUARE);
                CELL_POS_Y = Math.floor(CELL_INDEX / this._WIDTH);
                CELL_POS_X = CELL_INDEX - (CELL_POS_Y) * this._WIDTH;
                j++;
            } while (!!this._MINES_POS.find(pos => (pos.x == CELL_POS_X && pos.y == CELL_POS_Y)));
            
            this._MINES_POS.push({ x: CELL_POS_X, y: CELL_POS_Y });
        }
        
        if (cell != null) {
            if (this.checkNeighbors(cell) > 0) {
                this._MINES_POS = [];
                this.generateMines(cell);
            } else {
                this.updateGameInfo();
                this.triggerStopwatch();
            }
        }
    }

    findCell(x, y, filterOpened = false) {
        const CELL = document.querySelector(`tr[data-addr="${Number(y)}"] td[data-addr="${Number(x)}"]${filterOpened ? ':not(.opened)' :''}`);
        return CELL;
    }

    markCell(cell, doRemove = false) {
        this._SIGNED_POS = this._SIGNED_POS ?? [];
        if (!cell.EL.classList.contains('opened')) {
            if (!doRemove) {
                this._UNSIGNED_MINES_LEFT--;
                cell.EL.classList.add('flag');

                cell.EL.onclick = () => { };

                this._SIGNED_POS.push({ x: cell.POS.X, y: cell.POS.Y });
            } else {
                this._UNSIGNED_MINES_LEFT++;
                cell.EL.classList.remove('flag');

                cell.EL.onclick = (ce) => {
                    this.openCell(ce.currentTarget);
                }

                delete this._SIGNED_POS[this._SIGNED_POS.find(pos => pos.x == cell.POS.X && pos.y == cell.POS.Y)];
            }

            this.updateGameInfo();
        }
    }

    openCell(cell) {
        const CELL_DATA = {
            POS: {
                X: cell.dataset.addr,
                Y: cell.parentNode.dataset.addr
            }, EL: cell
        }

        if (this._CLICKS === 0) this.generateMines(CELL_DATA);

        if (!cell.classList.contains('flag')) {
            this._CLICKS++;

            const NEIGHBORS = this.getNeighbors(CELL_DATA);

            if (!cell.classList.contains('opened')) {
                const IS_MINE = this.checkIsMine(CELL_DATA);

                CELL_DATA.EL.classList.add('opened');

                if (IS_MINE) {
                    CELL_DATA.EL.classList.add('mine');
                    CELL_DATA.EL.classList.add('faggot'); // =)

                    this.endGame();
                } else {
                    this._CLOSED_CELLS_LEFT--;
                    let minesCount = this.checkNeighbors(CELL_DATA);

                    if (minesCount > 0) CELL_DATA.EL.innerHTML = `<span>minesCount</span>`;
                    else NEIGHBORS.forEach(neighbor => {
                        this.openCell(neighbor.EL)
                    });

                    CELL_DATA.EL.setAttribute('data-value', minesCount);

                    if (this._CLOSED_CELLS_LEFT === 0) this.endGame(true);
                }

                this.updateGameInfo();
                return true;
            } else {
                let signedMinesCount = 0;
                const MINES_COUNT = CELL_DATA.EL.dataset.value;

                NEIGHBORS.forEach(neighbor => { if (neighbor.EL.classList.contains('flag')) signedMinesCount++ });

                if (MINES_COUNT <= signedMinesCount) NEIGHBORS.forEach(neighbor => { this.openCell(neighbor.EL) });
                else {
                    NEIGHBORS.forEach(neighbor => { neighbor.EL.classList.add('hover') });
                    setTimeout(() => { NEIGHBORS.forEach(neighbor => { neighbor.EL.classList.remove('hover') }) }, 200);
                }
            };
        }
    }

    getNeighbors(cell) {
        let neighbor, neighbors = [];
        
        for (let i = -1; i < 2; i++) {
            for (let j = -1; j < 2; j++) {
                neighbor = {
                    POS: {
                        Y: Number(cell.POS.Y) + i,
                        X: Number(cell.POS.X) + j
                    },
                    EL: this.findCell(Number(cell.POS.X) + j, Number(cell.POS.Y) + i, true)
                }

                if (neighbor.EL !== null) neighbors.push(neighbor);
            }
        }

        return neighbors;
    }

    checkNeighbors(cell) {
        const NEIGHBORS = this.getNeighbors(cell);
        let minesCount = 0;

        NEIGHBORS.forEach(neighbor => { if (this.checkIsMine(neighbor, false)) minesCount++; })
        
        return minesCount;
    } 

    checkIsMine(cellData, isOpening = true) {
        const IS_MINE = this._MINES_POS.find(pos => pos.x == cellData.POS.X && pos.y == cellData.POS.Y) !== undefined
        if (IS_MINE && isOpening) cellData.EL.classList.add('mine');
        return IS_MINE;
    }

    updateGameInfo() {
        this._CLOSED_CELLS_LEFT = this._SQUARE - this._MINES_COUNT - (document.querySelectorAll('td.opened').length);

        this.CLOSED_CELLS_LEFT_CONTAINER.innerHTML = this._CLOSED_CELLS_LEFT;
        this.UNSIGNED_MINES_LEFT_CONTAINER.innerHTML = this._UNSIGNED_MINES_LEFT;
    }

    endGame(isWin = false, isRestart = false) {
        this.GAME_FIELD.classList.add('end');

        this.triggerStopwatch(true);
        delete this;

        if (!isRestart) {
            let delay = 0;
            this._MINES_POS.forEach(pos => {
                let mineCell = this.findCell(pos.x, pos.y);
                mineCell.classList.add('mine');
                setTimeout(() => { mineCell.classList.add('faggot') }, 30 * delay);

                delay++;
            })

            this.GAME_STATUS_CONTAINER.classList.add(isWin ? 'win' : 'lose');
            this.GAME_FIELD.classList.add(isWin ? 'win' : 'lose');

            if (isWin) this.GAME_STATUS_CONTAINER.innerHTML = 'Вы успешно обнаружили все мины и вскрыли все пустые клетки! Нажмите на кнопку "Случайно" или "Применить", чтобы начать заново.';
            else this.GAME_STATUS_CONTAINER.innerHTML = 'Вы проиграли! Нажмите на кнопку "Случайно" или "Применить", чтобы начать заново.';
        }
    }
}
