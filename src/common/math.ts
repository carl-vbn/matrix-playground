export class Matrix {
    rows: number;
    columns: number;
    data: Scalar[][];

    constructor(rows: number, columns: number, data: (Scalar | number)[][] | null = null) {
        this.rows = rows;
        this.columns = columns;

        if (data === null) {
            this.data = Array.from({ length: rows }, () => Array.from({ length: columns }, () => new Scalar(0)));
        } else {
            if (data.length != rows || data.some(row => row.length != columns)) {
                throw "Data does not match matrix dimensions";
            }

            this.data = data.map(row => row.map(cell => cell instanceof Scalar ? cell : new Scalar(cell)));
        }
    }

    clone(): Matrix {
        return new Matrix(this.rows, this.columns, this.data.map(row => row.map(cell => new Scalar(cell.numerator, cell.denominator))));
    }

    subMatrix(row: number, column: number): Matrix {
        return new Matrix(
            this.rows - 1,
            this.columns - 1,
            this.data.filter((_, i) => i != row).map(row => row.filter((_, j) => j != column))
        );
    }

    multiply(other: Matrix | Scalar): Matrix {
        if (other instanceof Scalar) {
            return new Matrix(this.rows, this.columns, this.data.map(row => row.map(cell => cell.multiply(other))));
        } else {
            if (this.columns != other.rows) {
                throw "Incompatible matrix dimensions";
            }

            return new Matrix(
                this.rows,
                other.columns,
                Array.from({ length: this.rows }, (_, i) =>
                    Array.from({ length: other.columns }, (_, j) =>
                        this.data[i].reduce((acc, cell, k) => acc.add(cell.multiply(other.data[k][j])), new Scalar(0))
                    )
                )
            );
        }
    }

    determinant(): Scalar {
        if (this.rows != this.columns) {
            throw "Matrix must be square";
        }

        if (this.rows === 1) {
            return this.data[0][0];
        }

        if (this.rows === 2) {
            return this.data[0][0].multiply(this.data[1][1]).subtract(this.data[0][1].multiply(this.data[1][0]));
        }

        return this.data[0].reduce((acc, cell, i) => acc.add(cell.multiply(this.subMatrix(0, i).determinant().multiply(new Scalar(Math.pow(-1, i))))), new Scalar(0));
    }

    transpose(): Matrix {
        return new Matrix(this.columns, this.rows, this.data[0].map((_, i) => this.data.map(row => row[i])));
    }

    inverse(): Matrix {
        if (this.rows != this.columns) {
            throw "Matrix must be square";
        }

        const determinant = this.determinant();
        if (determinant.equals(new Scalar(0))) {
            throw "Matrix is singular";
        }

        const cofactorMatrix = new Matrix(
            this.rows,
            this.columns,
            Array.from({ length: this.rows }, (_, i) =>
                Array.from({ length: this.columns }, (_, j) =>
                    this.subMatrix(i, j).determinant().multiply(new Scalar(Math.pow(-1, i + j)))
                )
            )
        );

        return cofactorMatrix.transpose().multiply(determinant.inverse());
    }

    // Return a new matrix that is the reduced row echelon form of the original matrix
    rref(): Matrix {
        const matrix = new Matrix(this.rows, this.columns, this.data);
        let lead = 0;

        for (let r = 0; r < matrix.rows; r++) {
            if (matrix.columns <= lead) {
                return matrix;
            }

            let i = r;
            while (matrix.data[i][lead].equals(new Scalar(0))) {
                i++;
                if (matrix.rows === i) {
                    i = r;
                    lead++;
                    if (matrix.columns === lead) {
                        return matrix;
                    }
                }
            }

            if (i !== r) {
                const temp = matrix.data[i];
                matrix.data[i] = matrix.data[r];
                matrix.data[r] = temp;
            }

            const div = matrix.data[r][lead];
            matrix.data[r] = matrix.data[r].map(cell => cell.divide(div));

            for (let i = 0; i < matrix.rows; i++) {
                if (i === r) {
                    continue;
                }

                const sub = matrix.data[i][lead];
                matrix.data[i] = matrix.data[i].map((cell, j) => cell.subtract(matrix.data[r][j].multiply(sub)));
            }

            lead++;
        }

        return matrix;
    }

    raiseToPower(power: number): Matrix {
        if (this.rows != this.columns) {
            throw "Matrix must be square";
        }

        if (Math.floor(power) !== power) {
            throw "Power must be an integer";
        }

        if (power === 0) {
            return new Matrix(this.rows, this.columns, this.data.map((_, i) => this.data.map((_, j) => i === j ? new Scalar(1) : new Scalar(0))));
        }

        if (power < 0) {
            return this.inverse().raiseToPower(-power);
        }

        return this.multiply(this.raiseToPower(power - 1));
    }

    set(row: number, col: number, val: Scalar) {
        const copy = this.clone();
        copy.data[row][col] = val;
        return copy;
    }
};

