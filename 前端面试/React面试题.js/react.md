<!-- UI = f(state) -->
对于任何应用状态，都有一个唯一确定的用户界面与之对应。 只需管理state,UI渲染和更新完全交给react
f(函数)就是react组件，通常是一个JS函数，核心是转化，接收state和props 根据输入，返回一个UI描述，输出JSX编译后的调用结果

声明式编程只需声明想要什么，不关心如何更新UI，只关心，在某个特定状态下UI是什么样子,UI完全由state决定，state不变，UI就不变


<!-- 对JSX的理解 -->
直观感觉：在JS中写HTML
定义：JS的一种语法扩展，浏览器并不认识，需要babel等工具进行转译，转译成浏览器可以理解的JS代码，使用React.createElement render之后 返回的是一个JS对象，这个对象称为React元素,不是真实的DOM
允许通过{} 嵌入任何有效的JS表达式，可以使用JS的全部能力构建UI
面试怎么说：1.是JS的一种语法扩展，为React.createElement()或_jsx提供了更具可读性的声明式写法，2.产物是JS对象：构成了React虚拟DOM的基础，保证高性能。3.融合JS全部能力{}可以使用JS所有功能


<!-- 学习 -->
什么是虚拟DOM
    是什么：本质上是一个JS对象，是抽象的真实DOM，存在于内存之中十分轻量，操作成本远低于真实DOM
    解决了什么问题：通过diff算法比较变化的真实DOM，减少了操作DOM的次数，优化了浏览器的重排和重绘，批量或者一次性应用DOM使得性能大幅度提高，不依赖于渲染环境，可以跨平台开发，SSR
更新过程：state变化，会创建一个新的虚拟DOM树，和旧的虚拟DOM树做比较，用diff算法比较出最小差异，批量更新

webpack:一切皆模块，需要先打包，编译后 才能服务于用户 即现打包后服务，时间过长

<!--  -->

vite 开发是不打包，按需服务
--源码通过浏览器支持的 <script type="module"> 提供
--浏览器提供请求模块
--vite服务器拦截请求，按需编译并提供模块

vite比webpack快在哪里：1.开发服务器启动速度  2.热模块（HMR）更新效率 3.核心机制差异（先服务再打包）4.依赖预购建（esbuild）5.生成构建策略(Rollup)

vite:适合新项目，中小型项目  webpack：适合大型，复杂存量的项目：迁移到vite可能成本过高。对特定的Webpack插件强依赖：Vite中还没成熟的替代品。需极度精细化控制打包的特殊需求。

生成构建为何用esbuild而不用Rollup:esbuild开发用（快速简洁预购建） RollUp 精细 Jsbundle转化

<!--  -->

函数组件和类组件的本质区别

类组件:面向对象

核心机制：this关键字 ， 生命周期方法 ， 状态管理 ， 组件实例创建实例，实例是“活的”，this不稳定，操作的是长期存在的，状态可变的“实例”
类组件的生命周期方法分散在不同的时间点，相关代码难以聚合和服用，


函数组件：贴近函数式编程

核心机制：就是一个函数，没有this，Hooks---操作的是一次性的渲染函数，捕获特定时候的值，每次渲染，函数都会被完整的执行，存在闭包情况，因为每次渲染都有新的状态，块状作用域。

区别：1.语法，心智模型不一样  类组件:使用class语法使用this调用实例，使用生命周期方法 通过使用生命周期方法优化性能   函数组件:JS函数，使用hooks,useState,useEffect 使用React.memo,useCallback,useMemo去优化性能，类组件通过this去捕取最新值，函数组件通过闭包去捕获最新值

<!--  -->

React Props为什么不可改变

1.什么是不可变性：子组件接收到Props之后，不应该直接修改它。
                props对象：“只读文件”，子组件可以读取，但不能涂改
                父组件数据变化，传递全新的Props给子组件

关键点1:React崇尚单向数据流，如果子组件可随意修改会导致数据来源变得混乱，props不可变可保证数据流向的清晰，可预测，出现问题时，可以顺着数据流找到问题的关键
关键点2:React是通过比较props和state去判断是否要重新渲染组件,父组件数据更新时会传递一个新的props，那React就只需要比较两个props的地址是否相同，此时浅比较，因为props内部的数据可能会改变就需要深比较。如果是结构复杂的对象，修改了里面的值，react检测不到会启用深比较。props不可变，数据如果变化，会直接创建一个新对象，react比较内存地址即可知道是否要更新
关键点3：组件行为更容易预测，明确子组件不会偷偷修改props, 如果组件中存在渲染问题，那基本就可以确认是父组件中的数据问题，或者是子组件读取props数据时有错误的使用。
关键点4：实现 撤销、重做的功能，Redux可以更容易的追踪状态和变更历史。便于记录和回溯

总结：保障了单向数据流清晰，可预测，简化数据追踪和历史回溯和状态管理。 通过浅比较高效判断了组件是否需要渲染，避免不必要的深比较。简化了调试，明确数据变化的来源。利于状态历史追踪和时间旅行调试

<!-- Fiber -->
之前的世界 同步且不可中断，只要开始了就必须实现了才能下一项。
Fiber：核心：拆解成许多微小工作单元。React没完成一个任务，将控制器给浏览器，检查是否还有更高优先级的任务。这个过程是可中断，可恢复的
两个阶段：1.渲染/调和阶段：这是一个可中断的异步阶段，构建Fiber树，计算出所有节点的变更，这个过程可以暂停，重做，丢弃。
         2.提交阶段：不可中断的过程：一旦调和阶段完成，进入提交。一次性把所有变更都应用到DOM上
解决的问题：1.增量渲染，避免主线程堵塞。 2.实现更新的优先级调度 3.为并发特性铺路

<!-- key属性的作用 -->
key作用：精确识别：快速找出那些元素是需要变动的  高效复用：最大限度地重用现有DOM节点，而不是销毁。改变一个KEY，会强制React销毁旧组件实例，创建新实例，state会被重置，就不需要单独去写重新状态的逻辑了，很方便
没有key会导致没有必要的DOM节点的销毁和重建
key的三大原则：唯一性，稳定性（稳定且好预测，不能使用math.random(),Date()），可关联性(和列表中的数据有关联)
为何不推荐用数组下标作为Key,只有在列表是静态的，没有稳定ID可用，不会进行列表操作，才可使用


<!-- React的合成事件原理 -->
React事件委托，不在每个DOM元素身上单独绑定事件，而是在一个统一的顶层节点进行事件监听。React17会被附加到渲染React应用的根节点上。冒泡机制，顶级触发只用写一个
根监听到事件后不会马上传递给组件，而是做一层包装，生成一个SyntheticEvent对象（合成事件） 
作用：1.跨浏览器兼容性（抹平了浏览器差异，提供了稳定，同意的W3C接口） 2.性能与事件池：为了避免频繁的创建和销魂对象，会创建一个池子，用完的对象会被回收。（会导致，不能在异步操作中访问事件对象，事件e会被回收）
解决：e.persist()移除事件池，提前保存
步骤1.用户触发原生事件->2.原生事件在DOM树中冒泡->3.React根节点捕获该事件->4.React从事件池中获取一个SyntheticEvent，用原生事件信息填充它。->5.关键：React模拟事件冒泡，在组件树中逐级调用对应的事件处理函数->6.执行我们定义的事件函数->7.事件处理完毕，回收SyntheticEvent进入回收池，等待下一次调用。

