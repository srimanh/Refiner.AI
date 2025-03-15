import { useEffect, useState } from 'react';
import { useUser } from '../context/userContext.jsx';  
import { useNavigate } from 'react-router-dom';

function Repos() {
  const [repos, setRepos] = useState([]);
  const [filteredRepos, setFilteredRepos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useUser(); 
  const username = user?.login;
  const navigate = useNavigate();

  const openRepo = (repoUrl) => {
    navigate('/repoviewer', { state: { repoUrl } });
  };

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api.github.com/users/${username}/repos?sort=created&direction=desc`);
      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }
      const data = await response.json();
      setRepos(data);
      setFilteredRepos(data);
    } catch (error) {
      setError(error.message);
      setRepos([]);
      setFilteredRepos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRepos();
  }, [username]);

  // Format the timestamp into "3 hours ago" format
  const formatRelativeTime = (timestamp) => {
    const pastDate = new Date(timestamp);
    const currentDate = new Date();
    const diffInSeconds = Math.floor((currentDate - pastDate) / 1000);

    const timeUnits = [
      { unit: "year", seconds: 31536000 },
      { unit: "month", seconds: 2592000 },
      { unit: "day", seconds: 86400 },
      { unit: "hour", seconds: 3600 },
      { unit: "minute", seconds: 60 },
      { unit: "second", seconds: 1 },
    ];

    for (let { unit, seconds } of timeUnits) {
      const interval = Math.floor(diffInSeconds / seconds);
      if (interval >= 1) {
        return `${interval} ${unit}${interval !== 1 ? "s" : ""} ago`;
      }
    }

    return "Just now";
  };

  // Handle search input changes (Debounced for performance)
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      const filtered = repos.filter(repo => 
        repo.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRepos(filtered);
    }, 300); // Debounce search to prevent excessive filtering

    return () => clearTimeout(delaySearch);
  }, [searchTerm, repos]);

  return (
    <div className='text-white m-7 w-full'>
      <h1 className='text-[2rem]'>Your Repos</h1>

      {/* Search Bar with Micro-Interaction */}
      <input 
        type="text" 
        placeholder='Search repos' 
        className='border-[#ffffffa7] border-[1px] w-full p-2 bg-transparent mt-2 outline-none focus:ring-2 focus:ring-[#ffffffa7] transition-all duration-300' 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />  

      <div className="h-screen overflow-y-scroll mt-4">
        {loading ? (
          <p className="text-center text-gray-400">Loading repositories...</p>
        ) : error ? (
          <p className="text-red-500 text-center">{error}</p>
        ) : filteredRepos.length === 0 ? (
          <p className="text-gray-400 text-center">No repositories found</p>
        ) : (


          <ul className='flex flex-col'>
            <div className='flex justify-between border-b border-gray-500 text-[#ffffffa7] mt-3 pb-2 text-sm'>
              
            <div className='w-1/2 text-white text-[1.1rem]'>Recent Repos</div>
            <div className='w-1/4 text-center text-white text-[1.1rem]' >Languages</div>
            <div className='w-1/4 text-right text-white text-[1.1rem]'>Last Updated</div>
            </div> 
            {filteredRepos.map((repo) => (
              <button 
                className='border-b group border-white py-3 w-full text-left transition-transform duration-200 hover:scale-[1.02] hover:bg-[#ffffff0d] hover:shadow-lg'
                key={repo.id} 
                onClick={() => openRepo(repo.html_url)}
              >
                <div className='flex items-center justify-between w-full'>
                  {/* Left Side: Repo Icon + Name */}
                  <div className='flex items-center space-x-4'>
                    <div className='group-hover:bg-white border-[0.5px] h-[20px] w-[20px] transition-all duration-300'></div>
                    <li className='text-white text-[1.1rem] group-hover:text-[#ffffffc0] transition-all duration-300'>{repo.name}</li>
                  </div>

                  {/* Right Side: Language & Last Push Time */}
                  <div className='flex justify-between w-1/2 text-[#ffffffa7] text-sm'>
                     <li className='text-center w-1/2'>{repo.language}</li>
                    <li className='text-right w-1/2'>Last push {formatRelativeTime(repo.pushed_at)}</li>
                  </div>
                </div>
              </button>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Repos;




// <div className='flex justify-between w-1/2 text-[#ffffffa7] text-sm'>
// <li className='text-center w-1/2'>{repo.language || "N/A"}</li>
// <li className='text-right w-1/2'>Last push {formatRelativeTime(repo.pushed_at)}</li>
// </div>