import { Matrix, Scalar } from "./math";

export type Interaction = 'select-row' | 'select-column' | 'edit-cell';

export type OperationType = {
    name: string;
    interaction: Interaction;
    selectionSize: number;
    requiresScalar: boolean;
    instructions: string[];
    keyboardShortcut?: string;
    execute: (matrix: Matrix, operation: Operation, modifiedCells: [number, number][]) => Matrix;
};

export type Operation = {
    type: OperationType;
    targetMatrix: Matrix | null;
    selection: number[];
    scalar?: Scalar;
    selectedInteractionElements: HTMLElement[];
};

export const operationsDict: { [key: string]: OperationType } = {
    "swap_rows": {
        name: "Swap Rows",
        interaction: "select-row",
        selectionSize: 2,
        requiresScalar: false,
        instructions: [
            "Select the first row to swap.",
            "Select the second row to swap."
        ],
        execute: (matrix, operation, modifiedCells) => {
            const firstRow = matrix.data[operation.selection[0]];
            matrix.data[operation.selection[0]] = matrix.data[operation.selection[1]];
            matrix.data[operation.selection[1]] = firstRow;
            
            for (let i = 0; i < matrix.data[0].length; i++) {
                modifiedCells.push([operation.selection[0], i], [operation.selection[1], i]);
            }
            
            return matrix;
        },
        keyboardShortcut: 'r'
    },

    "swap_columns": {
        name: "Swap Columns",
        interaction: "select-column",
        selectionSize: 2,
        requiresScalar: false,
        instructions: [
            "Select the first column to swap.",
            "Select the second column to swap."
        ],
        execute: (matrix, operation, modifiedCells) => {
            for (let i = 0; i < matrix.rows; i++) {
                const firstColumn = matrix.data[i][operation.selection[0]];
                matrix.data[i][operation.selection[0]] = matrix.data[i][operation.selection[1]];
                matrix.data[i][operation.selection[1]] = firstColumn;

                modifiedCells.push([i, operation.selection[0]], [i, operation.selection[1]]);
            }

            return matrix;
        },
        keyboardShortcut: 'c'
    },

    "add_rows": {
        name: "Add Rows",
        interaction: "select-row",
        selectionSize: 2,
        requiresScalar: true,
        instructions: [
            "Select the source row.",
            "Select the destination row.",
            "Enter the scalar to multiply the source row by."
        ],
        execute: (matrix, operation, modifiedCells) => {
            matrix.data[operation.selection[1]] = matrix.data[operation.selection[1]].map((value, i) => value.add(matrix.data[operation.selection[0]][i].multiply(operation.scalar!)));

            for (let i = 0; i < matrix.data[0].length; i++) {
                modifiedCells.push([operation.selection[1], i]);
            }
            
            return matrix;
        },
        keyboardShortcut: 'a'
    },

    "add_columns": {
        name: "Add Columns",
        interaction: "select-column",
        selectionSize: 2,
        requiresScalar: true,
        instructions: [
            "Select the source column.",
            "Select the destination column.",
            "Enter the scalar to multiply the source column by."
        ],
        execute: (matrix, operation, modifiedCells) => {
            for (let i = 0; i < matrix.rows; i++) {
                matrix.data[i][operation.selection[1]] = matrix.data[i][operation.selection[1]].add(matrix.data[i][operation.selection[0]].multiply(operation.scalar!));
                modifiedCells.push([i, operation.selection[1]]);
            }

            return matrix;
        }
    },

    "multiply_row": {
        name: "Multiply Row",
        interaction: "select-row",
        selectionSize: 1,
        requiresScalar: true,
        instructions: [
            "Select the row to multiply.",
            "Enter the scalar to multiply the row by."
        ],
        execute: (matrix, operation, modifiedCells) => {
            matrix.data[operation.selection[0]] = matrix.data[operation.selection[0]].map(value => value.multiply(operation.scalar!));

            for (let i = 0; i < matrix.data[0].length; i++) {
                modifiedCells.push([operation.selection[0], i]);
            }

            return matrix;
        },
        keyboardShortcut: 'm'
    },

    "multiply_column": {
        name: "Multiply Column",
        interaction: "select-column",
        selectionSize: 1,
        requiresScalar: true,
        instructions: [
            "Select the column to multiply.",
            "Enter the scalar to multiply the column by."
        ],
        execute: (matrix, operation, modifiedCells) => {
            for (let i = 0; i < matrix.rows; i++) {
                matrix.data[i][operation.selection[0]] = matrix.data[i][operation.selection[0]].multiply(operation.scalar!);
                modifiedCells.push([i, operation.selection[0]]);
            }

            return matrix;
        }
    },

    "delete_row": {
        name: "Delete Row",
        interaction: "select-row",
        selectionSize: 1,
        requiresScalar: false,
        instructions: [
            "Select the row to delete."
        ],
        execute: (matrix, operation, modifiedCells) => {
            const newMatrix = new Matrix(matrix.rows - 1, matrix.columns);
            for (let i = 0; i < matrix.rows; i++) {
                if (i < operation.selection[0]) {
                    newMatrix.data[i] = matrix.data[i];
                } else if (i > operation.selection[0]) {
                    newMatrix.data[i - 1] = matrix.data[i];
                }
            }

            return newMatrix;
        },
        keyboardShortcut: 'd'
    },

    "delete_column": {
        name: "Delete Column",
        interaction: "select-column",
        selectionSize: 1,
        requiresScalar: false,
        instructions: [
            "Select the column to delete."
        ],
        execute: (matrix, operation, modifiedCells) => {
            const newMatrix = new Matrix(matrix.rows, matrix.columns - 1);
            
            for (let i = 0; i < matrix.rows; i++) {
                for (let j = 0; j < matrix.columns; j++) {
                    if (j < operation.selection[0]) {
                        newMatrix.data[i][j] = matrix.data[i][j];
                    } else if (j > operation.selection[0]) {
                        newMatrix.data[i][j - 1] = matrix.data[i][j];
                    }
                }
            }

            return newMatrix;
        }
    }
}

export type OperationTypeName = keyof typeof operationsDict;

export function newOperation(name: OperationTypeName): Operation {
    return {
        type: operationsDict[name],
        targetMatrix: null,
        selection: [],
        scalar: undefined,
        selectedInteractionElements: []
    };
}
