let chess;

const urlParams = new URLSearchParams(window.location.search);
const turn = urlParams.get('turn');
const p1 = urlParams.get('p1');
const p2 = urlParams.get('p2');
const gameId = urlParams.get('gameId');
const curUser = urlParams.get('curUser');

const fen = urlParams.get('fen');


const board = Chessboard('board1', {
  draggable: true,
  position: 'start',
  pieceTheme: function(piece) {
    return 'chesspieces/' + piece + '.png';
  },
  orientation: (turn === "p1") ? 'white' : 'black',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
});

if (fen) {
    board.position(fen);
    chess = new Chess(fen + ((turn === "p1") ? ' w - - 0 1' : ' b - - 0 1'));
}else{
    chess = new Chess();
}

function onDragStart(source, piece, position, orientation) {
  if (chess.game_over()) return false;

  if ((chess.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (chess.turn() === 'b' && piece.search(/^w/) !== -1)) return false;
  
  if ((turn === 'p1' && piece.search(/^b/) !== -1) ||
      (turn === 'p2' && piece.search(/^w/) !== -1)) return false;
  
}

function onDrop(source, target) {
  const move = chess.move({ from: source, to: target, promotion: 'q' });
  if (move === null) return 'snapback';
  console.log(board.fen())
}

function onSnapEnd() {
  board.position(chess.fen());
}