总结：通过在根节点进行事件委托，极大减少了真实DOM的监听器数量，优化了内存和性能，1.跨浏览器兼容性（抹平了浏览器差异，提供了稳定，同意的W3C接口） 2.性能与事件池：为了避免频繁的创建和销魂对象，会创建一个池子，用完的对象会被回收。（会导致，不能在异步操作中访问事件对象，事件e会被回收），SyntheticEvent对象（合成事件）对象可复用，可提升性能。两次冒泡，一次原生在真实DOM中冒泡，一次React在合成事件模拟冒泡


<!-- 严格模式有什么用 -->
严格模式：本质上就是一个工具，给我们提供额外的检查和警告
作用：识别不安全的声明周期方法，会故意调用函数，测试问题。相当于压力测试
废弃findDOMNode API 不允许父组件直接操作子组件的DOM

<!--  -->
ps1:
错误：连续点击会只加一次，出现过时闭包效果
const handleClick = () => {
    setTimeOut(()=>{
        setCount(state+1)
    },1000)
}
正确使用函数式更新
const handleClick = () => {
    setTimeOut(()=>{
        setCount((prevCount)=>{
            return prevCount+1
        })
    },1000)
}
原因：State闭包陷阱，异步更新与批处理，把多次setCount调用合并处理了

useState为什么要使用函数式更新，传递函数，会保证拿到的是当前队列最新的state值，React会将这些更新函数按顺序放入队列并且按顺序执行

怎么判断：如果新的state依赖于旧的state那就使用函数式更新

好处：解决了特殊情况下如(过时闭包,快速连续事件，异步回调，函数式更新)的问题即 ps1 函数式更新能拿到最新的状态值，原子性，准确性。

<!-- useState更新是异步的吗 -->
闭包，函数在定义时，就捕获了其所在所用域的变量，这个变量始终是个常量，useState是向React提一个更新请求，告知在未来某个时刻需要更新
React会把同一函数即同一次事件循环中的多个setState调用收集起来，放入一个队列。超市购物类似
总结：是延时执行，其实是同步的。看起来像异步。触发的状态更新和UI渲染，会被React延迟处理并且批量合并。多次状态更新可以合并成单此渲染，避免不必要的计算，提升性能。状态一致性：一次事件处理，所有状态可以同步生效，防止出现不完整的中间UI状态。


<!--  -->
useEffect和useLayoutEffect区别

核心差异对比：useEffect 异步副作用处理  ，  useLayoutEffect 同步布局调整

useEffect:用于数据处理，订阅，手动更改等副作用。   好处：不阻塞浏览器渲染，应用更流畅

useLayoutEffect:用于DOM操作后，绘制前调整 注意：会阻塞浏览器绘制过程 好处：解决浏览器的闪烁现象
ps:同步执行：其内部代码执行完毕，浏览器才会继续绘制

选择的核心法则：默认使用useEffect,只有视觉关键性一致，且操作依赖DOM布局时，才考虑useLayOutEffect

<!-- Immer为什么是现代Redux的灵魂 -->
Redux：不可变性，状态是只读的，唯一修改他的方式是派发一个动作（action）
问题：如果是要修改结构深且复杂的数据，需要大量浅拷贝...data{...data,...{}} 冗长且容易出错
Immer可以像“可变”一样操作“不可变” 提供核心API produce 接收两个参数 baseState:原始的，不可变的状态 recipe:一个函数，接收一个draft(草稿),我们可以在内部直接修改这个draft
工作机制：1.创建代理(proxy) produce函数用Proxy包装原始state,生成一个draft对象
         2.追踪修改：对draft的所有操作都会被proxy拦截，immer不会修改原始state,它会把这些修改记录下来
         3.生成新状态:recipe函数执行完毕，immer会根据记录的状态创建一个新状态，结构共享：只有被“触碰”到的路径上的对象才会被赋值，未修改的部分直接复用原始state,保证了性能
所以 Redux Toolkit会深度集成 Immer ,用户可以在reducers中直接修改状态

总结：通过巧妙的原始，把开发者从修护不可变性的工作解放处理。极大降低了Redux的上手难度，提升了代码的可读性和可维护性。统一了状态管理的最佳实践


<!-- reducx -->
问题：状态混乱，数据流分散，变更不可预测
原则：1.单一数据源 2.状态只读 3.变更由纯函数完成
reducer根据action.type来决定如何计算并返回一个全新的状态对象，而不是修改旧的状态
好处：可预测，可追踪，集中

<!--  -->

useEffect

如果依赖性是函数使用  useCallBack
如果依赖项是复杂对象或者数组 useMemo
dispatch函数：如果引用是永久稳定，就可以把他们加入依赖项数组

useEffect为何不能直接 async

因为 useEffect副作用回调期望：同步执行，或返回清理函数，或undefined。async函数会隐式的返回一个Promise对象。若回调直接async，React会把Promise对象当作清理函数

解决：在useEffect内部定义一个async函数即可


<!--  -->

竞态条件

核心问题：1.依赖项改变触发新异步，旧异步慢，导致UI显示过时数据。2.组件卸载前异步未完成，回调更新状态致警告或内存泄漏。
解决思路：识别忽略过时结果，取消不在需要的异步更新。
危害：状态错乱，内存泄漏
经典问题：如果直接给useEffect加async,await 会隐式返回Promise对象，会把Promise当作清理函数

问题：如何避免useEffect中异步请求的竞态条件？ 解决方式：1.布尔标记法，2.AbortController（针对fetch）


<!-- 待学习后，再补充  -->

如何优化 useContext的性能问题

问题：Context中微小的数据变化，可能导致组件树大面积的重渲染 

如 <myContext.Provider value={}> 不管Child中有没有用到数据，所有被包裹的子组件都会被重新渲染
    <Child>
        <Child1/>
    </Child>
    
</myContext.Provider>

原因：useContext订阅完整Context对象，React通过比较value的引用来判断变更，可能value值没变但是地址变了，React也会认为是数据变化，从而触发重新渲染

解决方法：1.直接拆分，不同的数据，拆分成不同的Context 2.在Provide中使用 useMemo/useCallBack 稳定value值 3.把组件作为children传入，通过props.children接收，因为浅对比，没变化就不会渲染
4.使用uesReducer于API，dispatch稳定，把易变化的state和稳定的更新函数放到不同的context中


<!--  -->

useState vs useReducer

useState:使用简单数据如，开关，输入框值   如果数据过多，会创建很多useState代码会太多

useReducer（处理组件内部复杂状态的神器）:复杂的数据，状态，逻辑  集中处理  所有状态的规则清晰定义，通过action.type去区分   好处：增强了代码意图的明确性，可读性，可维护性
           传递给子组件，只需要传入dispatch函数，React保证dispatch函数的数据是稳定的。为了性能优化，props可以有效渲染，会配合 Reat.memo去进行渲染更新
           reducer是纯函数，适合测试，独立于组件渲染
           action对象清晰描述了操作意图和所需数据，有助于调试和理解复杂状态的流转过程
使用情况：状态包括多个子值，或者下一状态依赖于前一个状态。逻辑状态分散在多个不同组件中。

不适用useReducer的情况：大型项目，全局状态管理。


<!--  -->
useCallBack 与 useMemo

React.memo优化的问题：父组件渲染时，内部定义的函数或者对象props会被重新创建。即使逻辑和数据未变，他们的引用地址也会发生变化。React.memo进行浅比较时，会认为props已变化，导致子组件不必要的渲染。

useMemo的核心作用是记住一个计算结果的值。避免每次组件渲染时执行不必要的，开销大的复杂计算结果(缓存计算结果)

