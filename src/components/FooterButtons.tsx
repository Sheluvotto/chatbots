import React from 'react';
import { BookOpen, Lightbulb, BarChart2, Camera, Code } from 'lucide-react';

const FooterButtons: React.FC = () => {
  const buttons = [
    { icon: <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />, label: 'Research' },
    { icon: <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5" />, label: 'Brainstorm' },
    { icon: <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5" />, label: 'Analyze Data' },
    { icon: <Camera className="h-4 w-4 sm:h-5 sm:w-5" />, label: 'Create images' },
    { icon: <Code className="h-4 w-4 sm:h-5 sm:w-5" />, label: 'Code' }
  ];

  return (
    <div className="flex justify-center flex-wrap gap-2 mt-4 sm:mt-6">
      {buttons.map((button, index) => (
        <button
          key={index}
          className="flex items-center justify-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-colors"
        >
          {button.icon}
          <span className="text-xs sm:text-sm hidden sm:inline">{button.label}</span>
        </button>
      ))}
    </div>
  );
};

export default FooterButtons;