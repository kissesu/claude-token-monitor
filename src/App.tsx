/**
 * @file 主应用组件
 * @description Claude Token Monitor 的根组件
 * @author Atlas.oi
 * @date 2026-01-08
 */

function App() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
          Claude Token Monitor
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Tauri 2.x + React 19 桌面应用
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md mx-auto">
          <p className="text-green-600 dark:text-green-400 font-medium">
            Phase 0 完成 - 项目初始化成功
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
