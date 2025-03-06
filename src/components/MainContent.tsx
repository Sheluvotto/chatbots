import React from 'react';

interface MainContentProps {
  greeting: string;
  name: string;
}

const MainContent: React.FC<MainContentProps> = ({ greeting, name }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <h1 className="text-white text-2xl font-normal mb-2">{greeting}, {name}.</h1>
      <p className="text-gray-300 text-xl font-light">How can I help you today?</p>
    </div>
  );
};

export default MainContent;