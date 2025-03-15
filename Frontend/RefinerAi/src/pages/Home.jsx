import React from 'react';
// import Repos from '../components/repos'
import RepoExplorer from '../components/Repoexplorer.jsx';
import CodeDisplay from '../components/CodeDisplay.jsx';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/userContext.jsx';  
import LandingNavBar from '../components/LandingNavBar.jsx';
import Landingbox from '../components/Landingbox.jsx';
import LandingInfos from '../components/LandingInfos.jsx';
import LandingFooter from '../components/LandingFooter.jsx';

function Home({userData}) {
  const navigate = useNavigate();
  const { setUser } = useUser(); 

  return (
  <div className="">
    <div className='m-[20px]'>
        <LandingNavBar userData={userData}/>
      </div>
      <Landingbox/>
        <LandingInfos/>
        <LandingFooter/>
    </div>
    // <div>
    //   <h1 className='text-5xl'>Home</h1>
    //   <h1>Welcome, {userData.login}!</h1>
    //       {userData.avatar_url && <img src={userData.avatar_url} alt="Avatar" width="100" style={{ borderRadius: '50%' }} />}
    //       <p>Name: {userData.login || 'Not provided'}</p>
    //       <p>URL: <a href={userData.html_url} target="_blank" rel="noopener noreferrer">{userData.html_url}</a></p>

    //   <button className='m-9' onClick={() => { 
        
    //         localStorage.removeItem("accessToken"); 
    //         console.log("pressed")
    //         setUser(null);  // Clear user data in context
    //       }}>
    //         Logout
    //   </button>
    //   <CodeDisplay/>
    //       {/* <Repos/> */}
    //       <RepoExplorer owner={userData.login}  repo={'fake-instagram'} />

    // </div>
  );
}

export default Home;
