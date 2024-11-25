export default class Game {
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

    STOPWATCH_CONTAINER = document.getElementById('stopwatch');
    CLOSED_CELLS_LEFT_CONTAINER = document.getElementById('closed-cells-left');
    UNSIGNED_MINES_LEFT_CONTAINER = document.getElementById('unsigned-mines-left');

    GAME_FIELD = document.getElementById('game-field');

    constructor (width, height, minesCount) {
        this._WIDTH = Number(width);
        this._HEIGHT = Number(height);
        this._MINES_COUNT = Number(minesCount);

        this.renderField();
        this.generateMines();

        this._CLOSED_CELLS_LEFT = this._SQUARE - this._MINES_COUNT;
        this._UNSIGNED_MINES_LEFT = this._MINES_COUNT;

        this.updateGameInfo();

        this.triggerStopwatch();
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

    renderField() {
        if (this.GAME_FIELD.classList.contains('end')) this.GAME_FIELD.classList.remove('end');

        for (let i = 0; i < this._HEIGHT; i++) {
            let row = document.createElement('tr');
            row.setAttribute('data-addr', i);
        
            let j = 0;
            let intervalId = setInterval(() => {
                if (j < this._WIDTH) {
                    let cell = document.createElement('td');
                    cell.setAttribute('data-addr', j);
                    
                    cell.onclick = (ce) => {
                        if (!ce.currentTarget.classList.contains('opened')) {
                            this.openCell(ce.currentTarget);
                        }
                    };

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

    generateMines() {
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
                    if (!ce.currentTarget.classList.contains('opened')) {
                        this.openCell(ce.currentTarget);
                    }
                }

                delete this._SIGNED_POS[this._SIGNED_POS.find(pos => pos.x == cell.POS.X && pos.y == cell.POS.Y)];
            }

            this.updateGameInfo();
        }
    }

    openCell(cell) {
        if (!cell.classList.contains('opened')) {
            const CELL_DATA = {
                POS: {
                    X: cell.dataset.addr,
                    Y: cell.parentNode.dataset.addr
                }, EL: cell
            }

            const IS_MINE = this.checkIsMine(CELL_DATA);

            CELL_DATA.EL.classList.add('opened');

            if (IS_MINE) {
                CELL_DATA.EL.classList.add('mine');
                this.endGame();
            } else {
                this._CLOSED_CELLS_LEFT--;
                let minesCount = this.checkNeighbors(CELL_DATA);

                if (minesCount > 0) CELL_DATA.EL.innerHTML = minesCount;
                else this.getNeighbors(CELL_DATA).forEach(neighbor => {
                    console.log(neighbor);
                    this.openCell(neighbor.EL)
                });

                if (this._CLOSED_CELLS_LEFT === 0) this.endGame(true);
            }

            this.updateGameInfo();
            return true;
        } else return false;
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
                    EL: document.querySelector(`tr[data-addr="${Number(cell.POS.Y) + i}"] td[data-addr="${Number(cell.POS.X) + j}"]:not(.opened)`)
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
            this._MINES_POS.forEach(pos => {
                document.querySelector(`tr[data-addr="${Number(pos.y)}"] td[data-addr="${Number(pos.x)}"]`).classList.add('mine');
            })


            if (isWin) alert('Вы успешно обнаружили все мины и вскрыли все пустые клетки! Нажмите на кнопку "Случайно" или "Применить", чтобы начать заново.')
            else alert('Вы проиграли! Нажмите на кнопку "Случайно" или "Применить", чтобы начать заново.');
        }
    }
}