'use strict'

var gGame
var gBoard
var gLevel

var MINE = '💣'
var EMPTY = ' '
var FLAG = '🚩'

var gSecondsInterval

function onInit() {
    // size of the board and number of mines
    gLevel = {
        SIZE: 10,
        MINES: 10
    }

    // initial state of the game
    gGame = {
        isStarted: false,
        isGameOver: false,
        revealedCount: 0,
        markedCount: 0,
        secondsPassed: 0
    }

    // show the number of mines
    var element = document.querySelector('.mines-counter .number')
    element.innerText = gLevel.MINES

    // create the board and render it on the page
    buildBoard()
    renderBoard()
}

function restartGame() {

    // stop the seconds counter
    clearInterval(gSecondsInterval)

    // reset the game state
    gGame = null
    gBoard = null
    gLevel = null
    gSecondsInterval = null

    // remove the table
    document.querySelector('.main-board table').remove()
    var element = document.querySelector('.main-smile img')

    // reset the smiley image
    element.setAttribute('src', 'img/happy.png')

    // show zero seconds
    element = document.querySelector('.main-counter .seconds')
    element.innerText = '0'


    // restart the game
    onInit()
}

function buildBoard() {
    var board = []

    // build empty board
    for (var i = 0; i < gLevel.SIZE; i++) {
        board[i] = []

        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = {
                minesAroundCount: 0,
                isRevealed: false,
                isMine: false,
                isMarked: false
            }
            board[i][j] = cell
        }
    }

    // place mines
    for (var i = 0; i < gLevel.MINES; i++) {
        var row = getRandomNumber(0, gLevel.SIZE - 1)
        var col = getRandomNumber(0, gLevel.SIZE - 1)
        var cell = board[row][col]

        // if the cell already contains a mine, decrease the counter
        if (cell.isMine) {
            i--
        } else {
            cell.isMine = true
        }
    }

    gBoard = board

    // update counters in the board
    setMinesNegsCount()
}

// Count mines around each cell and set the cell's minesAroundCount.
function setMinesNegsCount() {
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            var count = countMinesAround(i, j)
            var cell = gBoard[i][j]
            cell.minesAroundCount = count
        }
    }
}

// Count the mines around the given cell at (row, col)
function countMinesAround(row, col) {
    var count = 0
    for (var i = row - 1; i <= row + 1; i++) {
        if (i < 0 || i > gLevel.SIZE - 1) continue // only check valid rows

        for (var j = col - 1; j <= col + 1; j++) {
            if (j < 0 || j > gLevel.SIZE - 1) continue // only check valid columns
            if (i === row && j === col) continue // ignore the cell itself

            var cell = gBoard[i][j]
            if (cell.isMine) {
                count++
            }
        }
    }

    return count
}

function renderBoard() {
    // create the table to insert in the html inside .main-board
    var htmlStr = '<table>'
    for (var i = 0; i < gLevel.SIZE; i++) {
        htmlStr += '<tr>'
        for (var j = 0; j < gLevel.SIZE; j++) {
            var content = ''

            var cell = gBoard[i][j]
            if (!cell.isRevealed) {
                if (cell.isMarked) {
                    content = FLAG
                } else {
                    content = EMPTY
                }
            } else {
                if (cell.isMine) {
                    content = MINE
                } else {
                    if (cell.minesAroundCount === 0) {
                        content = EMPTY
                    } else {
                        content = cell.minesAroundCount
                    }
                }
            }

            var revealed = cell.isRevealed ? 'revealed' : ''

            var part1 = `class="cell cell-${i}-${j} ${revealed}"`
            var part2 = `onclick="onCellClicked(this,${i},${j})"`
            var part3 = `oncontextmenu="onCellMarked(this,${i},${j})"`
            var line = `<td ${part1} ${part2} ${part3}>${content}</td>`

            htmlStr += line
        }
        htmlStr += '</tr>'
    }

    htmlStr += '</table>'

    var container = document.querySelector('.main-board')
    container.innerHTML = htmlStr

}