useCallBack缓存函数实例：缓存的是函数本身（函数的引用）组件内部定义的函数在每次渲染时会被重新创建，导致其引用地址的改变。作用：是React性能优化Hook,主要用于缓存函数实例。他返回回调函数的memoized记忆化版本，该回调仅在某个依赖项改变时才会更新其引用。

useCallback(fn,deps)在功能上等价于 useMemo(()=>fn,deps) useCallback可以看作是useMemo的 一个语法糖。

滥用 useMemo/useCallBack的问题：useMemo和useCallback本身运行也需要时间。他们需要比较依赖数组，并存储缓存的值和函数。本身如果计算或函数开销小，就会导致成本大于收益。过度使用使得代码变得更加复杂，可读性下降，都是包装使得逻辑不直观，

方法：使用React DevTools Profiler定位瓶颈。

原则：不要为了优化而优化，优化的前提是存在 已证实的性能问题。优先保证代码的清晰度和可维护性。

<!--  -->

useRef

核心特性：当你修改 myRef.current时，React不会触发组件的重新渲染，这就是 useRef和useState的本质区别。

主要的用途：1.访问和操作DOM  2. 存储可变的，于渲染无关的值：持久化数据但不触发渲染，如定时器ID，上次props/state。

为何要使用useRef:DOM节点引用本身不是驱动UI渲染的状态，我们需要稳定引用来操作他，若使用useState存DOM节点，引用变化可能触发不必要的渲染，useRef提供持久引用且不触发渲染。

应用案例：自动聚焦输入框，管理定时器ID,追踪上一个状态值

<!--  -->
forwardRef 和 useImperativeHandle 

React.forwardRef:打通父子ref通道

问题：函数组件为何默认不接收ref

原因：ref和key是React特殊处理的props,函数组件默认会忽略他，函数组件没有实例，React这样设计旨在保护组件的封装性。

如何解释forwardRef:主要解决父组件需要拿到子组件内部特定的DOM的情况。默认情况下，函数组件不能通过props去接收ref,会被忽略。forwardRef允许ref被作为第二参数被接收  React.forwardRef((props,ref)=>{})

可以使父组件传入 遥控器，子组件连接到特定的 电器DOM

问题：父组件权力太大，拿到ref可以为所欲为

适用：需要进行焦点管理，动画控制或集成第三方DOM库的场景

局限性：1.封装性问题：父组件可能调用不期望的DOM方法，破坏子组件封装。

useImperativeHandle用于创建 更优雅，可控的命令式API

是什么：一个React Hook 用于自定义暴露给父组件的ref实例值。
核心要求：必须和React.forwardRef一起使用。
工作流程：父组件传ref->子组件forwardRef接收->useImperativeHandle定义ref.current

为什么要使用:1.增强封装性：避免直接暴露内部DOM或完整子组件实例。2.定义清晰的命令式API：允许子组件提供更明确，受控的方法。3.解耦：父组件依赖抽象接口，而非DOM实现

解释useImperativeHandle 1.与React.forwardRef配合，允许子组件自定义暴露给父组件的ref实例 2.forwardRef传递ref,useImperativeHandle控制ref.current指向。3.返回自定义对象，挂载特定方法、属性作为命令式API。

好处：1.增强了封装性：隐藏了内部实现，暴露最小必要接口 2.API更清晰：调用意图明显，如childRef.current.customFocus() 而不是 chlidRef.current.querySelector('input').focus() 3.更好的代码维护性：子组件内部重构不影响父组件（若API不变）

总结：forward负责把ref拿进来。useImperativeHandle负责 管好父组件通过这个ref拿到什么，做什么

<!--  -->

useId是什么：React18新增的一个Hook,用于生成在服务端和客户端之间都保持一致的，稳定的，唯一的ID。

问题：服务器渲染(SSR)中，动态ID可能导致Hydration Mismatch H

Hydration Mismatch（水合不匹配）
Hydration Mismatch 是一个在前端框架（如 React、Vue、Svelte 等）中使用 服务端渲染（SSR） 时常见的错误。它发生在 服务端生成的 HTML 与客户端 JavaScript 期望的 DOM 结构不一致 的情况下。
抛弃服务端渲染的内容，重新在客户端渲染一遍

useId 通过确定性算法，保证相同树结构下，服务端和客户端为同一组件生成的ID相同，解决不匹配的问题。
useId 生成唯一且稳定的ID，非常适合创建可靠的可访问性链接。（例如：<label>的html for 的指向<input>的id,关联起来）

ID生成基于组件在React树中的路径和顺序。只要组件树结构在服务端和客户端之间保持一致，ID就能保证一致。ps:useId不用于列表的key,key需要基于数据本身稳定

问题：useId核心价值与SSR

核心价值：useId是React18的Hook,解决客户端于服务端渲染时生成稳定且唯一ID的问题，对SSR hydration 和 Web 可访问性至关重要。
SSR问题：传统动态ID（如Math.random()）在SSR中易导致服务端与客户端ID不匹配，引发hydration失败或警告
useId方案：确保相同组件层级下，服务端与客户端为同一useId调用生成的ID相同，避免hydration mismatch

场景：需要唯一ID连接不同DOM元素的场景，如表单控件与其他标签。不应作为渲染列表的key，如果需要多个ID,可以在useId后面拼接后缀。

<!--  -->

React 并发特性 (1.解决UI卡顿和主线程阻塞问题  2.React18核心革命性特性：并发。)

React18之前 React渲染是同步，阻塞式。并发：渲染过程可中断，可调度。 大大提升用户复杂操作下的用户体验。

核心点：1.可中断性 2.可调度性

问题；UI卡顿：长时间占用线程，界面无响应；交互延迟：用户操作响应慢；动画掉帧：无法及时响应下一帧，卡顿。

Transitions(startTransition,useTransition):标记非紧急更新  总结：控制状态更新的“时机”和“优先级”，避免阻塞高优先级任务
useDeferredValue:推迟值的更新，不阻塞当前渲染 总结：接收一个值，并返回该值的“延迟版本” 在紧急更新（用户快速输入）完后延迟更新
因为useDeferredValue没有isPending,但是可以通过比较旧值和新值，不相同说明数据还是旧的

React并发主要发生在JS的单线程环境，非真正意义上的并发，只是做了优先级调度和高效任务切换

区别1 useTransition:允许你包裹状态更新的逻辑（setState）。明确指出那个更新是低优先级的。
     useDeferrredValue:允许你包裹一个值（通常是props或者派生状态）关注的是值的延迟版本，并发更新过程


区别2 useTransition 返回 isPending和startTransition
      useDeferrredValue返回一个延迟的值

区别3 useTransition:能控制导致性能问题的状态更新代码   无法控制值的更新源头 useDeferrredValue，希望能延迟更新

useTransition应用场景：1.搜索/筛选 大型列表 2.编辑器草稿与实时预览(看情况)

useDeferrredValue应用场景 1.外部数据源的图表、可视化  2.编辑器草稿与实时预览(看情况),无法控制state,数据来自第三方库

总结：useTransition关注状态更新的过程，useDeferredValue关系一个具体的值


<!--  -->
单一职责原则（SRP）

核心定义：一个组件（或模块，类）应该有且仅有一个引起他变化的原因，即 一个组件只做好一件事
目的：提高内聚性，降低耦合性

好处：1.提高可维护性 2.增强可复用性 3.提升可测试性 4.代码更清晰


<!--  -->

容器组件和展示组件 在hooks时代还有存在的意义吗

容器组件和展示组件：核心思想：关注点分离  

1.容器组件：职责：如何运作-数据处理，状态管理，逻辑管理  特点：通常不包含复杂UI，将数据和行为传递给展示组件
2.展示组件：职责：如何展示-纯粹的UI渲染 特点：通过props接收数据和回调，通常自身无状态

