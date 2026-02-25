// VUE渲染怎么保留模板中的HTML注释
// 在Vue中，默认情况下，模板中的HTML注释会被移除。如果你想保留这些注释，可以使用Vue的`v-html`指令来渲染包含注释的HTML字符串。以下是一个示例：
export default {
  data() {
    return {
      htmlString: '<div><!-- 这是一个注释 --></div>'
    };
  }
};