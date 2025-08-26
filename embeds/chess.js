let chess;

const urlParams = new URLSearchParams(window.location.search);
const p1 = urlParams.get('p1');
const p2 = urlParams.get('p2');
const turn = urlParams.get('turn');
const gameId = urlParams.get('gameId');
const curUser = urlParams.get('curUser');
const gameData = urlParams.get('gameData');


const overlay = document.getElementById('overlay');
const turnOverlay = document.getElementById('notYourTurn');
const undoBotton = document.getElementById('undoMove');
const sendButton = document.getElementById('sendMove');

const board = Chessboard('board1', {
  draggable: true,
  position: 'start',
  pieceTheme: function(piece) {
    return 'chesspieces/' + piece + '.png';
  },
  orientation: (curUser == p1) ? 'white' : 'black',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
});

const fen = gameData
console.log("FEN from URL: " + fen)
if (fen != "false" && fen != null){ 
    chess = new Chess(fen);
    console.log("Loaded FEN: " + fen);
}else{
    console.log("No FEN found, starting new game")
    chess = new Chess();
}
board.position(chess.fen());
//console.log(chess.fen())

overlay.style.display = 'none';
notYourTurn.style.display = (curUser == ((turn === 'p1') ? p1 : p2)) ? 'none' : 'block';



function onDragStart(source, piece, position, orientation) {
    if (chess.game_over()) return false;

    /* console.log((turn === 'p1') ? p1 : p2)
    console.log(curUser)
    console.log(chess.turn()) */

    //if the current user is the player whose turn it is
    if (curUser == ((turn === 'p1') ? p1 : p2)){

        //and they are only moving their own pieces
        if ((chess.turn() === 'w'  && piece.search(/^b/) !== -1) ||
            (chess.turn() === 'b'  && piece.search(/^w/) !== -1) ||
            (turn == "p1" && piece.search(/^b/) !== -1) ||
            (turn == "p2" && piece.search(/^w/) !== -1)) return false;
    }else{
        return false;
    }
}

//STILL BROKEN IMA SLEEP ON IT

function onDrop(source, target) {
  const move = chess.move({ from: source, to: target, promotion: 'q' });
  if (move === null) return 'snapback';
  console.log("moved piece: " + chess.fen())
  overlay.style.display = 'block';
}

function onSnapEnd() {
  board.position(chess.fen());
}

undoBotton.addEventListener('click', () => {
    chess.undo();
    board.position(chess.fen());
    overlay.style.display = 'none';
});

sendButton.addEventListener('click', () => {
    //send move to database
    const event = new CustomEvent('embedReply', { detail: {type: "chess", p1: p1, p2: p2, turn: (turn === 'p1') ? 'p2' : 'p1', gameId: gameId, gameData: chess.fen()} });
    window.parent.dispatchEvent(event);
});