const chess = new Chess();

const urlParams = new URLSearchParams(window.location.search);
const fen = urlParams.get('fen');
const turn = urlParams.get('turn');
if (fen) {
    board.position(fen);
    chess.load(fen);
}


const board = Chessboard('board1', {
  draggable: true,
  position: 'start',
  pieceTheme: function(piece) {
    return 'chesspieces/' + piece + '.png';
  },
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
});


function onDragStart(source, piece, position, orientation) {
  if (chess.game_over()) return false;
  if ((chess.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (chess.turn() === 'b' && piece.search(/^w/) !== -1)) return false;
}

function onDrop(source, target) {
  const move = chess.move({ from: source, to: target, promotion: 'q' });
  if (move === null) return 'snapback';
}

function onSnapEnd() {
  board.position(chess.fen());
}
