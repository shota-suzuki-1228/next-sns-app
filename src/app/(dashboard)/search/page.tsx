export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">検索</h1>
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="キーワードで検索..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                検索
              </button>
            </div>
          </form>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">検索結果が表示されます。</p>
        </div>
      </div>
    </div>
  )
}