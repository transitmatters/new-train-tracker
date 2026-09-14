// Stands in for `import './Foo.css'`, which jest cannot parse.
// The app uses plain global CSS imported for its side effect only, so an empty
// object is a complete stand-in (identity-obj-proxy would only help if we
// asserted on CSS Module class names, which we never do).
// eslint-disable-next-line import/no-default-export -- jest moduleNameMapper requires a default export
export default {};
