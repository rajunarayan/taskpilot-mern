module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // safelist ensures these classes are always included in the generated CSS
  safelist: [
    'min-h-screen','bg-gray-50','p-6','max-w-4xl','mx-auto',
    'bg-white','p-6','rounded','shadow','text-2xl','font-bold',
    'text-lg','text-sm','text-gray-600','text-gray-500',
    'flex','items-center','justify-between','gap-2','gap-3',
    'px-3','py-1','px-4','py-2','bg-blue-600','text-white',
    'bg-red-500','bg-green-600','border','underline','flex-1'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
