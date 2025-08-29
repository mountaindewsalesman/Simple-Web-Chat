let chess;

const urlParams = new URLSearchParams(window.location.search);
const p1 = urlParams.get('p1');
const p2 = urlParams.get('p2');
const turn = urlParams.get('turn');
const gameId = urlParams.get('gameId');
const curUser = urlParams.get('curUser');
const gameData = urlParams.get('gameData');

const endOverlay = document.getElementById('end');

const overlay = document.getElementById('overlay');
const turnOverlay = document.getElementById('notYourTurn');
const undoBotton = document.getElementById('undoMove');
const sendButton = document.getElementById('sendMove');
const choosePromote = document.getElementById('choosePromote');

const pieceBase = new URL('./chessPieces/', import.meta.url).href;
const board = Chessboard('board1', {
  draggable: true,
  position: 'start',
  pieceTheme: function(piece) {
    return pieceBase + piece + '.png';
  },
  orientation: (curUser == p1) ? 'white' : 'black',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
});

const fen = gameData
if (fen != "false" && fen != null){ 
    chess = new Chess(fen);
}else{
    chess = new Chess();
}
board.position(chess.fen());

overlay.style.display = 'none';
turnOverlay.style.display = (curUser == ((turn === 'p1') ? p1 : p2)) ? 'none' : 'block';
choosePromote.style.display = 'none';

if (chess.game_over()){
    endOverlay.style.display = 'block';
    if (chess.in_checkmate()) {
    // If it's checkmate, the side to move LOST
    const winner = (chess.turn() === 'w') ? 'Black' : 'White';
    console.log(winner)
    document.getElementById("result").textContent = "Winner: " + winner;
  }
  else if (chess.in_draw()) {
    document.getElementById("result").textContent = "Draw";
  }
  else if (chess.in_stalemate()) {
    document.getElementById("result").textContent = "Draw by stalemate";
  }
  else if (chess.in_threefold_repetition()) {
    document.getElementById("result").textContent = "Draw by threefold repetition";
  }
  else if (chess.insufficient_material()) {
    document.getElementById("result").textContent = "Draw by insufficient material";
  }

}else{
    endOverlay.style.display = 'none';
}



function onDragStart(source, piece, position, orientation) {
    if (chess.game_over()) return false;


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

function waitForPromotionChoice() {
  return new Promise(resolve => {
    ["q", "r", "b", "n"].forEach(id => {
      const btn = document.getElementById(id);
      btn.addEventListener("click", () => resolve(id), { once: true });
    });
  });
}

async function onDrop(source, target) {
  const piece = chess.get(source);
  if (piece && piece.type === "p" &&
     ((piece.color === "w" && target[1] === "8") ||
      (piece.color === "b" && target[1] === "1"))) {

    // Show promotion overlay
    choosePromote.style.display = "block";

    // Wait for player to pick piece
    const choice = await waitForPromotionChoice();

    // Hide overlay
    choosePromote.style.display = "none";

    // Try the move with chosen promotion
    const move = chess.move({ from: source, to: target, promotion: choice });
    if (move === null) return 'snapback';

    overlay.style.display = 'block';
    board.position(chess.fen());
    return;
  }

  const move = chess.move({ from: source, to: target});
  if (move === null) return 'snapback';
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