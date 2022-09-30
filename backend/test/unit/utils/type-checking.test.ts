import { check, areAllCorrect } from "../../../utils/type-checking";

test("utils::type-checking::isNumber", () => {
    expect(check(1).isNumber.result).toBeTruthy();
    expect(check(999.99).isNumber.result).toBeTruthy();
    expect(check("test").isNumber.result).toBeFalsy();
});

test("utils::type-checking::isDate", () => {
    expect(check(new Date("2022-01-01")).isDate.result).toBeTruthy();
    expect(check(123).isDate.result).toBeFalsy();
});

test("utils::type-checking::isNull", () => {
    expect(check(null).isNull.result).toBeTruthy();
    expect(check(undefined).isNull.result).toBeFalsy();
});

test("utils::type-checking::isUndefined", () => {
    expect(check(undefined).isUndefined.result).toBeTruthy();
    expect(check("").isUndefined.result).toBeFalsy();
});

test("utils::type-checking::equals", () => {
    expect(check(123).equals(123).result).toBeTruthy();
    expect(check(1.23).equals(1.23).result).toBeTruthy();
    expect(check("test").equals("test").result).toBeTruthy();
    expect(check(new Date("2022-09-01")).equals(new Date("2022-09-01")).result).toBeFalsy();
    expect(check(new Date("2022-01-01").getTime()).equals(new Date("2022-01-01").getTime()).result).toBeTruthy();
    expect(check(null).equals(null).result).toBeTruthy();
    expect(check(undefined).equals(undefined).result).toBeTruthy();
    expect(check("999").equals(999).result).toBeFalsy();
    expect(check(null).equals(undefined).result).toBeFalsy();
    expect(check(new Date(2022, 0, 1)).equals(new Date(2022, 0, 1).getTime()).result).toBeFalsy;
});

test("utils::type-checking::useLastResultInChain", () => {
    expect(check(123).isDate.isNumber.result).toBeTruthy();
    expect(check(123).isNumber.isDate.result).toBeFalsy();
    expect(check(123).isNumber.and.equals(123).isUndefined.result).toBeFalsy();
    expect(check(123).isNumber.or.isDate.isString.result).toBeFalsy();
    expect(check(123).isString.or.isNull.isNumber.result).toBeTruthy();
});

test("utils::type-checking::or", () => {
    expect(check("test").isString.or.isNumber.result).toBeTruthy();
    expect(check("test").isNumber.or.isString.result).toBeTruthy();
    expect(check("test").isNumber.or.isString.or.isDate.or.isNull.result).toBeTruthy();
});

test("utils::type-checking::and", () => {
    expect(check(0).isNumber.and.equals(0).result).toBeTruthy();
    expect(check(0).equals(0).and.isNumber.result).toBeTruthy();
    expect(check(0).isNumber.and.isString.result).toBeFalsy();
    expect(check(0).isNumber.and.not.isString.and.not.isDate.result).toBeTruthy();
});

test("utils::type-checking::not", () => {
    expect(check("test").not.isNumber.result).toBeTruthy();
    expect(check("test").isString.and.not.equals("abc").result).toBeTruthy();
    expect(check("test").not.isNumber.and.not.isDate.and.not.isNull.and.isString.result).toBeTruthy();
});

test("utils::type-checking::comparisionOperationsOrder", () => {
    expect(check(123).isNumber.and.equals(123).or.isNull.result).toBeTruthy();
    expect(check(null).isNumber.and.equals(123).or.isNull.result).toBeTruthy();

    expect(check(1).isNumber.and.equals(1).or.isString.and.equals("1").result).toBeFalsy();
    expect((check(1).isNumber.and.equals(1)).or.is(check(1).isString.and.equals("1")).result).toBeTruthy();
    expect((check(1).isNumber.or.isNull).and.is(check("test").isString.or.isNull).result).toBeTruthy();
});

test("utils::type-checking::areAllCorrect", () => {
    expect(areAllCorrect([check(1).isNumber, check("test").isString, check(new Date(2011)).isDate])).toBeTruthy();
    expect(areAllCorrect([check(1).isUndefined, check("test").isString, check(new Date(2011)).isDate])).toBeFalsy();
});

