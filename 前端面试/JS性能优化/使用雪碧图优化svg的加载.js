```
使用雪碧图（Sprite）来优化SVG加载，核心思路和优化图片是一样的：将多个SVG图标合并成一个文件，通过减少HTTP请求来提升加载速度。下面我来介绍两种主流的实现方法，你可以根据项目需求来选择。

🎯 方法一：使用 <symbol> + <use> (现代、灵活)
这是目前最推荐的方式。它将每个图标定义为一个 <symbol>，使用时通过 <use> 进行引用。

第一步：准备图标文件
在开始前，最好先对单个SVG图标做一点优化，能让后续使用更灵活：

使用 currentColor：在SVG代码中，将 fill 或 stroke 的属性值设置为 currentColor。这样，图标的颜色就可以直接继承父元素的CSS color 属性，方便通过主题或状态统一变色。

精简代码：可以使用 SVGO 这类工具，去除SVG文件中不必要的元数据、注释和冗余信息，减小文件体积。

第二步：合并图标
将处理好后的所有SVG图标合并到一个文件中（如 sprite.svg），合并后的文件结构大致如下：

svg
<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
  <symbol id="icon-home" viewBox="0 0 24 24">
    <!-- 这里是 home 图标的路径数据 -->
    <path d="..."/>
  </symbol>
  <symbol id="icon-user" viewBox="0 0 24 24">
    <!-- 这里是 user 图标的路径数据 -->
    <circle cx="12" cy="12" r="10"/>
  </symbol>
  <!-- 更多图标... -->
</svg>
手动合并很麻烦，通常借助自动化工具，后面会详细说明。

第三步：在HTML中使用
在需要显示图标的地方，通过 <use> 标签引用即可：

html
<!-- 引用 home 图标，设置宽高为24px，颜色继承父元素 -->
<svg width="24" height="24" fill="currentColor">
  <use href="/path/to/sprite.svg#icon-home"></use>
</svg>

<!-- 引用 user 图标，设置宽高为32px，并直接指定颜色为蓝色 -->
<svg width="32" height="32" style="color: blue;">
  <use href="/path/to/sprite.svg#icon-user"></use>
</svg>
如果Sprite文件是内联在HTML中的（即直接把 <symbol> 定义放在HTML里），那么 href 属性可以直接写 #icon-home。

🎨 方法二：作为CSS背景图 (传统)
这种方法更接近于传统的CSS Sprite，适合用于 ::before、::after 等伪元素或需要作为背景的元素。

第一步：创建Sprite
你需要将所有图标排列在一个文件中，并记下每个图标的位置。然后通过CSS的 background-position 来控制显示哪个图标。

第二步：定义CSS

css
.icon {
  display: inline-block;
  width: 24px;  /* 每个图标的宽度 */
  height: 24px; /* 每个图标的高度 */
  background-image: url('sprite.svg');
  background-repeat: no-repeat;
}

.icon-home {
  background-position: 0 0; /* 显示第一个图标 */
}

.icon-user {
  background-position: -24px 0; /* 向左移动24px，显示第二个图标 */
}
第三步：在HTML中使用

html
<span class="icon icon-home"></span>
<span class="icon icon-user"></span>
这种方法不如图标字体或 <symbol> 方式灵活，因为尺寸和颜色调整都比较麻烦，且在高分辨率屏幕下可能需要额外适配。

🛠️ 自动化工具推荐
手动维护一个包含几十个图标的Sprite文件是不现实的。在实际项目中，我们通常会使用构建工具来自动化这个过程：

Webpack：配合 svg-sprite-loader 插件，它可以自动将指定文件夹下的所有SVG文件打包成一个Sprite，并在代码中按需引入。

Vite：可以使用 vite-plugin-svg-icons 插件，实现类似的功能，开发体验非常流畅。

Node.js 工具：svg-sprite 是一个功能强大的Node.js库，提供了CLI和API，可以独立于构建系统使用，帮助你生成Sprite文件。

Eleventy 插件：如果你使用 Eleventy 静态站点生成器，eleventy-plugin-svg-sprite 可以很方便地集成。

⚠️ 关键注意事项
浏览器缓存：如果更新了Sprite文件后图标没有变化，可能是浏览器缓存了旧版本。可以通过在引用链接后添加版本号参数来解决，例如 sprite.svg?v=2.0。

可访问性：对于装饰性的图标，记得在 <svg> 标签上添加 aria-hidden="true" 属性，让屏幕阅读器忽略它。如果图标本身有含义（比如功能按钮），则需要提供文本替代方案，如 role="img" 和 aria-label。

Shadow DOM 限制：使用 <symbol> 时，图标内容会被渲染到Shadow DOM中，外部CSS的全局样式可能无法直接影响其内部样式。这也是推荐使用 currentColor 的原因，它是一种穿透Shadow DOM的样式化方式。
```