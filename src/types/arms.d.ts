/**
 * ARMS 前端监控 SDK 类型声明
 */

declare module '@arms/js-sdk' {
  interface ARMSConfig {
    pid: string;
    imgUrl?: string;
    page?: string;
    sample?: number;
    enableSPA?: boolean;
    parseHash?: (hash: string) => string;
    disableHook?: boolean;
    autoSendPv?: boolean;
    sendResource?: boolean;
    ignoreUrlCase?: boolean;
    urlHelper?: any;
    apiHelper?: any;
  }

  interface ARMSInstance {
    /**
     * 修改配置项
     */
    setConfig(config: Partial<ARMSConfig>): void;
    
    /**
     * 设置当前页面的 page name
     */
    setPage(page: string, sendPv?: boolean): void;
    
    /**
     * 移除 AJAX 请求监听
     */
    removeHook(): void;
    
    /**
     * 挂载 API 监听 hook
     */
    addHook(isForce?: boolean): void;
    
    /**
     * 创建新的实例
     */
    createInstance(config: Partial<ARMSConfig>): ARMSInstance;
    
    /**
     * 接口调用成功率上报
     */
    api(api: string, success: boolean, time: number, code?: string | number, msg?: string): void;
    
    /**
     * 错误信息上报
     */
    error(error: Error, pos?: {
      filename?: string;
      lineno?: number;
      colno?: number;
    }): void;
    
    /**
     * 自定义测速上报
     * @param point 测速关键字，必须是 s0 ~ s10
     * @param time 耗时(毫秒)
     */
    speed(point: string, time: number): void;
    
    /**
     * 求和统计
     */
    sum(key: string, value?: number): void;
    
    /**
     * 求平均统计
     */
    avg(key: string, value?: number): void;
    
    /**
     * 百分比统计
     */
    percent(key: string, subkey: string, value?: number): void;
    
    /**
     * 设置公共信息
     */
    setCommonInfo(info: Record<string, string>): void;
  }

  /**
   * 获取单例对象
   */
  export function singleton(config: ARMSConfig, prePipe?: any[]): ARMSInstance;
  
  /**
   * 创建新实例
   */
  export function createInstance(config: ARMSConfig): ARMSInstance;

  const BrowserLogger: {
    singleton: typeof singleton;
    createInstance: typeof createInstance;
  };

  export default BrowserLogger;
}