优点：提高复用性，可测试性，可维护性

Hook(逻辑和视图分离)

自定义Hooks:允许我们将组件逻辑提取到可重用的函数中。赋能函数组件：使其可以拥有状态，处理副作用，封装复杂逻辑。

带来的变化：组件逻辑组织更灵活，减少了对高阶组件(HOC)和Render Props的依赖，一定程度上模糊了传统容器/展示组件的界限

面试：简述容器组件和展示组件 提及Hooks的好处 依然追求逻辑与视图分离，但实现方式因Hooks而更加多样和内聚与组件自身或自定义Hook

<!--  -->
React中的组合和继承：为何推荐组合

继承：子集获取父级的属性和方法，形成层级结构，通常耦合较紧,是一个：一个电脑功能给别人
组合：通过简单对象或组件组合起来构建更复杂的对象或组件，更灵活，组件间松耦合 有一个：各自有各自的功能，组合到一起构成电脑

为何推荐组合：高度灵活性，可维护性  清晰的关注点分离  Props的强大驱动 避免不必要的耦合

如果使用继承：1.组件层级与数据流模糊（难以追踪props和state的来源和传递）2.逻辑复用的困境：不如的自定义Hooks或者高阶组件 

如何使用组合：props传递特定内容/行为  万能的props.childen  高阶组件（嵌套过深问题）

推荐使用hooks：状态逻辑封装在hooks中，UI只关注如何展示这些状态

使用继承的情况：有一些非常通用的，非UI相关的辅助方法，可以考虑JS类继承

<!--  -->
React错误编辑(Error Boundaries) ps:目前只存在于类组件，函数式还不支持

是一种特殊的组件，可以捕获组件树中发生的javaScript错误

目的：记录这些错误，展示一个降级的UI，而不是让整个组件树崩溃

作用：提升用户体验：避免整个应用局部错误而白屏崩溃。提供友好的错误提示，引导用户  增强应用健壮性：隔离错误，防止错误蔓延   便于错误追踪与修复：可以在错误边界中集成错误上报机制

如何工作：类组件：static getDerivedStateFromError(error)子孙组件错误调用，返回一个对象更新state,从而下一次渲染时展示降级UI。  
         componentDidCatch(error,errorInfo) errorInfo带有componentStack   key的对象，包含了组件抛出的栈信息。

无法捕捉：事件处理器，异步代码，服务端渲染，错误边界自身抛出的错误

<!--  -->
如何设计一个组件库

口诀：一致性，可复用性，高效性，可维护性，健壮性

设计与API规划
视觉设计：设计规范，主体化能力，响应式设计  
API设计：Props:清晰，可预测，最少暴露。遵循HTML标准 Events:命名一致(onOpen,onClose),参数明显

框架选择，样式选择

文档，测试

可访问性：标准遵循WCAG 语义化HTML按钮 -> Button不用div

性能优化懒加载


原则：1.用户中心（开发者和用户体验  并重）2.系统思维（不仅仅是单个组件，更是整体的解决方案）3.长期规划（考虑可扩展性，可维护性和社区生态）4.迭代进化（根据反馈和需求持续优化）

<!--  -->
原子设计

原子：基础，不可分
分子：原子组合，简单功能
组织：分子/原子组合，独立区域
模板：页面骨架，布局
页面：模板实例，真实内容

价值：一致性，复用性，可维护性，团队协作

<!--  -->

protected Route （保护路由）

安全性：防止为授权访问敏感数据或功能
用户体验：引导未登录用户到登录页，避免用户访问到不应看到的空状态或错误页面
数据完整：确保只有授权用户才能修改或提交数据


步骤：1.认证数据 2.创建ProtectedRoute组件（这是一个包装组件，内部检查认证状态）3.条件渲染/重定向：已认证<Outlet / >未认证 <Navigate to="/login"/>

<!--  -->

状态管理

什么是状态：组件内部状态，跨组件共享状态

为何要状态管理：避免 Prop Drilling（属性逐层传递）提升应用可维护性，可预测性。集中化数据逻辑

React内置：useState,useReduce,useContext

中小型使用：Context+useReducer

大型：Redux 优点：强大的DevTools，庞大的生态系统，中间件丰富。Redux Toolkit(RTK)大幅度简化样板代码

小型到大型都行：Zustand 极简的基于Hooks的轻量级，简介的状态管理。  缺点：生态相对Redux较小，DevTools体验不如Redux完善

<!-- Redux中间件原理 -->
为什么需要中间件：Reducer是纯函数，只负责计算新state,不应包含任何副作用，但是显示不可避免需要 异步操作等。
可以理解为：action发出后，需要经历的关卡  action被dispatch->Middleware1->Middleware2->...reducer 每个中间件都能接触到action,getState,dispatch可以对其他操作进行实现

核心目的：处理副作用，保持reducer的纯粹性
工作位置：位于dispatch和Reducer之间
核心签名：store->next=>action的柯里化结构，易于组合
关键函数:next(action)是驱动Action在链条中传递的“引擎”
集成方式:通过applyMiddleware函数应用到Store中

<!-- Zustand vs Jotai -->
Zustand “自上而下” 的全局状态管理，可以理解为轻量级的Redux
Jotai "自下而上"原子化状态管理，更贴近React的组件化思维

<!-- React Hooks的执行顺序和依赖规则 -->
Hooks的调用顺序：Hooks链表机制，hooks必须放在顶层，条件渲染应该放在jsx中，不要放到循环，条件，嵌套函数中使用
依赖规则：三种模式，不传，空数组[],包含依赖项[useId]  --- 检查依赖是否变化机制  原始类型比较值，引用类型比较 引用地址（很多BUG来源）



<!--  -->

状态提升

核心思想：将共享状态移至这些组件最近的共同父组件中 

目的：使得多个组件可以反映相同的数据变化。保持数据流的单向性和可预测性

机制：父组件持有状态，父组件通过props将状态传递给子组件，若子组件需要修改状态，父组件传递回调函数给子组件

场景：兄弟组件共享状态，子组件需要修改父组件或祖先组件的状态，保持多个视图的数据同步。ps：React单向数据流

优点：明确的数据源即单一数据源，组件间通信，数据同步，代码可预测性，组件更纯粹，易于复用

缺点：中间组件被迫接收并不需要的props，父组件膨胀，过度无关的状态，性能问题导致不必要的渲染

边界：少数组件，组件间关系简单，逻辑清晰，层级 2-3(Prop Drilling)。父组件逻辑简单

代替方案：Context API  ,  redux

<!--  -->
useContext+useReducer

强强联合：useReducer:集中管理状态逻辑，使状态变得更可预测  useContext:将state和dispatch函数全局注入，避免逐层传递

场景：当应用需要全局状态，但又不想引入redux那么重的库

核心：考虑使用useContext结合useReducer。useReducer负责定义和管理状态变更逻辑，useContext则将产生的state和dispatch函数轻松地共享给所有的子组件

<!--  -->
Redux Toolkit(RTK)

总结：RTK让Redux更易用，简洁，减少了传统Redux中繁琐的模板代码，便捷性：configureStore简化Store的配置，默认集中Redux Thunk和DevTools

<!--  -->
29-34跳过


<!--  -->
35 使用那些工具来定位React的性能瓶颈

1.React DevTools Profiler 关注火焰图中的宽条，以及排行榜中耗时较长的组件，分析props和state变化，结合React.memo,useMemo,useCallback进行优化  场景：首选用于React组件渲染性能，重渲染问题