function incrementSeconds() {
    gGame.secondsPassed++
    var element = document.querySelector('.main-counter .seconds')
    element.innerText = gGame.secondsPassed
}

function onCellClicked(elCell, row, col) {
    if (gGame.isGameOver) {
        console.log('Game is already over')
        return
    }

    if (!gGame.isStarted) {
        console.log('Starting the game') // first click on a cell

        gGame.isStarted = true
        gSecondsInterval = setInterval(incrementSeconds, 1000)
    }

    var cell = gBoard[row][col]

    if (cell.isRevealed) {
        console.log('Cell already revealed')
        return
    }

    cell.isRevealed = true
    gGame.revealedCount++

    if (cell.isMine) {
        console.log('You stepped on a mine. Game Over!')

        gGame.isGameOver = true
        clearInterval(gSecondsInterval)
        revealEntireBoard()

        var element = document.querySelector('.main-smile img')
        element.setAttribute('src', 'img/sad.png')

    } else {
        console.log('You revealed another empty cell. Well done!')

        var content
        if (cell.minesAroundCount === 0) {
            content = EMPTY
            console.log('Revealing neighbors around empty cell recursively')
            revealNeighbors(row, col)
        } else {
            content = cell.minesAroundCount
        }
        elCell.innerText = content
        elCell.classList.add('revealed')

        checkForWin()
    }
}

function revealNeighbors(row, col) {
    for (var i = row - 1; i <= row + 1; i++) {
        if (i < 0 || i > gLevel.SIZE - 1) continue

        for (var j = col - 1; j <= col + 1; j++) {
            if (j < 0 || j > gLevel.SIZE - 1) continue
            if (i === row && j === col) continue

            var cell = gBoard[i][j]

            if (cell.isRevealed) continue

            cell.isRevealed = true
            gGame.revealedCount++

            var content
            if (cell.minesAroundCount === 0) {
                content = EMPTY
                revealNeighbors(i, j)
            } else {
                content = cell.minesAroundCount
            }

            var element = document.querySelector(`.cell-${i}-${j}`)
            element.innerText = content
            element.classList.add('revealed')
        }
    }
}

function checkForWin() {
    // check if there's a winning
    var totalCells = gLevel.SIZE * gLevel.SIZE
    var leftCells = totalCells - gGame.revealedCount

    if (leftCells === gLevel.MINES) {
        // winner cause only the mines are still hidden
        console.log('You won the game!')

        revealEntireBoard()
        var element = document.querySelector('.main-smile img')
        element.setAttribute('src', 'img/winner.png')

        gGame.isGameOver = true
        clearInterval(gSecondsInterval)
    }
}

function revealEntireBoard() {
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = gBoard[i][j]
            cell.isRevealed = true

            var content
            if (cell.isMine) {
                content = MINE
            } else {
                if (cell.minesAroundCount === 0) {
                    content = EMPTY
                } else {
                    content = cell.minesAroundCount
                }
            }

            var element = document.querySelector(`.cell-${i}-${j}`)
            element.innerText = content
            element.classList.add('revealed')
        }
    }
}

function getRandomNumber(min, max) {
    // The maximum is inclusive and the minimum is inclusive
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}

function onCellMarked(elCell, row, col) {

    if (gGame.isGameOver) {
        console.log('Game is already over')
        return
    }

    if (!gGame.isStarted) {
        console.log('Starting the game') // first click on a cell

        gGame.isStarted = true
        gSecondsInterval = setInterval(incrementSeconds, 1000)
    }

    var cell = gBoard[row][col]

    if (cell.isRevealed) {
        console.log('Can\t mark an already revealed cell.')
        return
    }

    if (cell.isMarked) {
        // the cell is already marked, so unmark it
        cell.isMarked = false
        gGame.markedCount--
        elCell.innerText = EMPTY

    } else {
        // the cell is not marked, so mark it
        cell.isMarked = true
        gGame.markedCount++
        elCell.innerText = FLAG
    }
}