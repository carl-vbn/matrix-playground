import { useEffect, useRef, useState } from "react";
import { Matrix, Scalar, parseScalar } from "./math";
import { Interaction } from "./operations";
export default function MatrixHTML(props: {
    matrix: Matrix,
    onCellChanged?: (row: number, col: number, value: Scalar) => void,
    big?: boolean,
    interaction?: Interaction,
    selectionCallback?: (matrix: Matrix, index: number, interactionElement: HTMLElement) => void,
    modifiedCells?: [number, number][],
    highlightColor?: string
}) {
    const matrixTable = useRef<HTMLTableElement>(null);

    const [editedCell, setEditedCell] = useState<[number, number] | null>(null);
    const [editedValue, setEditedValue] = useState('');

    function getMatrixInputWidthPX(value: string | Scalar, isBig = false) {
        const numberOfCharacters = value.toString().length;
        if (isBig) {
            return numberOfCharacters * 22 + 52;
        } else {
            return numberOfCharacters * 8 + 17;
        }
    }

    function onNumberChange(event: React.ChangeEvent<HTMLInputElement>) {
        const inputField = event.target;
        const [row, col]: [number, number] = inputField?.className?.match(/matrix-input-(\d+)-(\d+)/)?.slice(1).map(Number) as [number, number];
        const oldValue = props.matrix.data[row][col];
        try {
            const value = parseScalar(inputField.value).simplify();

            inputField.value = value.toString();
            inputField.style.width = `${getMatrixInputWidthPX(value, true)}px`;

            if (!oldValue.equals(value)) {
                if (props.onCellChanged) props.onCellChanged(row, col, value);
                markCellsAsModified([[row, col]]);
            }

            inputField.blur();
            setEditedCell(null);
        } catch (error) {
            console.error(error);
            event.preventDefault();

            // Reset cell value to previous value
            inputField.value = oldValue.toString();
            inputField.style.width = `${getMatrixInputWidthPX(oldValue, true)}px`;
        }
    }

    function markCellsAsModified(cells: [number, number][]) {
        for (const cellCoordinates of cells) {
            const cell = matrixTable.current!.querySelector(`.matrix-input-${cellCoordinates[0]}-${cellCoordinates[1]}`);
            cell!.classList.add('modified');
        }

        setTimeout(() => {
            for (const cellCoordinates of cells) {
                const cell = matrixTable.current!.querySelector(`.matrix-input-${cellCoordinates[0]}-${cellCoordinates[1]}`);
                cell!.classList.remove('modified');
            }
        }, 1000);
    }

    function onNumberInput(event: React.FormEvent<HTMLInputElement>) {
        const inputField = event.target as HTMLInputElement;
        let value = inputField.value;

        // Remove all characters that are not a digit, a dot, a minus sign or a slash
        value = value.replace(/[^0-9.\-/]/g, '');

        inputField.value = value;

        inputField.style.width = `${getMatrixInputWidthPX(value, true)}px`;
    }

    useEffect(() => {
        if (props.modifiedCells) {
            markCellsAsModified(props.modifiedCells);
        }
    }, [props.modifiedCells]);
        


    return (
        <div className={`matrix-grid${props.highlightColor ? ` highlight-${props.highlightColor}` : ''}`}>
            <div className="matrix-border-tl"></div>
            <div className="matrix-border-h">
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div className="matrix-border-tr"></div>
            <div className="matrix-border-v"></div>
            <table className="matrix" ref={matrixTable}>
                <tbody>
                    {Array.from({ length: props.matrix.rows }, (_, i) => (
                        <tr key={i}>
                            {Array.from({ length: props.matrix.columns }, (_, j) => {
                                const value = props.matrix.data[i][j];
                                const beingEdited = editedCell !== null && editedCell[0] === i && editedCell[1] === j;
                                return (
                                    <td key={j}>
                                        <input
                                            type="text"
                                            className={`matrix-input-${i}-${j}`}
                                            onInput={onNumberInput}
                                            onFocus={
                                                () => {
                                                    setEditedCell([i, j]);
                                                    setEditedValue(value.toString());
                                                }
                                            }
                                            onBlur={onNumberChange}
                                            onKeyDown={
                                                (e) => {
                                                    if (e.key === 'Enter') {
                                                        e.currentTarget.blur();
                                                    }
                                                }
                                            }
                                            onChange={
                                                (e) => {
                                                    setEditedValue(e.target.value);
                                                }
                                            }
                                            value={beingEdited ? editedValue : value.toString()}
                                            style={{ width: `${getMatrixInputWidthPX(value, props.big)}px` }}
                                            readOnly={props.interaction != 'edit-cell'}
                                        />
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="matrix-border-v"></div>
            <div className="matrix-border-bl"></div>
            <div className="matrix-border-h">
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div className="matrix-border-br"></div>
            {(props.interaction == 'select-row' || props.interaction == 'select-column') &&
                <div className={`interaction-overlay ${props.interaction}`}>
                    {Array(props.interaction == 'select-row' ? props.matrix.rows : props.matrix.columns).fill(undefined).map((_, i) => <div key={`interactionelem_${i}`} onClick={
                        (e) => {
                            if (props.selectionCallback) {
                                props.selectionCallback(props.matrix, i, e.currentTarget as HTMLElement);
                            }
                        }
                    }></div>)}
                </div>
            }
        </div>
    );
}