2.Chrome DevTools Performance Tab 浏览器内置的强大性能分析工具。 不限于React,可分析整体应用性能（JS执行，渲染，网络等）识别JS长任务 分析布局抖动和绘制风暴。 场景：复杂场景，非React相关的JS瓶颈，布局/绘制问题，宏观性能分析

3.Lighthouse Google提供的自动化网站质量审计工具

4.why-did-you-render 检测React组件不必要重渲染的库 ， 精准定位那些组件因为什么props或state的变化而重渲染





<!--  -->
36 React中的性能优化  场景：卡顿，白屏，响应慢




<!--  -->
37 React如何优化一个庞大列表的渲染性能

原因：DOM节点过多（需要创建和维护大量DOM元素，内存占用增加，布局计算，绘制负担加重） React协调成本：render函数执行时间变长，Diff算法在大量节点比较，效率低，频繁更新页面掉帧，用户觉得卡顿

虚拟列表：只渲染视口内可见的列表项，按需渲染：动态渲染新的可见项。视觉欺骗，让用户以为列表都被加载了

优势：大幅度提升渲染性能，降低内存消耗，更快的首次加载速度，流畅的滚动体验

第三方库：react-window,react-virtualized,TanStack Virtual

总结：遇到大量数据，一次性渲染所有DOM节点导致页面卡顿，内存占用过高，响应变慢等性能问题。可采用虚拟列表技术。两点 按需渲染，部分渲染。只渲染可视区以及视口外少量用于缓冲的列表项，用户滚动时动态的更新这个窗口应该渲染的DOM元素




<!--  -->

38 代码分割 ：将代码从单个巨大的包(bundle)拆分成多个小块  加载方式：这些小块可以按需加载或者并行加载 目的：只在用户需要时加载对应的代码

为什么：提升初始加载速度：用户首次访问时，只需下载运行首页所需的最小代码。 改善应用性能：更小的代码包意味着更快的解析和执行时间。 优化用户体验：减少等待时间，应用感觉更流畅，响应更快。 节省带宽：网络较差的用户友好

React.lazy(loadFunction) 懒加载

<Suspense fallback={...}> 配合React.lazy使用，用于在懒加载组件下载和渲染期间显示一个加载指示器

场景：React.lazy  基于路由的代码分割。好处：用户访问特定页面时，才加载该页面的组件和逻辑。

<!--  -->
SSR

定义：在服务器端将客户端的应用程序（通常是JS框架编写的单页应用SPA）渲染成完整的HTML字符串，然后将这个HTML直接发送给浏览器
核心思想：浏览器接收到的可以直接显示的HTML内容，而不是等待JS加载执行后再生成页面

为何如此重要：1.SEO优化：搜索引擎爬虫可以直接抓取到完整的页面的内容 2.首屏加载速度（FCP/LCP）:用户可以更快看到页面内容，提升体验。

对比客户端渲染（CSR） CSR:浏览器下载HTML骨架->下载JS->JS执行->请求数据->渲染页面
                    SSR：浏览器请求->服务器处理（数据+渲染）（异步获取该页面所需数据，在服务端执行JS代码，将组件渲染为HTML字符串）->(响应HTML)返回完整HTML->浏览器显示->注水(JS代码接管静态HTML，添加事件监听器，恢复应用状态等，时页面能交互)
缺点：页面渲染从客户端转移到服务器，增加了服务器的计算压力和响应时间，更复杂的构建和部署，开发复杂度提升。

使用场景：内容型网站：博客，新闻门户，电商商品详情页。
不适用的场景：管理后台，内部系统对SEO无要求，用户网络条件较好的应用，纯静态站点


<!--  -->
45 React受控和非受控组件的区别和场景

受控组件：核心：表单数据由React State管理 由 React State说了算
数据如何流动：value由state驱动->用户触发onChange->onChange回调更新state->state变更,UI重新渲染
场景：实时表单验证，根据输入内容，动态启用/禁止提交按钮，需要强制输入格式（如信用卡，电话号码），多个组件需要同步或依赖此状态

非受控组件 核心：表单数据由DOM节点本身管理。DOM说了算 React只在需要时去读取数据
使用useRef创建一个应用，ref附加到DOM本身，通过 current.value 拿到值
场景：一次性的，简单的表单提交（搜索框），与非React库集成，性能考量（避免每次都输入re-render）文件上传

区别：1.定义：核心区别：数据源不同  2.细节：数据流向，实现方式（useState vs useRef） 3.场景：。。。 4.受控【value+onChange+state】,非受控【ref+defaultValue】







Hooks的执行顺序和依赖规则

React每次渲染都按相同顺序调用，React通过位置索引匹配状态，顺序改变=状态错乱

明确的依赖关系 即 useEffect中的参数，没有参数，[] , [params] React使用Object.is浅比较： 原始类型：比较值  引用类型：比较引用地址

<!--  -->

useEffect与useLayoutEffect

完整的渲染周期 ： 状态变化触发->渲染阶段Render Phase->计算虚拟DOM->提交阶段Commit Phase->更新真实DOM->（useLoayoutEffect执行）->浏览器绘制Brower Paint -> useEffect执行

注意：不能在useLayoutEffect中做耗时的操作，因为是同步操作会导致渲染堵塞

<!-- React中的依赖项为何重要 -->
useEffect两个参数  一个是 副作用函数，包含要执行的副作用逻辑，可先返回清理函数。二是依赖项数组




<!--  -->

useEffect(async()=>{await}) 为什么不对，useEffect要不然返回清理函数，要不不反悔任何东西，这里是async会隐式的返回Promise，会把Promise当清理函数

<!--  -->
React的重渲染机制：当组件的state和props发生变化时，React会触发：组件自身的重渲染，所有子组件的重渲染

性能优化并非没有成本：1.内存开销增加：每个useMemo/useCallback都需要内存来存储缓存 2.初始渲染性能下降 React需要额外的工作来管理这些缓存，缓存的开销可能比计算本身还大




<!-- React19 suspense和activity 区别 -->
传统痛点：生硬的加载状态切换，缺乏上下文连续性，不可控的渲染阻塞
解决：Suspense-优雅处理异步内容加载
      Acitivity-管理UI状态过渡
      并发特性：非阻塞渲染于平滑过渡

Suspense 没加载之前 给用户看点东西，显示fallBack UI
         场景：代码分割：React.lazy(),数据获取

Activity:管理UI元素  活跃非活跃，不关心数据是否加载成功，要配合useTransition一起使用,切换时提升流畅感
         场景：切换路由，打开新页面时，如果新页面还在加载，旧会展示旧页面，并且把旧页面变灰，用户体验变好





如果react正在执行diff任务，突然来了一个高优先级的任务，react怎么知道这个任务需要被优先执行

React 能够感知并响应高优先级任务，靠的是一个独立于核心渲染逻辑之外的“调度器”（Scheduler）。这个调度器就像是一个交通指挥中心，它通过一套精密的优先级标签和可中断的链表式遍历机制，让高优先级任务能够随时“插队”。

整个过程可以分为“任务如何被标记”和“插队如何发生”两个环节来理解。

🏷️ 第一步：任务如何被贴上“优先级”标签
当你在React中触发一个更新（比如setState），这个更新动作首先会被包装成一个“任务”，并根据其来源被贴上不同的优先级标签。React内部将优先级划分为几个等级：

