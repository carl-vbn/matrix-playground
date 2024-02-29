import { History, HistoryBar } from "@/common/history";
import { Matrix, Scalar, parseScalar } from "@/common/math";
import DimensionInput from "@/common/matrix-dimension-input";
import MatrixHTML from "@/common/matrixHTML";
import { Operation, OperationTypeName, newOperation, operationsDict } from "@/common/operations";
import { SetStateAction, useEffect, useState } from "react";

export default function Home() {
  const [mainMatrix, setMainMatrix] = useState(new Matrix(3, 3, [[1, 2, 3], [4, 5, 6], [7, 8, 9]]));
  const [multiplyingMatrix, setMultiplyingMatrix] = useState(new Matrix(3, 3, [[1, 0, 0], [0, 1, 0], [0, 0, 1]]));
  const [resultMatrix, setResultMatrix] = useState<Matrix | null>(new Matrix(3, 3, [[1, 2, 3], [4, 5, 6], [7, 8, 9]]));
  const [mainMatrixModifiedCells, setMainMatrixModifiedCells] = useState<[number, number][]>([]);
  const [multiplyingMatrixModifiedCells, setMultiplyingMatrixModifiedCells] = useState<[number, number][]>([]);
  const [resultMatrixModifiedCells, setResultMatrixModifiedCells] = useState<[number, number][]>([]);
  const [multiplicationMode, setMultiplicationMode] = useState(false);
  const [highlightedMatrix, setHighlightedMatrix] = useState<'main' | 'multiplying' | 'result' | null>(null);

  const [history, setHistory] = useState<History>({ entries: [{ time: Date.now(), matrix: mainMatrix.clone() }], backsteps: 0 });
  const [currentOperation, setCurrentOperation] = useState<Operation | null>(null);
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [historyChangeSinceLastDimensionChange, setHistoryChangeSinceLastDimensionChange] = useState(true);

  function addHistoryEntry(matrix: Matrix) {
    const newEntry = {
      time: Date.now(),
      matrix: matrix.clone()
    };

    if (history.backsteps > 0) {
      setHistory({ entries: [...history.entries.slice(0, history.entries.length - history.backsteps), newEntry], backsteps: 0 });
    } else {
      setHistory({ entries: [...history.entries, newEntry], backsteps: 0 });
    }

    setHistoryChangeSinceLastDimensionChange(true);
  }

  function startOperation(operationTypeName: OperationTypeName) {
    const operation = newOperation(operationTypeName);
    // operationInstruction!.textContent = `Select ${operation.type.selectionSize} ${operation.type.interactionTarget}` + (operation.type.selectionSize > 1 ? 's' : '');
    setCurrentOperation(operation);
    setCurrentInstructionIndex(0);
  }

  function executeOperation() {
    if (currentOperation === null) {
      return;
    }

    const modifiedCells: [number, number][] = [];

    if (currentOperation.type.requiresScalar) {
      try {
        const scalar = parseScalar(prompt(currentOperation.type.instructions[currentInstructionIndex + 1])!);
        currentOperation.scalar = scalar;
      } catch (e) {
        console.error(e);
        alert('Invalid scalar value');
        setCurrentOperation(null);
        return;
      }

    }

    const matrixSetter = currentOperation.targetMatrix === mainMatrix ? setMainMatrix : currentOperation.targetMatrix === multiplyingMatrix ? setMultiplyingMatrix : setResultMatrix;
    const matrixModifiedCellsSetter = currentOperation.targetMatrix === mainMatrix ? setMainMatrixModifiedCells : currentOperation.targetMatrix === multiplyingMatrix ? setMultiplyingMatrixModifiedCells : setResultMatrixModifiedCells;

    currentOperation.selectedInteractionElements.forEach(ie => ie.classList.remove('selected'));
    const newMatrix = currentOperation.type.execute(currentOperation.targetMatrix!.clone(), currentOperation, modifiedCells);
    matrixSetter(newMatrix);
    matrixModifiedCellsSetter(modifiedCells);

    addHistoryEntry(newMatrix);
    setCurrentOperation(null);
  }

  function transpose() {
    setMainMatrix(mainMatrix.transpose());
  }

  function showDeterminant() {
    if (mainMatrix.rows != mainMatrix.columns) {
      alert('The matrix must be square');
      return;
    }

    alert(`The determinant of the matrix is ${mainMatrix.determinant()}`);
  }

  function inverse() {
    if (mainMatrix.rows != mainMatrix.columns) {
      alert('The matrix must be square');
      return;
    }

    const determinant = mainMatrix.determinant();
    if (determinant.equals(new Scalar(0))) {
      alert('The matrix is singular');
      return;
    }

    const inverseMatrix = mainMatrix.inverse();

    setMainMatrix(inverseMatrix);
    addHistoryEntry(mainMatrix);
  }

  function rref() {
    const newMatrix = mainMatrix.rref();
    setMainMatrix(newMatrix);
    addHistoryEntry(newMatrix);
  }

  function copyLatex() {
    const latex = '\\begin{bmatrix}\n' + mainMatrix.data.map(row => row.map(value => value.toString()).join(' & ')).join(' \\\\\n') + '\n\\end{bmatrix}';
    navigator.clipboard.writeText(latex);
  }

  function raiseToPower() {
    if (mainMatrix.rows != mainMatrix.columns) {
      alert('The matrix must be square');
      return;
    }

    try {
      const input = prompt('Enter the power to raise the matrix to');
      if (input === null) {
        return;
      }

      const power = parseScalar(input).simplify();

      if (power.denominator !== 1) {
        alert('The power must be an integer');
        return;
      }

      const newMatrix = mainMatrix.raiseToPower(power.numerator);

      // Set modified cells
      const modifiedCells: [number, number][] = [];
      for (let i = 0; i < mainMatrix.rows; i++) {
        for (let j = 0; j < mainMatrix.columns; j++) {
          if (!mainMatrix.data[i][j].equals(newMatrix.data[i][j])) {
            modifiedCells.push([i, j]);
          }
        }
      }

      setMainMatrix(newMatrix);
      addHistoryEntry(newMatrix);
      setMainMatrixModifiedCells(modifiedCells);
    } catch (e) {
      console.error(e);
      alert(e);
    }
  }

  function updateMatrixDimensions(matrix: Matrix, matrixSetter: (value: SetStateAction<Matrix>) => void, rows: number, columns: number) {
    if (isNaN(rows) || isNaN(columns) || rows < 1 || columns < 1) {
      return;
    }

    const newMatrix = new Matrix(rows, columns, Array.from({ length: rows }, () => Array.from({ length: columns }, () => new Scalar(0))));

    for (let i = 0; i < Math.min(rows, matrix.rows); i++) {
      for (let j = 0; j < Math.min(columns, matrix.columns); j++) {
        newMatrix.data[i][j] = matrix.data[i][j];
      }
    }

    matrixSetter(newMatrix);
    if (historyChangeSinceLastDimensionChange) {
      addHistoryEntry(newMatrix);
    } else {
      // Replace the last entry with the new matrix
      setHistory({ entries: history.entries.slice(0, history.entries.length - 1).concat({ time: Date.now(), matrix: newMatrix.clone() }), backsteps: history.backsteps });
    }
    setHistoryChangeSinceLastDimensionChange(false);
  }

  function historyBackstepTo(entryIndex: number) {
    setMainMatrix(history.entries[entryIndex].matrix);
    setHistory({ entries: history.entries, backsteps: history.entries.length - 1 - entryIndex });
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (event.key === 'Escape') {
      setCurrentOperation(null);
    } else if (event.ctrlKey) {
      if (event.key === 'z') {
        if (history.entries.length > 1) {
          historyBackstepTo(history.entries.length - 2);
        }
        event.preventDefault();
      } else if (event.key === 'y') {
        if (history.backsteps > 0) {
          historyBackstepTo(history.entries.length - history.backsteps);
        }
        event.preventDefault();
      } else if (event.key === 'c') {
        copyLatex();
      }
    } else {
      for (const [operationTypeName, operationType] of Object.entries(operationsDict)) {
        if (operationType.keyboardShortcut === event.key) {
          startOperation(operationTypeName);
          event.preventDefault();
          return;
        }
      }
    }
  }

  function onSelect(matrix: Matrix, index: number, interactionElement: HTMLElement) {
    if (currentOperation) {
      if (currentOperation.targetMatrix == null) {
        currentOperation.targetMatrix = matrix;
      }

      currentOperation.selection.push(index);
      currentOperation.selectedInteractionElements.push(interactionElement);

      if (currentOperation.selection.length >= currentOperation.type.selectionSize) {
        executeOperation();
      } else {
        interactionElement.classList.add('selected');
        setCurrentInstructionIndex(currentInstructionIndex + 1);
      }
    }
  }

  function getInteractionFor(matrix: Matrix) {
    if (matrix == resultMatrix) return undefined;

    if (currentOperation) {
      if (currentOperation.targetMatrix == null || currentOperation.targetMatrix === matrix) {
        return currentOperation.type.interaction;
      } else {
        return undefined;
      }
    } else {
      return 'edit-cell';
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    }
  });

  useEffect(() => {
    if (multiplicationMode) {
      if (mainMatrix.columns !== multiplyingMatrix.rows) {
        setResultMatrix(null);
      } else {
        setResultMatrix(mainMatrix.multiply(multiplyingMatrix));
      }
    }
  }, [mainMatrix, multiplyingMatrix, multiplicationMode]);

  useEffect(() => {
    setHighlightedMatrix(null);
  }, [multiplicationMode]);

  return (
    <>
      <div className="main-container">
        <div className="header">
          <img src='/logo.png' alt="Matrix Playground logo" width={50} />
          <h1>Matrix playground</h1>
        </div>
        <div id="main-area" className={currentOperation !== null ? 'operation-selected' : ''}>
          <div id="top-controls-container">
            <div className="current-operation-indicator">
              <div id="operation-instruction">{currentOperation?.type.instructions[currentInstructionIndex]}</div>
              <div>Press ESC to cancel.</div>
            </div>
            <div className="left-side-buttons">
              <div>
                <button className="blue" onClick={_ => { startOperation('swap_rows') }}>Swap rows</button>
                <button className="green" onClick={_ => { startOperation('add_rows') }}>Add rows</button>
                <button className="cyan" onClick={_ => { startOperation('multiply_row') }}>Multiply row</button>
              </div>
              <div>
                <button className="blue" onClick={_ => { startOperation('swap_columns') }}>Swap columns</button>
                <button className="green" onClick={_ => { startOperation('add_columns') }}>Add columns</button>
                <button className="cyan" onClick={_ => { startOperation('multiply_column') }}>Multiply column</button>
              </div>
            </div>
            <div className="right-side-buttons">
              <button className="red" onClick={_ => { startOperation('delete_row') }}>Delete row</button>
              <button className="red" onClick={_ => { startOperation('delete_column') }}>Delete column</button>
            </div>
          </div>
          <div id="middle-controls-container">
            <div className="left-side-buttons">
              <div>
                <button className="blue" onClick={_ => { transpose() }}>Transpose</button>
              </div>
              <div>
                <button className="green" onClick={_ => { rref() }}>RREF</button>
              </div>
              <div>
                <button className="cyan" onClick={_ => { inverse() }}>Inverse</button>
              </div>
              <div>
                <button className="yellow" onClick={_ => { showDeterminant() }}>Determinant</button>
              </div>
            </div>
            <div className="matrix-container">
              <MatrixHTML highlightColor={highlightedMatrix == 'main' ? "blue" : undefined} big matrix={mainMatrix} onCellChanged={(row, col, val) => {
                const newMatrix = mainMatrix.set(row, col, val);
                setMainMatrix(newMatrix);
                addHistoryEntry(newMatrix);
              }} interaction={getInteractionFor(mainMatrix)} selectionCallback={onSelect} modifiedCells={mainMatrixModifiedCells} />
              <DimensionInput rows={mainMatrix.rows} columns={mainMatrix.columns} onDimensionChange={(rows, columns) => updateMatrixDimensions(mainMatrix, setMainMatrix, rows, columns)} readonly={currentOperation != null} />
            </div>
            {multiplicationMode && (
              <>
                <div className="symbol-container">
                  <div>&times;</div>
                </div>
                <div className="matrix-container">
                  <MatrixHTML highlightColor={highlightedMatrix == 'multiplying' ? "green" : undefined} big matrix={multiplyingMatrix} onCellChanged={(row, col, val) => {
                    const newMatrix = multiplyingMatrix.set(row, col, val);
                    setMultiplyingMatrix(newMatrix);
                  }} interaction={getInteractionFor(multiplyingMatrix)} selectionCallback={onSelect} modifiedCells={multiplyingMatrixModifiedCells} />
                  <DimensionInput rows={multiplyingMatrix.rows} columns={multiplyingMatrix.columns} onDimensionChange={(rows, columns) => updateMatrixDimensions(multiplyingMatrix, setMultiplyingMatrix, rows, columns)} readonly={currentOperation != null} />
                </div>
                <div className="symbol-container">
                  <div>=</div>
                </div>
                <div className="matrix-container">
                  {
                    resultMatrix == null ? <div className="incompatible-matrices-msg"><h1>Undefined</h1>Incompatible dimensions</div> :
                      <MatrixHTML highlightColor={highlightedMatrix == 'result' ? "cyan" : undefined} big matrix={resultMatrix} onCellChanged={(row, col, val) => {
                        const newMatrix = resultMatrix.set(row, col, val);
                        setResultMatrix(newMatrix);
                      }} interaction={getInteractionFor(resultMatrix)} />
                  }
                  <DimensionInput rows={resultMatrix?.rows} columns={resultMatrix?.columns} readonly />
                </div>
              </>
            )}
            {multiplicationMode ?
              <div className="right-side-buttons">
                <div>
                  <button className="blue" onClick={_ => {
                    setMultiplicationMode(false);
                  }} onMouseEnter={_ => setHighlightedMatrix('main')} onMouseLeave={_ => setHighlightedMatrix(null)}
                  >Select multiplied</button>
                </div>
                <div>
                  <button className="green" onClick={_ => {
                    setMultiplicationMode(false);
                    setMainMatrix(multiplyingMatrix);
                    setMultiplyingMatrix(mainMatrix);
                  }} onMouseEnter={_ => setHighlightedMatrix('multiplying')} onMouseLeave={_ => setHighlightedMatrix(null)}
                  >Select multiplying</button>
                </div>
                <div>
                  <button className="cyan" onClick={_ => {
                    if (resultMatrix != null) {
                      setMultiplicationMode(false);
                      setMainMatrix(resultMatrix.clone());
                    }
                  }} onMouseEnter={_ => setHighlightedMatrix('result')} onMouseLeave={_ => setHighlightedMatrix(null)}
                    disabled={resultMatrix == null}>Select result</button>
                </div>
              </div>
              :
              <div className="right-side-buttons">
                <div>
                  <button className="blue" onClick={_ => {
                    setMultiplicationMode(true);
                  }}>Multiply by</button>
                </div>
                <div>
                  <button className="green" onClick={_ => {
                    setMultiplicationMode(true);
                    setMainMatrix(multiplyingMatrix);
                    setMultiplyingMatrix(mainMatrix);
                  }}>Multiply other</button>
                </div>
                <div>
                  <button className="cyan" onClick={raiseToPower}>Raise to power</button>
                </div>
              </div>
            }
          </div>
          <div id="bottom-controls-container">

          </div>
        </div>
        <HistoryBar history={history}
          onEntryClicked={historyBackstepTo}

          onClear={
            () => {
              const selectedEntryIndex = history.entries.length - 1 - history.backsteps;
              setHistory({ entries: history.entries.slice(selectedEntryIndex, selectedEntryIndex + 1), backsteps: 0 });
            }
          } />
      </div >
    </>
  );
}
