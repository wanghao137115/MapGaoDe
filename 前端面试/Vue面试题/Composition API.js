// optionAPI 的问题是当组件变得复杂时，data、methods、computed 等选项会变得混乱，难以维护和理解。Composition API 通过将相关的逻辑组织在一起，使代码更清晰、更易于维护。
// Composition API 允许开发者将组件的逻辑分解成更小、更可重用的函数，这些函数可以在多个组件之间共享。这种方式使得代码更模块化，增强了代码的可读性和可维护性。

// 和React Hook类比 useState == ref()  useMemo == computed()  useEffect == watch()

// Vue2中使用Vue.mixin会出现，名称重复，数据来源不明确等问题。 Composition API 通过提供一个更灵活的方式来组织组件逻辑，避免了这些问题。开发者可以将相关的逻辑放在一起，而不必担心命名冲突或数据来源不明确的问题。