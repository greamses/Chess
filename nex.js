class ChessGame {
    constructor() {
      this.board = Array(8).fill().map(() => Array(8).fill(null));
      this.turn = 'white';
      this.selectedSquare = null;
      this.possibleMoves = [];
      this.moveHistory = [];
      this.boardOrientation = 'white';
      this.check = false;
      this.checkmate = false;
      this.stalemate = false;
      this.lastCapture = null;
      this.draggedPiece = null;
      this.draggedPieceClone = null;
      this.enPassantTarget = null;
      this.castlingRights = {
        white: { kingside: true, queenside: true },
        black: { kingside: true, queenside: true }
      };
      this.computerPlaysWhite = false;
      this.computerPlaysBlack = false;
      this.isComputerThinking = false;
      this.uiController = null;
    }
    
    
    async playComputerMove(difficulty = 'medium') {
      if (this.checkmate || this.stalemate) return null;
      if (this.turn === 'white' && !this.computerPlaysWhite) return null;
      if (this.turn === 'black' && !this.computerPlaysBlack) return null;
      
      this.isComputerThinking = true;
      
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const move = await this.findBestMove(difficulty);
        return move;
      } finally {
        this.isComputerThinking = false;
      }
    }
    
    async findBestMove(difficulty) {
      return new Promise(resolve => {
        setTimeout(() => {
          const validMoves = this.getAllValidMoves();
          if (validMoves.length === 0) return resolve(null);
          
          if (difficulty === 'easy') {
            return resolve(validMoves[Math.floor(Math.random() * validMoves.length)]);
          }
          
          if (difficulty === 'medium') {
            const captures = validMoves.filter(move =>
              this.board[move.to.row][move.to.col]
            );
            if (captures.length) {
              return resolve(captures[Math.floor(Math.random() * captures.length)]);
            }
            return resolve(validMoves[Math.floor(Math.random() * validMoves.length)]);
          }
          
          if (difficulty === 'hard') {
            let bestScore = -Infinity;
            let bestMove = validMoves[0];
            const movesToEvaluate = validMoves.slice(0, 10);
            
            for (const move of movesToEvaluate) {
              this.makeMove(move.from.row, move.from.col, move.to.row, move.to.col);
              const score = this.evaluateBoard();
              this.undoMove();
              
              if (score > bestScore) {
                bestScore = score;
                bestMove = move;
              }
            }
            return resolve(bestMove);
          }
          
          resolve(validMoves[Math.floor(Math.random() * validMoves.length)]);
        }, 0);
      });
    }
    
    getAllValidMoves() {
  const validMoves = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = this.board[row][col];
      if (piece && piece.color === this.turn) {
        const moves = this.getPossibleMoves(row, col);
        for (const move of moves) {
          // Test if this move would be legal (doesn't leave king in check)
          const result = this.testMove(row, col, move.row, move.col);
          if (result.legal) {
            validMoves.push({
              from: { row, col },
              to: { row: move.row, col: move.col },
              piece: piece,
              // Include additional information if needed
              capture: this.board[move.row][move.col] ? true : result.enPassantCapture,
              special: this.getSpecialMoveType(piece, row, col, move.row, move.col)
            });
          }
        }
      }
    }
  }
  return validMoves;
}

// Helper method to identify special move types
getSpecialMoveType(piece, fromRow, fromCol, toRow, toCol) {
  // Castling
  if (piece.type === 'king' && Math.abs(toCol - fromCol) === 2) {
    return toCol > fromCol ? 'castle-kingside' : 'castle-queenside';
  }
  
  // En passant
  if (piece.type === 'pawn' && toCol !== fromCol && !this.board[toRow][toCol]) {
    if (this.enPassantTarget && this.enPassantTarget.row === toRow && this.enPassantTarget.col === toCol) {
      return 'en-passant';
    }
  }
  
  // Pawn promotion
  if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
    return 'promotion';
  }
  
  return null;
}
    
    evaluateBoard() {
      let score = 0;
      const pieceValues = {
        pawn: 1,
        knight: 3,
        bishop: 3,
        rook: 5,
        queen: 9,
        king: 0
      };
      
      // Material score
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const piece = this.board[row][col];
          if (piece) {
            const value = pieceValues[piece.type] || 0;
            score += piece.color === this.turn ? value : -value;
          }
        }
      }
      
      // Mobility score
      const currentTurn = this.turn;
      const opponentColor = currentTurn === 'white' ? 'black' : 'white';
      
      this.turn = currentTurn;
      score += this.getAllValidMoves().length * 0.05;
      
      this.turn = opponentColor;
      score -= this.getAllValidMoves().length * 0.05;
      
      this.turn = currentTurn;
      
      // King safety
      const kingPos = this.findKing(this.turn);
      if (kingPos) {
        const centerDistance = Math.max(
          Math.abs(kingPos.row - 3.5),
          Math.abs(kingPos.col - 3.5)
        );
        score -= centerDistance * 0.1;
      }
      
      // Pawn structure
      for (let col = 0; col < 8; col++) {
        let pawnCount = 0;
        for (let row = 0; row < 8; row++) {
          const piece = this.board[row][col];
          if (piece && piece.type === 'pawn' && piece.color === this.turn) {
            pawnCount++;
          }
        }
        if (pawnCount > 1) {
          score -= 0.5 * (pawnCount - 1);
        }
      }
      
      return score;
    }
    
    getPieceValue(piece) {
      const values = {
        pawn: 1,
        knight: 3,
        bishop: 3,
        rook: 5,
        queen: 9,
        king: 0
      };
      return values[piece.type] || 0;
    }
  }