优先级等级	对应场景	过期时间 (模拟值)
ImmediatePriority	同步任务，最高优先级	-1 (立即执行)
UserBlockingPriority	用户交互（如点击、输入）	250ms
NormalPriority	普通数据更新	5000ms
LowPriority	低优先级任务	10000ms
IdlePriority	空闲时执行的任务	永不超时
关键机制：过期时间
调度器会基于这个优先级，为每个任务计算一个过期时间（expirationTime）。比如，一个用户点击任务（UserBlockingPriority）的过期时间可能是 当前时间 + 250ms。

任务未过期：可以“慢慢来”，按时间片执行。

任务已过期：必须同步且不可中断地立即执行，以保证用户体验。

所有待执行的任务会被放入一个由“小顶堆”实现的优先级队列中，过期时间最小的任务（即最紧急的任务）永远排在堆顶，等待被处理。

🚦 第二步：“插队”如何发生（任务中断与恢复）
现在，假设低优先级的Diff任务正在执行，一个高优先级任务突然到来。这就是“插队”发生的时刻：

高优先级任务入队：新的点击任务被创建，它的优先级高，过期时间早。调度器将它丢进任务队列，并重新排列，它瞬间就“插队”到了队首（堆顶）。同时，调度器会通过 requestHostCallback 请求一次新的执行机会。

检查与中断：调度器通过 workLoop 函数来执行任务。在执行每一个小工作单元前，它都会做两个检查：

时间片检查：shouldYieldToHost() —— 当前这一帧分配的时间（约5ms）用完了吗？

任务比对检查：currentTask.expirationTime —— 正在执行的任务和堆顶任务，谁更紧急？

当它发现堆顶已经换成了一个更紧急的新任务，就会立即中断当前的 while 循环，把主线程让出来，流程回到调度器等待下一次调度。

恢复执行：调度器再次通过宏任务（如 MessageChannel）发起调度，workLoop 重新启动。这时，它从堆顶拿到的，已经是那个“插队”成功的高优先级任务了，于是开始执行它。

善后处理：高优先级任务执行完毕后，调度器会回过头来处理那个被中断的低优先级任务。但React并不会直接从中断的地方继续，而是重新开始执行这个低优先级的任务。这样做是为了确保状态的一致性和正确性。

💡 总结
简单来说，React 能实现高优先级任务的插队，核心就在于“分”：

任务分优先级：每个任务都带着“紧急程度”标签。

执行分时间片：任务被切成小块执行，每执行一小块就检查一下。

逻辑分层：将“调度器（Scheduler）”与“渲染器（Reconciler）”分离，调度器专心管“谁先做”，渲染器专心管“怎么做”，并通过可中断的链表结构配合。

这套机制让 React 在保证应用逻辑正确的同时，也能对用户的每一次点击、输入都做出最快速的响应。










    

当列表从 A B C D 变为 B A C D 时，React 和 Vue 的 Diff 算法处理方式不太一样。下面分别来看它们的具体执行步骤。

React 的 Diff 处理
React 的 Diff 算法采用仅右移的优化策略。它的处理过程是这样的：

步骤详解
第一步：第一轮遍历（从左到右对比）

text
旧列表: A B C D
新列表: B A C D
        ↑
    索引0对比：A vs B，key不同，立即跳出第一轮
由于第一个节点就不同，React 直接结束第一轮遍历。

第二步：第二轮遍历（处理剩余节点）
此时剩余节点情况：

text
旧列表剩余: A B C D (索引0-3)
新列表剩余: B A C D (索引0-3)
React 会建立旧节点的 key 到节点的映射表：

javascript
Map: {
  A: '节点A',
  B: '节点B', 
  C: '节点C',
  D: '节点D'
}
第三步：遍历新列表，移动节点
React 会维护一个标记 最后一个可复用节点在旧列表中的位置（lastPlacedIndex），初始为 0。

处理新列表第0个节点 B

在旧 Map 中找到 B，旧索引是 1

1 >= lastPlacedIndex(0)，所以 B 不需要移动

更新 lastPlacedIndex = 1

处理新列表第1个节点 A

在旧 Map 中找到 A，旧索引是 0

0 < lastPlacedIndex(1)，所以 A 需要向右移动

将 A 标记为移动，插入到当前处理位置

处理新列表第2个节点 C

在旧 Map 中找到 C，旧索引是 2

2 >= lastPlacedIndex(1)，C 不需要移动

更新 lastPlacedIndex = 2

处理新列表第3个节点 D

在旧 Map 中找到 D，旧索引是 3

3 >= lastPlacedIndex(2)，D 不需要移动

更新 lastPlacedIndex = 3

React 的最终判断
A：需要移动

B、C、D：不需要移动

操作结果：只需将 A 移动到 B 的后面

Vue 2 的 Diff 处理
Vue 2 采用双端比较算法，从新旧列表的两端同时开始对比。

步骤详解
Vue 2 有四个指针：

oldStartIdx: 旧列表开始索引 0 (A)

oldEndIdx: 旧列表结束索引 3 (D)

newStartIdx: 新列表开始索引 0 (B)

newEndIdx: 新列表结束索引 3 (D)

第一轮比较

比较 oldStart(A) vs newStart(B)：不同

比较 oldEnd(D) vs newEnd(D)：相同！

复用 D，指针向中间移动

text
旧: A B C [D]
新: B A C [D]
oldEndIdx = 2 (C)
newEndIdx = 2 (C)
第二轮比较

比较 oldStart(A) vs newStart(B)：不同

比较 oldEnd(C) vs newEnd(C)：相同！

复用 C，指针继续移动

text
旧: A B [C] [D]
新: B A [C] [D]
oldEndIdx = 1 (B)
newEndIdx = 1 (A)
第三轮比较
此时情况：

text
旧: [A] [B] C D
新: [B] [A] C D
比较 oldStart(A) vs newStart(B)：不同

比较 oldEnd(B) vs newEnd(A)：不同

尝试 oldStart(A) vs newEnd(A)：相同！

发现 A 在旧列表开头，但应该在新列表结尾

将 A 移动到旧列表的末尾

oldStartIdx++，newEndIdx--

第四轮比较
最后剩下：

text
旧: [B] A C D
新: [B] A C D
比较 oldStart(B) vs newStart(B)：相同，直接复用。

Vue 2 的最终判断
发现 A 应该移动到 B 后面

C 和 D 位置不变

只需一次 DOM 移动操作

Vue 3 的 Diff 处理
Vue 3 的 Diff 算法结合了 React 的思路和 Vue 2 的优点，引入了最长递增子序列优化。

步骤详解
第一步：预处理（类似 React 的第一轮遍历）

text
旧: A B C D
新: B A C D
     ↑
第一个节点不同，结束预处理
第二步：生成新节点在旧列表中的位置数组
遍历新列表，记录每个节点在旧列表中的索引：

B 在旧列表索引 1

A 在旧列表索引 0

C 在旧列表索引 2

D 在旧列表索引 3

得到数组：[1, 0, 2, 3]

第三步：求最长递增子序列
最长递增子序列对应的是不需要移动的节点。

数组 [1, 0, 2, 3] 的最长递增子序列是 [0, 2, 3]（对应值 0, 2, 3），即索引为 1, 2, 3 的节点（B、C、D？等一下，需要仔细看）

让我们重新分析：

位置数组 [1, 0, 2, 3]，索引从 0 开始

最长递增子序列是 [0, 2, 3]（对应值 0, 2, 3）

这意味着：新列表的第 0 项(B)、第 2 项(C)、第 3 项(D) 在旧列表中呈递增顺序，它们不需要移动

第四步：移动剩余节点

根据最长递增子序列，只有新列表的第 1 项(A) 需要移动

将 A 插入到适当位置

Vue 3 的最终判断
B、C、D：保持不动（在最长递增子序列中）

A：需要移动

