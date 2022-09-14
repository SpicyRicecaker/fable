// code for monads inspired by https://github.com/emmanueltouzery/prelude-ts and https://www.youtube.com/watch?v=C2w45qRc3aU
export type Option<T> = Some<T> | None<T>

class Some<T> {
  // see https://stackoverflow.com/a/47841595/11742422
  // basically, if we don't add this line, then the compiler will treat some `Option<number>`s as simply `number`s, making type checking kind of pointless
  readonly className: 'Some' = <any>undefined
  value: T
  // just like in rust, whenever you define an option, you always return a
  // variant of option and not the actual type itself
  constructor(value: T) {
    this.value = value
  }
}

class None<T> {
  readonly className: 'None' = <any>undefined
}

const none = new None<any>()

export class Monad {
  static map<T>(monad: Option<T>, bind: (monad: T) => Option<T>): Option<T> {
    if (monad === <None<T>>none) {
      return <None<T>>none
    }
    return bind((<Some<T>>monad).value)
  }
  static some<T>(value: T): Some<T> {
    return new Some<T>(value)
  }
  static none<T>(): None<T> {
    return <None<T>>none
  }
}
