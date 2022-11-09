export function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
  const value = descriptor.value;
  const adjustedDescriptor = {
    configurable: true,
    enumerable: false,
    get() {
      const bindFn = value.bind(this);
      return bindFn;
    },
  };
  return adjustedDescriptor;
}