操作结果：只需移动 A 到正确位置



React Hooks 之所以不能写在循环或条件判断语句中，最根本的原因在于 React 依赖调用顺序 来正确关联 Hook 的状态。

下面从几个维度详细解释这个核心机制，以及为什么顺序如此重要。

一、Hooks 的依赖追踪机制
链表结构
在函数组件内部，React 使用链表（linked list）来存储 Hooks 的状态。每个 Hook 对应链表中的一个节点。

javascript
// 简化版的 React Hooks 链表结构
{
  memoizedState: '第一次的count值',  // 当前 Hook 存储的值
  next: {                           // 指向下一个 Hook
    memoizedState: '处理副作用的函数',
    next: {
      memoizedState: '某个ref值',
      next: null
    }
  }
}
渲染过程
当组件第一次渲染时，React 按照 Hooks 的调用顺序，依次创建这些节点并链接起来。

javascript
function MyComponent() {
  const [count, setCount] = useState(0);      // Hook 1
  const [name, setName] = useState('Tom');     // Hook 2
  useEffect(() => {                            // Hook 3
    document.title = `${name}点了${count}次`;
  }, [count, name]);
  
  // React 内部会创建这样的链表：
  // useState(0) --> useState('Tom') --> useEffect --> null
}
二、为什么顺序必须固定？
1. 数据关联依赖于索引
在每次渲染中，React 都是通过调用顺序的索引来找到对应的 Hook 状态。

javascript
// 第一次渲染
function MyComponent({ condition }) {
  if (condition) {
    const [count, setCount] = useState(0);    // 假设这行执行了
  }
  const [name, setName] = useState('Tom');      // Hook 2
  
  // React 内部记录：
  // 索引0: count 的状态
  // 索引1: name 的状态
}
2. 条件执行会破坏索引对应
javascript
// 第二次渲染，condition 变为 false
function MyComponent({ condition }) {
  if (condition) {
    const [count, setCount] = useState(0);    // ❌ 这一行没执行
  }
  const [name, setName] = useState('Tom');      // 现在是第一次调用，被认为是索引0
  
  // React 内部出错了：
  // 索引0: 应该是 name 的状态，但存的是之前 count 的值
  // 索引1: 没有了，但 React 还在找
}
看个更具体的例子：

javascript
// ❌ 错误示例
function BadExample({ isLoggedIn }) {
  let user, setUser;
  
  if (isLoggedIn) {
    [user, setUser] = useState({ name: 'Tom' }); // 条件判断里用 Hook
  }
  
  const [count, setCount] = useState(0);          // 普通 Hook
  
  // 如果 isLoggedIn 从 true 变成 false：
  // 第一次渲染：Hook链表 [user状态, count状态]
  // 第二次渲染：user Hook 没了，链表变成了 [count状态]
  // count 拿到了本应是 user 的状态，数据全乱了
}
三、React 为什么这么设计？
1. 性能考虑
如果每次渲染都要通过 Map 或字典来查找 Hook（比如用 key 来标识），虽然可以支持条件调用，但会有额外的性能开销。链表索引的方式是最快的。

2. 简化实现
使用顺序索引让 React 内部实现变得简单可靠：

不需要为每个 Hook 生成唯一标识

不需要维护复杂的查找表

渲染速度更快

3. 静态分析友好
这个限制让 ESLint 插件（eslint-plugin-react-hooks）能够轻松检查出不符合规则的代码，在开发阶段就能发现问题。

四、如何绕过这个限制？
如果你确实需要条件执行的效果，可以用以下方式实现：

方式1：将条件移到 Hook 内部
javascript
// ✅ 正确：Hook 始终调用，条件在内部处理
function MyComponent({ needCount }) {
  const [count, setCount] = useState(0);  // 始终调用
  
  // 通过条件决定是否使用
  useEffect(() => {
    if (needCount) {
      // 只有在 needCount 为 true 时才执行副作用
      console.log('Count is:', count);
    }
  }, [needCount, count]); // 依赖项包含条件变量
  
  return <div>{needCount ? count : '隐藏'}</div>;
}
方式2：使用 useMemo 的条件计算
javascript
function MyComponent({ showExtra }) {
  const [base, setBase] = useState(0);
  
  // 用 useMemo 替代条件 Hook
  const extraValue = useMemo(() => {
    if (!showExtra) return null;  // 条件逻辑在内部
    // 复杂的计算...
    return base * 2;
  }, [showExtra, base]); // 依赖项包含条件变量
  
  return <div>{extraValue ?? base}</div>;
}
方式3：拆分组件（最推荐）
javascript
function MyComponent({ isLoggedIn }) {
  return (
    <div>
      <CommonPart />
      {isLoggedIn ? <UserPart /> : <GuestPart />}
    </div>
  );
}

// ✅ 子组件里可以自由使用 Hooks
function UserPart() {
  const [user, setUser] = useState(null);  // 条件成立才渲染，但 Hook 调用是确定的
  return <div>用户信息</div>;
}

function GuestPart() {
  const [guest, setGuest] = useState('');  // 另一个组件，独立调用 Hooks
  return <div>访客模式</div>;
}
五、总结
角度	说明
核心原因	React 依赖调用顺序来关联 Hook 和状态
数据结构	链表存储，顺序就是索引
条件问题	会破坏索引对应关系，导致状态错乱
最佳实践	顶层调用，条件逻辑移到 Hook 内部或拆分组件
检查工具	eslint-plugin-react-hooks 可以自动检查
一句话记住：Hooks 是 React 函数组件里的"固定节目单"，每次演出（渲染）都必须按同样的顺序表演，观众（React）才能准确知道谁是谁。

为什么 React 不重新绑定闭包？
你可能想问：每次重新渲染时，React 重新执行函数组件，为什么不根据新的调用顺序，重新生成能正确指向新格子的闭包呢？

理论上可以，但那样做会引发另一个严重的闭包问题：“过期闭包”。

考虑这个例子：

