import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dna, Search, BookOpen, Share2 } from 'lucide-react';
import SearchBar from '../components/SearchBar';

export default function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Search className="h-6 w-6 text-indigo-600" />,
      title: 'Advanced Search',
      description: 'Search through millions of protein structures with our powerful search engine.',
    },
    {
      icon: <Dna className="h-6 w-6 text-indigo-600" />,
      title: '3D Visualization',
      description: 'Explore protein structures in stunning 3D with our interactive viewer.',
    },
    {
      icon: <BookOpen className="h-6 w-6 text-indigo-600" />,
      title: 'Educational Resources',
      description: 'Learn about protein structure and function with our comprehensive guides.',
    },
    {
      icon: <Share2 className="h-6 w-6 text-indigo-600" />,
      title: 'Collaboration Tools',
      description: 'Share and discuss protein structures with colleagues and students.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="relative pt-16">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-200 to-indigo-400 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center pt-24 sm:pt-32">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Explore Protein Structures with Confidence
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Access and visualize protein structures from AlphaFold DB and UniProt. Perfect for
              students, educators, and researchers in molecular biology.
            </p>
            <div className="mt-10">
              <SearchBar />
            </div>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
              {features.map((feature) => (
                <div key={feature.title} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    {feature.icon}
                    {feature.title}
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-16 sm:mt-24 flex justify-center">
            <button
              onClick={() => navigate('/search')}
              className="rounded-md bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Start Exploring
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}