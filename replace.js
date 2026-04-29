const fs = require('fs');
let content = fs.readFileSync('components/UserProfile.tsx', 'utf8');

// 1. Container and Modal Overlay
content = content.replace(
  /bg-white\/95 dark:bg-gray-900\/95 backdrop-blur-2xl rounded-3xl max-w-5xl w-full max-h-\[90vh\] overflow-hidden shadow-2xl border border-gray-200\/50 dark:border-gray-800\/50/g,
  'bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative z-10'
);

// 2. Header
content = content.replace(
  /relative p-8 border-b border-gray-200\/50 dark:border-gray-800\/50 bg-gradient-to-r from-blue-50\/50 via-purple-50\/30 to-pink-50\/50 dark:from-blue-900\/20 dark:via-purple-900\/10 dark:to-pink-900\/20/g,
  'relative p-8 border-b border-white/10'
);
content = content.replace(
  /bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent/g,
  'text-white'
);

// 3. Progress Steps Bar
content = content.replace(
  /px-8 py-6 border-b border-gray-200\/50 dark:border-gray-800\/50 bg-gray-50\/50 dark:bg-gray-800\/20/g,
  'px-8 py-6 border-b border-white/10'
);
content = content.replace(
  /bg-blue-500 text-white/g,
  'bg-purple-500/10 border border-purple-500 text-white' // Progress active + buttons
);
content = content.replace(
  /bg-green-500 text-white/g,
  'bg-blue-500/10 border border-blue-500 text-white' // Progress done
);
content = content.replace(
  /bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400/g,
  'bg-black/50 border border-white/10 text-gray-500 hover:text-gray-300'
);

// Progress Lines
content = content.replace(
  /w-8 h-0\.5 bg-green-500/g,
  'w-8 h-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500'
);
content = content.replace(
  /w-8 h-0\.5 bg-gray-300 dark:bg-gray-600/g,
  'w-8 h-1 rounded-full bg-gray-800'
);

// 4. Inputs and Selects
content = content.replace(
  /text-gray-700 dark:text-gray-300/g,
  'text-gray-300'
);
content = content.replace(
  /bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent/g,
  'bg-black/50 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors'
);
content = content.replace(
  /p-3 border border-gray-300 dark:border-gray-600 rounded-lg/g,
  'p-4 rounded-xl border border-white/10'
);
content = content.replace(
  /p-2 border border-gray-300 dark:border-gray-600 rounded-lg/g,
  'p-4 rounded-xl border border-white/10'
);

// 5. Choice Buttons (Unselected state)
content = content.replace(
  /bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600/g,
  'bg-black/50 border-white/10 text-gray-400 hover:border-white/30'
);
content = content.replace(
  /bg-gray-100 dark:bg-gray-700 text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed/g,
  'bg-black/50 border-white/10 text-gray-600 cursor-not-allowed'
);

// 6. Choice Buttons (Selected state)
content = content.replace(/border-blue-500 text-white/g, 'text-white'); // Fix any double-replace
content = content.replace(
  /bg-purple-500\/10 border text-white border-blue-500/g,
  'bg-purple-500/10 border border-purple-500 text-white'
);
content = content.replace(/border-green-500/g, 'border-teal-500');
content = content.replace(/bg-blue-500\/10 border/g, 'bg-teal-500/10 border');
content = content.replace(/bg-purple-500 text-white border-purple-500/g, 'bg-purple-500/10 text-white border-purple-500');
content = content.replace(/bg-indigo-500 text-white border-indigo-500/g, 'bg-indigo-500/10 text-white border-indigo-500');

// 7. Small tags (Pills)
content = content.replace(/bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200/g, 'bg-blue-500/20 text-blue-300 border border-blue-500/30');
content = content.replace(/bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200/g, 'bg-teal-500/20 text-teal-300 border border-teal-500/30');
content = content.replace(/bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200/g, 'bg-purple-500/20 text-purple-300 border border-purple-500/30');
content = content.replace(/bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200/g, 'bg-orange-500/20 text-orange-300 border border-orange-500/30');
content = content.replace(/bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200/g, 'bg-red-500/20 text-red-300 border border-red-500/30');
content = content.replace(/bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200/g, 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30');

// 8. Summary & Footer
content = content.replace(/bg-gray-50 dark:bg-gray-800/g, 'bg-black/50 border border-white/10');
content = content.replace(/text-gray-900 dark:text-white/g, 'text-white');
content = content.replace(/bg-blue-50 dark:bg-blue-900\/20/g, 'bg-blue-500/10 border border-blue-500/20');
content = content.replace(/text-blue-900 dark:text-blue-100/g, 'text-blue-200');
content = content.replace(/text-blue-800 dark:text-blue-200/g, 'text-blue-300');
content = content.replace(/border-t border-gray-200 dark:border-gray-800/g, 'border-t border-white/10');
content = content.replace(/text-gray-600 dark:text-gray-400/g, 'text-gray-400 hover:text-white');
content = content.replace(/bg-gradient-to-r from-blue-500 to-purple-500/g, 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-500/25');
content = content.replace(/hover:from-blue-600 hover:to-purple-600/g, 'hover:from-purple-500 hover:to-blue-500');
content = content.replace(/bg-gradient-to-r from-green-500 to-blue-500/g, 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-500/25');
content = content.replace(/hover:from-green-600 hover:to-blue-600/g, 'hover:from-purple-500 hover:to-blue-500');

// Fix text color for modal headers
content = content.replace(/text-gray-900 dark:text-white/g, 'text-white');
content = content.replace(/text-gray-600 dark:text-gray-400/g, 'text-gray-400');
content = content.replace(/text-gray-500 dark:text-gray-400/g, 'text-gray-400');
content = content.replace(/bg-gray-100\/80 dark:bg-gray-800\/80/g, 'bg-white/10');

// Write out the replaced content
fs.writeFileSync('components/UserProfile.tsx', content, 'utf8');
console.log('Script completed');