function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

export class Scalar {
    numerator: number;
    denominator: number;

    constructor(numerator: number, denominator: number = 1) {
        if (isNaN(numerator) || isNaN(denominator)) {
            throw new Error("Invalid fraction");
        }

        if (denominator === 0) {
            throw new Error("Denominator cannot be zero");
        }

        this.numerator = numerator;
        this.denominator = denominator;
    }

    simplify(): Scalar {
        const divisor = gcd(this.numerator, this.denominator);
        const simplifiedNumerator = this.numerator / divisor;
        const simplifiedDenominator = this.denominator / divisor;

        // Make sure the denominator is always positive
        if (simplifiedDenominator < 0) {
            return new Scalar(-simplifiedNumerator, -simplifiedDenominator);
        } else {
            return new Scalar(simplifiedNumerator, simplifiedDenominator);
        }
    }

    add(other: Scalar | number): Scalar {
        if (typeof other === "number") {
            other = new Scalar(other);
        }
        return new Scalar(
            this.numerator * other.denominator + other.numerator * this.denominator,
            this.denominator * other.denominator
        ).simplify();
    }

    subtract(other: Scalar | number): Scalar {
        if (typeof other === "number") {
            other = new Scalar(other);
        }
        return this.add(new Scalar(-other.numerator, other.denominator));
    }

    multiply(other: Scalar | number): Scalar {
        if (typeof other === "number") {
            other = new Scalar(other);
        }
        return new Scalar(
            this.numerator * other.numerator,
            this.denominator * other.denominator
        ).simplify();
    }

    divide(other: Scalar | number): Scalar {
        if (typeof other === "number") {
            other = new Scalar(other);
        }
        if (other.numerator === 0) {
            throw new Error("Division by zero");
        }
        return this.multiply(new Scalar(other.denominator, other.numerator));
    }

    inverse(): Scalar {
        if (this.numerator === 0) {
            throw new Error("Division by zero");
        }
        return new Scalar(this.denominator, this.numerator);
    }

    equals(other: Scalar): boolean {
        const selfSimplified = this.simplify();
        const otherSimplified = other.simplify();
        return (
            selfSimplified.numerator === otherSimplified.numerator &&
            selfSimplified.denominator === otherSimplified.denominator
        );
    }

    toString(): string {
        if (this.denominator === 1) {
            return this.numerator.toString();
        } else {
            return this.numerator + "/" + this.denominator;
        }
    }
}

export function parseScalar(string: string): Scalar {
    if (string.includes(".")) {
        const number = Number(string);

        if (isNaN(number)) {
            throw "Invalid number format";
        }

        const numberOfDecimals = string.split(".")[1].length;
        const denominator = Math.pow(10, numberOfDecimals);

        return new Scalar(number * denominator, denominator).simplify();
    }

    if (string.includes("/")) {
        const parts = string.split("/");

        if (parts.length != 2) {
            throw "Invalid fraction format";
        }

        return new Scalar(Number(parts[0]), Number(parts[1]));
    } else {
        return new Scalar(Number(string));
    }
}