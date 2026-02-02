/**
 * 地图页面静态样式配置
 * 使用 useMemo 缓存的静态样式对象，避免每次渲染都创建新对象
 */

// 搜索面板容器样式
export const searchPanelContainerStyle = {
  position: 'absolute' as const,
  left: 12,
  top: 12,
  zIndex: 3000,
  pointerEvents: 'auto' as const,
};

// 历史下拉框样式
export const historyDropdownStyle = (width: number) => ({
  position: 'absolute' as const,
  top: 60,
  left: 0,
  width,
  background: '#fff',
  borderRadius: 6,
  boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
  zIndex: 1300,
});

// 分类图标样式
export const categoryIconStyle = {
  flex: '1 1 0' as const,
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center' as const,
  gap: 6,
  padding: 6,
  cursor: 'pointer',
  borderRadius: 10,
  background: '#fafafa',
};

// 分类图标内部样式
export const categoryIconInnerStyle = {
  width: 44,
  height: 44,
  borderRadius: 8,
  background: '#fff',
  border: '1px solid #eee',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
};

// 地图容器样式
export const mapContainerStyle = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
  overflow: 'hidden' as const,
  zIndex: 0,
};

// 搜索记录标题栏样式
export const historyTitleStyle = {
  display: 'flex',
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
  marginBottom: 6,
  padding: '0 6px',
};

// 历史记录项样式
export const historyItemStyle = {
  padding: '8px 6px',
  borderBottom: '1px solid #f0f0f0',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
};

// 分类图标容器样式
export const categoryIconsContainerStyle = {
  display: 'flex',
  gap: 8,
  padding: '6px 4px',
  marginBottom: 6,
};

// 历史下拉内容容器样式
export const historyContentStyle = (visible: boolean) => ({
  padding: visible ? 8 : 0,
});

// 历史列表容器样式
export const historyListStyle = {
  maxHeight: 180,
  overflow: 'auto' as const,
};

// 在此区域搜索按钮样式
export const searchInAreaButtonStyle = {
  position: 'absolute' as const,
  left: '50%',
  bottom: 50,
  transform: 'translateX(-50%)',
  zIndex: 1100,
};

// 调试信息面板样式
export const debugInfoStyle = {
  position: 'absolute' as const,
  top: '10px',
  right: '10px',
  background: 'rgba(0,0,0,0.7)',
  color: 'white',
  padding: '5px 10px',
  borderRadius: 4,
  fontSize: 12,
  zIndex: 1000,
};
