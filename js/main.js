'use strict'

var gGame
var gBoard
var gLevel

var MINE = '💣'
var EMPTY = ' '
var FLAG = '🚩'

var gSecondsInterval

function onInit() {
    console.log('onInit()')

    gLevel = {
        SIZE: 10,
        MINES: 10
    }

    gGame = {
        isStarted: false,
        isGameOver: false,
        revealedCount: 0,
        markedCount: 0,
        secondsPassed: 0
    }

    // show the number of mines in the title
    var element = document.querySelector('.mines-counter .number')
    element.innerText = gLevel.MINES

    buildBoard()
    renderBoard()
}

function buildBoard() {
    console.log('buildBoard()')

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
    console.log('setMinesNegsCount()')

    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            var count = countMinesAround(i, j)
            var cell = gBoard[i][j]
            cell.minesAroundCount = count
        }
    }
}

function countMinesAround(row, col) {
    console.log(`countMinesAround(${row}, ${col})`)

    var count = 0
    for (var i = row - 1; i <= row + 1; i++) {
        if (i < 0 || i > gLevel.SIZE - 1) continue

        for (var j = col - 1; j <= col + 1; j++) {
            if (j < 0 || j > gLevel.SIZE - 1) continue
            if (i === row && j === col) continue

            var cell = gBoard[i][j]
            if (cell.isMine) {
                count++
            }
        }
    }

    return count
}

function renderBoard() {
    console.log('renderBoard()')

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
    console.log(`onCellClicked ${row} ${col}`)

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
    console.log(`revealNeighbors(${row}, ${col})`)

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
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
    // The maximum is inclusive and the minimum is inclusive
}

function onCellMarked(elCell, row, col) {
    console.log('elCell: ', elCell)

    var cell = gBoard[row][col]

    if (cell.isRevealed) {
        console.log('Can\t mark an already revealed cell.')
        return
    }

    if (cell.isMarked) {
        // the cell is already marked, so unmark it

        console.log(`unmarking cell ${row} ${col}`)

        cell.isMarked = false
        gGame.markedCount--
        elCell.innerText = EMPTY

    } else {
        // the cell is not marked, so mark it

        console.log(`marking cell ${row} ${col}`)

        cell.isMarked = true
        gGame.markedCount++
        elCell.innerText = FLAG
    }
}


// // another option to check for the game status :
//
// function checkGameOver() {
//     for (var i = 0; i < gLevel.SIZE; i++) {
//         for (var j = 0; j < gLevel.SIZE; j++) {
//             var cell = gBoard[i][j]

//             if (!cell.isMine && !cell.isRevealed) {
//                 // we have an empty cell that is not revealed
//                 console.log('There are still unrevealed empty cells')
//                 return false
//             }

//             if (cell.isMine && cell.isRevealed) {
//                 // we have a mine that was revealed, so Game Over
//                 console.log('You have stepped on a mine. Game Over!')
//                 return true
//             }
//         }
//     }

//     // we have a winning
//     console.log('You won the game!')
//     return true
// } 