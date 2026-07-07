export function setBoard(boardSize) {
  const board = { width: 0, height: 0 };
  switch (boardSize) {
    case "mini": {
      board.width = 28;
      board.height = 28;
      break;
    }
    case "large": {
      board.width = 29;
      board.height = 29;
      break;
    }
    case "super-portrait": {
      board.width = 49;
      board.height = 69;
      break;
    }
    case "super-landscape": {
      board.width = 69;
      board.height = 49;
      break;
    }
  }
  return board;
}

export function setHorizontalLines(width, height, board, color) {
  const gridLines = [];
  for (let i = 0; i <= height; i++) {
    const y = Math.round(i);
    const atEdge = i % board.height === 0;
    const strokeWidth = atEdge ? 0.2 : 0.03;
    const line = (
      <line
        key={`h-${i}`}
        x1={0}
        y1={y}
        x2={width + 1}
        y2={y}
        strokeWidth={strokeWidth}
        stroke={color}
      />
    );
    gridLines.push(line);
  }
  return gridLines;
}

export function setVerticalLines(width, height, board, color) {
  const gridLines = [];
  for (let i = 0; i <= width; i++) {
    const x = Math.round(i);
    const atEdge = i % board.width === 0;
    const strokeWidth = atEdge ? 0.2 : 0.03;
    const line = (
      <line
        key={`v-${i}`}
        x1={x}
        y1={0}
        x2={x}
        y2={height + 1}
        strokeWidth={strokeWidth}
        stroke={color}
      />
    );
    gridLines.push(line);
  }
  return gridLines;
}

export function generateGrid(width, height, boardSize, color) {
  const board = setBoard(boardSize);
  const verticalLines = setVerticalLines(width, height, board, color);
  const horizontalLines = setHorizontalLines(width, height, board, color);
  return { vertLines: verticalLines, horizLines: horizontalLines };
}