javascript
function Counter() {
  const [count, setCount] = useState(0);
  
  // 假设 React 每次渲染都重新绑定 setCount 指向的格子
  // 那下面这个 useEffect 捕获到的 setCount 就会是旧的
  useEffect(() => {
    const timer = setInterval(() => {
      // 如果 setCount 被重新绑定了，这里捕获的可能是旧引用
      setCount(count + 1); // 甚至可能引发无限循环
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  return <div>{count}</div>;
}
React 选择让闭包的指向稳定不变（基于首次渲染的顺序），这样每次渲染时，闭包始终指向它最初对应的那个内存格子。虽然格子里的值（memoizedState）会更新，但闭包本身不需要变。这其实是 React 有意设计的稳定引用策略，避免了因重新绑定引发的一系列复杂问题。



JS问题：如果项目中出现了内存泄漏导致页面崩溃，或者白屏，怎么排除问题
内存泄漏导致页面崩溃或白屏，通常是 JS 代码无限占用了可用内存，或者事件监听/定时器/闭包长期未被释放。遇到这种情况，可以按照下面这套排查和修复流程来定位问题。

1️⃣ 确认问题类型
首先，通过现象判断是内存泄漏还是渲染错误：

内存泄漏：页面用着用着变卡，最终崩溃。在 Chrome 任务管理器（Shift+Esc）中可以看到内存占用持续上涨不回落。

白屏/崩溃：页面突然一片空白或完全卡死。可以查看浏览器控制台（Console）是否有红色报错，或者使用 window.onerror 来捕获未被处理的异常。

2️⃣ 用 Chrome DevTools 定位泄漏点
这是最核心的排查手段。

第一步：拍下“快照”做对比 (Heap Snapshot)
打开开发者工具 → Memory 面板。

选择 Heap snapshot，点“Take snapshot”拍下第一张（正常状态）。

操作页面，重复几次你认为可能导致内存泄漏的动作（比如打开关闭弹窗、翻页）。

再次拍下第二张快照。

对比 (Comparison)：在第二张快照中选择 Summary 对比模式，重点看 # New（新增对象）和 # Delta（变化量）。

重点关注：闭包(closure)、数组(array)、HTML元素(HTMLDivElement) 这三类对象。如果它们的数量只增不减，很可能就是泄漏点。

搜索保留对象：可以在快照里搜索你怀疑泄漏的组件名（如 MyComponent），查看是否还有未释放的实例。

第二步：录制内存分配时间线 (Allocation instrumentation on timeline)
这个工具能帮你找出“谁在持续申请内存”。

在 Memory 面板，选择 Allocation instrumentation on timeline。

点击开始录制，然后去操作你觉得有问题的页面功能。

停止录制。时间线上会显示内存分配的柱状图。

重点关注：那些反复出现的蓝色长条。点击具体的蓝色柱子，可以看到是哪些函数或变量在持续占用内存。如果 (array) 或 (object) 反复出现且不被回收，就找到了疑点。

3️⃣ 常见内存泄漏场景及修复方案
🔸 场景一：全局变量和闭包
代码中可能不小心把数据挂到了 window 上，或者闭包误引用了大对象。

javascript
// ❌ 问题代码
function setup() {
    let largeData = new Array(1000000).fill('泄漏点');
    window.someGlobal = {
        leaked: largeData // 挂载到 window 上，永远无法被回收
    };
}

// ✅ 修复方案
function setup() {
    let largeData = new Array(1000000).fill('临时');
    processData(largeData);
    // 用完后手动解除引用
    largeData = null;
    // 如果必须挂全局，确保用完也能置空
    window.someGlobal = null;
}
🔸 场景二：定时器和事件监听未清理
这是最常见的问题。组件销毁了，但监听器还在。

javascript
// ❌ 问题代码（React示例）
useEffect(() => {
    const timer = setInterval(() => {
        console.log('定时任务');
    }, 1000);
    window.addEventListener('resize', handleResize);
    
    // ❌ 没有返回清理函数
}, []);

// ✅ 修复方案
useEffect(() => {
    const timer = setInterval(() => {
        console.log('定时任务');
    }, 1000);
    window.addEventListener('resize', handleResize);
    
    // ✅ 必须返回清理函数
    return () => {
        clearInterval(timer);
        window.removeEventListener('resize', handleResize);
    };
}, []);
🔸 场景三：DOM 节点被删除，但引用还在
删除了元素，但 JS 变量里还存着它的引用。

javascript
// ❌ 问题代码
let removedDiv = document.getElementById('container');
document.body.removeChild(removedDiv);
// 变量 removedDiv 还存着这个 DOM 节点的引用，导致它无法被垃圾回收

// ✅ 修复方案
let removedDiv = document.getElementById('container');
document.body.removeChild(removedDiv);
removedDiv = null; // 手动切断引用
🔸 场景四：Vue/React 中的 v-for 缺少 key
这在框架中虽然不直接等同于传统内存泄漏，但会导致 DOM 节点被大量重复创建和销毁，频繁触发垃圾回收，造成卡顿，表现类似内存问题。

vue
<!-- ❌ 问题代码（Vue） -->
<div v-for="item in list" :key="index">  
  <!-- 用 index 作 key，列表变化时所有子节点都要重建 -->
</div>

<!-- ✅ 修复方案 -->
<div v-for="item in list" :key="item.id">  
  <!-- 用唯一 id 作 key，列表变化时只移动/更新变更的节点 -->
</div>
4️⃣ 生产环境的监控手段
如果问题只在线上出现，本地难复现，可以加一层监控：

Performance API：监控内存趋势。

javascript
// 监控内存使用，超过阈值就上报
setInterval(() => {
    if (performance.memory) {
        const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
        const usagePercent = (usedJSHeapSize / jsHeapSizeLimit) * 100;
        if (usagePercent > 90) {
            // 上报日志到 Sentry 等平台
            console.error('内存占用过高', usagePercent);
        }
    }
}, 10000);
白屏监控：在入口文件设置一个定时器，检查页面根节点下是否有子元素。

javascript
let whiteScreenTimer = setInterval(() => {
    let app = document.getElementById('app');
    if (app && app.children.length === 0) {
        // 上报白屏事件
        reportError('白屏了');
        clearInterval(whiteScreenTimer);
    }
}, 5000);
5️⃣ 极简版排查路线图
看控制台：有无红色报错？是不是 JS 执行中断了？

看网络：是不是有接口挂了，导致前端拿不到数据，页面渲染为空？

看内存 (Performance)：录制操作，观察内存曲线是否只升不降。

看快照 (Heap Snapshot)：对比操作前后的快照，找出没被回收的 div 或 component。

查代码：重点搜索 setInterval、addEventListener、window.xxx、闭包 这些关键词。



函数式编程的理解

面试回答参考模板
1. 一句话开场（定义）
“在我看来，函数式编程是一种编程范式，它强调使用纯函数来进行计算，避免共享状态和可变数据。简单说，就是把复杂的逻辑拆分成一个个小而纯的函数，再组合起来解决问题。”

2. 核心特性（3-4个要点，边说边举例）
“函数式编程有几个核心特性，也是我平时写代码时会刻意运用的：

第一，纯函数。相同的输入永远得到相同的输出，并且没有副作用。比如一个加法函数，传入 1 和 2 永远返回 3，不会修改外部变量。这样的函数好处是可预测、易测试。

第二，不可变性。数据一旦创建就不能被修改，要改就返回新数据。比如在 React 里，我们从来不会直接修改 state，而是用 setState 传入新值。这能避免很多隐性的 bug。

第三，函数是一等公民。函数可以像变量一样传来传去，这让我们能写出高阶函数，比如数组的 map、filter，它们接收一个函数作为参数，让代码更声明式、更简洁。

第四，函数组合。把多个小函数组合成一个大函数，像流水线一样处理数据。比如先用 trim 去空格，再用 capitalize 首字母大写，最后加个感叹号——每个函数只做一件事，组合起来就完成了复杂任务。”

3. 实际应用（结合框架或工具）
“在实际工作中，函数式编程对我的影响很深。比如：

在 React 中，函数组件本身就是纯函数的理念——给定 props，返回固定的 UI。Hooks 也鼓励不可变更新，比如 setCount(count + 1) 而不是直接修改。Redux 的 reducer 更是纯函数的典范，每次返回全新的 state。

在工具函数库中，像 Lodash/fp 或 Ramda 都提供了很多函数式编程的工具，比如 pipe、curry，让我可以写出更优雅的数据处理管道。”

4. 平衡与个人理解（体现思考深度）
“当然，我觉得函数式编程不是银弹。如果纯粹追求函数式，可能会导致代码晦涩难懂，或者产生不必要的性能开销（比如每次都创建新对象）。

我的做法是：核心业务逻辑尽量写成纯函数，方便测试；边界部分（比如 I/O、DOM 操作）接受副作用，但要集中管理。函数式编程对我来说更像是一种思维工具——它让我更关注数据流、更谨慎地处理副作用，而不是在所有地方都用它。”

5. 总结（回归价值）
“所以我认为，函数式编程的核心价值不在于‘不用变量’或‘不写循环’，而在于通过限制可变性和副作用，让代码更可预测、更易维护。这种思想在任何项目中都值得借鉴。”