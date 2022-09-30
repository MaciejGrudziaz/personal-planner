type BooleanComparisionPolicy = (currentVal: boolean, newValue: boolean) => boolean;

function or(currentVal: boolean, newValue: boolean): boolean {
    return currentVal || newValue;
}


function and(currentVal: boolean, newValue: boolean): boolean {
    return currentVal && newValue;
}

function useLast(currentVal: boolean, newValue: boolean): boolean {
    return newValue;
}

type NegationPolicy = (val: boolean) => boolean;

function useNegate(val: boolean): boolean {
    return !val;
}

function noNegate(val: boolean): boolean {
    return val;
}

class ComparableValue {
    val: any;
    result: boolean;
    enforceBooleanPolicy: BooleanComparisionPolicy;
    negateResult: NegationPolicy;

    constructor(val: any, result?: boolean, comparisionPolicy?: BooleanComparisionPolicy, negationPolicy?: NegationPolicy) {
        this.val = val;
        this.result = (result !== undefined) ? result : false;
        this.enforceBooleanPolicy = (comparisionPolicy !== undefined) ? comparisionPolicy : useLast;
        this.negateResult = (negationPolicy !== undefined) ? negationPolicy : noNegate;
    }

    get isNumber(): ComparableValue {
        return new ComparableValue(this.val, this.enforceBooleanPolicy(this.result, this.negateResult(typeof this.val === "number")));
    }

    get isString(): ComparableValue {
        return new ComparableValue(this.val, this.enforceBooleanPolicy(this.result, this.negateResult(typeof this.val === "string")));
    }

    get isDate(): ComparableValue {
        return  new ComparableValue(this.val, this.enforceBooleanPolicy(this.result, this.negateResult(this.val instanceof Date)));
    }

    get isNull(): ComparableValue {
        return new ComparableValue(this.val, this.enforceBooleanPolicy(this.result, this.negateResult(this.val === null)));
    }

    get isUndefined(): ComparableValue {
        return  new ComparableValue(this.val , this.enforceBooleanPolicy(this.result, this.negateResult(this.val === undefined)));
    }

    equals(checkVal: any): ComparableValue {
        return new ComparableValue(this.val, this.enforceBooleanPolicy(this.result, this.negateResult(checkVal === this.val)));
    }

    get or(): ComparableValue {
        return new ComparableValue(this.val, this.result, or);
    }

    is(val: ComparableValue): ComparableValue {
        return new ComparableValue(this.val, this.enforceBooleanPolicy(this.result, this.negateResult(val.result)));
    }

    get and(): ComparableValue {
        return new ComparableValue(this.val, this.result, and);
    }

    get not(): ComparableValue {
        return new ComparableValue(this.val, this.result, this.enforceBooleanPolicy, useNegate);
    }
}

export function check(val: any): ComparableValue {
    return new ComparableValue(val);
}

export function areAllCorrect(values: ComparableValue[]): boolean {
    return values.find((value: ComparableValue) => {
        return value.result === false;
    }) === undefined;
}

